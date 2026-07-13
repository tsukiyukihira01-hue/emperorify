import { Position, Army, Province } from '../components/index.js'
export class AISystem{
  reads=new Set([Position, Army, Province])
  writes=new Set()
  phase='ai'
  update(world, events, dt){
    const provinceOwner=new Map()
    for(const [,_posProv] of world.query(Position, Province)){ const [pPos,prov]=_posProv; provinceOwner.set(pPos.provinceId, prov.ownerId) }
    let orders=0
    for(const [eid, [pos, army]] of world.query(Position, Army)){
      if(army.troops<=0) continue
      if(army.morale<0.3){
        const friendly=[...provinceOwner.entries()].filter(([,o])=>o===army.ownerId)
        if(friendly.length===0) continue
        const [tid]=friendly[Math.floor(Math.random()*friendly.length)]
        events.emit('order_move',{entityId:eid, targetProvinceId:tid, reason:'retreat', speed:2.5}); orders++; continue
      }
      if(Math.random()<0.045){
        const wantEnemy=Math.random()<0.7
        let cands=[...provinceOwner.entries()].filter(([,o])=>wantEnemy?o!==army.ownerId:o===army.ownerId)
        if(cands.length===0) cands=[...provinceOwner.entries()]
        const [tid]=cands[Math.floor(Math.random()*cands.length)]
        events.emit('order_move',{entityId:eid, targetProvinceId:tid, reason:wantEnemy?'attack':'reinforce', speed:1.2}); orders++
      }
    }
    if(orders>0) events.emit('ai_orders',{count:orders})
  }
}
