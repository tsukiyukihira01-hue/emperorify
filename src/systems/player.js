import { Position, Province, Army, Economy, Building, PLAYER_HOUSE, hasUnlock, TROOP_CATALOG } from '../components/index.js'
export class PlayerSystem{
  reads=new Set([Position, Province, Army, Economy, Building]); writes=new Set(); phase='input'
  update(world, events, dt){
    for(const i of events.drain('player_move_army')){ const army=world.getComponent(i.armyId, Army); if(!army||army.ownerId!==PLAYER_HOUSE) continue; events.emit('order_move',{entityId:i.armyId,targetProvinceId:i.targetProvinceId,reason:'player',speed:1.7}) }
    for(const i of events.drain('player_recruit')){
      const entry=[...world.query(Position, Province)].find(([, [p]])=>p.provinceId===i.provinceId); if(!entry) continue; const [, [,prov]]=entry; if(prov.ownerId!==PLAYER_HOUSE){ events.emit('player_order_failed',{reason:'not your fief'}); continue }
      const econ=[...world.query(Economy)].find(([, [e]])=>e.ownerId===PLAYER_HOUSE)?.[1]?.[0]; if(!econ) continue
      const comp=i.comp; // check unlocks for T2 units in comp
      for(const [k,v] of Object.entries(comp)){ if(v>0){ const def=TROOP_CATALOG[k]; if(def?.unlock && !hasUnlock(PLAYER_HOUSE,world,def.unlock)){ events.emit('player_order_failed',{reason:`need ${Object.entries(def.unlock).map(([t,l])=>t+' '+l).join(' & ')} for ${def.name}`}); return } } }
      const cost=Math.floor((comp.militia||0)*0.9 + (comp.man_at_arms||0)*2.2 + (comp.light_cavalry||0)*1.9 + (comp.knight||0)*4.4 + (comp.archer||0)*1.5 + (comp.longbowman||0)*2.4)
      if(econ.gold<cost){ events.emit('player_order_failed',{reason:'no gold',need:cost,have:Math.floor(econ.gold)}); continue }
      if(prov.manpower<42){ events.emit('player_order_failed',{reason:'no levy'}); continue }
      econ.gold-=cost; prov.manpower-=50; events.emit('order_recruit',{provinceId:i.provinceId,ownerId:PLAYER_HOUSE,comp}); events.emit('player_order_issued',{type:'recruit',comp})
    }
    for(const i of events.drain('player_build')){
      const econ=[...world.query(Economy)].find(([, [e]])=>e.ownerId===PLAYER_HOUSE)?.[1]?.[0]; if(!econ||econ.gold<62){ events.emit('player_order_failed',{reason:'no gold build'}); continue }
      econ.gold-=62; const eid=world.createEntity(); world.addComponent(eid,new Building(i.provinceId,i.kind||'manor',1,PLAYER_HOUSE)); events.emit('edifice_raised',{house:PLAYER_HOUSE,kind:i.kind,fiefId:i.provinceId,byPlayer:true})
    }
  }
}
