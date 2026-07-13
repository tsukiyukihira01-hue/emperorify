import { Province, Economy, Building } from '../components/index.js'

/**
 * BuilderSystem - SAFE plugin
 * Only writes Building. Never writes Province, Economy, Position, Army.
 * EconomySystem reads Building for bonus income.
 * AI decides what to build based on gold and needs.
 */
export class BuilderSystem{
  reads=new Set([Province, Economy, Building])
  writes=new Set([Building])
  phase='economy'
  update(world, events, dt){
    const provByOwner=new Map()
    const countByProv=new Map()
    for(const[,[prov]] of world.query(Province)){
      if(!provByOwner.has(prov.ownerId)) provByOwner.set(prov.ownerId,[])
      provByOwner.get(prov.ownerId).push(prov)
    }
    for(const[,[b]] of world.query(Building)){
      countByProv.set(b.provinceId,(countByProv.get(b.provinceId)||0)+1)
    }
    const econByOwner=new Map()
    for(const[,[econ]] of world.query(Economy)){ econByOwner.set(econ.ownerId,{econ}) }

    let built=0, upgraded=0
    for(const [owner, provs] of provByOwner){
      const econ=econByOwner.get(owner)?.econ
      if(!econ||econ.gold<80) continue
      if(Math.random()<0.04){
        const prov=provs[Math.floor(Math.random()*provs.length)]
        const existing=[...world.query(Building)].filter(([, [b]])=>b.provinceId===prov.ownerId*100+provs.indexOf(prov)).length
        // cap 2 buildings per province for demo
        const pid=prov.ownerId*1000+Math.floor(Math.random()*100)
        const types=['farm','market','barracks']
        const type= econ.gold>200 && Math.random()<0.3 ? 'market' : Math.random()<0.5 ? 'farm' : 'barracks'
        const level=1
        const eid=world.createEntity()
        const bd=new Building(pid,type,level,owner)
        world.addComponent(eid,bd)
        econ.gold-=60
        built++
        events.emit('building_built',{owner,type,provinceId:pid})
      }
    }
    // upgrade random building
    const allBuildings=[...world.query(Building)]
    if(allBuildings.length&&Math.random()<0.02){
      const [eid,[b]]=allBuildings[Math.floor(Math.random()*allBuildings.length)]
      const econ=econByOwner.get(b.ownerId)?.econ
      if(econ&&econ.gold>120&&b.level<3){ b.level++; econ.gold-=100; upgraded++; events.emit('building_upgraded',{owner:b.ownerId,type:b.type,level:b.level}) }
    }
    if(built||upgraded) events.emit('builder_tick',{built,upgraded,total:allBuildings.length+built})
  }
}
