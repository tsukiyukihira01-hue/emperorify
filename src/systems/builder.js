import { Province, Economy, Building, PLAYER_HOUSE } from '../components/index.js'
export class BuilderSystem{
  reads=new Set([Province, Economy, Building]); writes=new Set([Building]); phase='economy'
  update(world,events,dt){
    const fiefsByHouse=new Map(); for(const[,[f]] of world.query(Province)){ if(!fiefsByHouse.has(f.ownerId)) fiefsByHouse.set(f.ownerId,[]); fiefsByHouse.get(f.ownerId).push(f) }
    const coffers=new Map(); for(const[,[c]] of world.query(Economy)) coffers.set(c.ownerId,c)
    let built=0, upgraded=0
    for(const [hid] of fiefsByHouse){
      if(hid===PLAYER_HOUSE) continue
      const coffer=coffers.get(hid); if(!coffer||coffer.gold<78) continue
      if(Math.random()<0.034){ const pid=hid*1000+Math.floor(Math.random()*100); const type=coffer.gold>240&&Math.random()<0.30?'market':Math.random()<0.46?'manor':Math.random()<0.80?'keep':'abbey'; const eid=world.createEntity(); world.addComponent(eid,new Building(pid,type,1,hid)); coffer.gold-=54; built++ }
    }
    const all=[...world.query(Building)]; if(all.length&&Math.random()<0.028){ const [, [b]]=all[Math.floor(Math.random()*all.length)]; const coffer=coffers.get(b.ownerId); if(coffer&&coffer.gold>125&&b.level<3){ b.level++; coffer.gold-=105; upgraded++ } }
    if(built||upgraded) events.emit('steward_tick',{built,upgraded})
  }
}
