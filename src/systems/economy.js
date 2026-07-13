import { Province, Economy, TradeRoute } from '../components/index.js'

export class EconomySystem{
  reads=new Set([Province, TradeRoute, Economy])
  writes=new Set([Economy])
  phase='economy'
  update(world, events, dt){
    const taxByOwner=new Map()
    for(const[,[prov]] of world.query(Province)){
      taxByOwner.set(prov.ownerId,(taxByOwner.get(prov.ownerId)||0)+prov.tax)
    }
    const tradeByOwner=new Map()
    for(const[,[route]] of world.query(TradeRoute)){
      if(!route.active) continue
      tradeByOwner.set(route.ownerId,(tradeByOwner.get(route.ownerId)||0)+route.value)
    }

    // ensure Economy entities exist per owner
    const econMap=new Map()
    for(const[eid,[econ]] of world.query(Economy)){
      const oid=econ.ownerId||0
      econMap.set(oid,{eid,econ})
    }
    for(const owner of taxByOwner.keys()){
      if(!econMap.has(owner)){
        const eid=world.createEntity()
        const ne=new Economy(200,0,owner)
        world.addComponent(eid,ne)
        econMap.set(owner,{eid,econ:ne})
      }
    }

    for(const[owner,{econ}] of econMap){
      const tax=taxByOwner.get(owner)||0
      const trade=tradeByOwner.get(owner)||0
      const income=tax+trade
      econ.income=income
      econ.gold+=income*0.1*dt
      if(!Number.isFinite(econ.gold)) econ.gold=0
    }

    events.emit('economy_tick',{tax: Object.fromEntries(taxByOwner), trade: Object.fromEntries(tradeByOwner)})
  }
}
