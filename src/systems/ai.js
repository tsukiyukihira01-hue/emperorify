import { Position, Army, Province, PLAYER_HOUSE } from '../components/index.js'
export class AISystem{
  reads=new Set([Position, Army, Province]); writes=new Set(); phase='ai'
  update(world, events, dt){
    const fiefOwner=new Map(); for(const[,[pos,prov]] of world.query(Position, Province)) fiefOwner.set(pos.provinceId,prov.ownerId)
    let orders=0
    for(const [eid,[pos,army]] of world.query(Position, Army)){
      if(army.ownerId===PLAYER_HOUSE) continue
      if(army.troops<=0) continue
      if(army.morale<0.28){ const friendly=[...fiefOwner.entries()].filter(([,o])=>o===army.ownerId); if(!friendly.length) continue; const [tid]=friendly[Math.floor(Math.random()*friendly.length)]; events.emit('order_move',{entityId:eid,targetProvinceId:tid,reason:'rout',speed:2.3}); orders++; continue }
      if(Math.random()<0.044){ const wantEnemy=Math.random()<0.72; let cands=[...fiefOwner.entries()].filter(([,o])=>wantEnemy?o!==army.ownerId:o===army.ownerId); if(!cands.length) cands=[...fiefOwner.entries()]; const [tid]=cands[Math.floor(Math.random()*cands.length)]; events.emit('order_move',{entityId:eid,targetProvinceId:tid,reason:wantEnemy?'raid':'garrison',speed:1.15}); orders++ }
    }
    if(orders) events.emit('ai_orders',{count:orders})
  }
}

