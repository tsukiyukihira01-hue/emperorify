import { Position, Army, Province } from '../components/index.js'
export class AISystem{
  reads=new Set([Position,Army,Province]); writes=new Set(); phase='ai'
  update(world,events,dt){
    const owners=new Map()
    for(const[,[p,pr]] of world.query(Position,Province)) owners.set(p.provinceId,pr.ownerId)
    let orders=0
    for(const[eid,[pos,army]] of world.query(Position,Army)){
      if(army.troops<=0) continue
      if(army.morale<0.3){
        const f=[...owners.entries()].filter(([,o])=>o===army.ownerId)
        if(!f.length) continue
        const [tid]=f[Math.floor(Math.random()*f.length)]
        events.emit('order_move',{entityId:eid,targetProvinceId:tid,speed:2.5}); orders++; continue
      }
      if(Math.random()<0.045){
        const want=Math.random()<0.7
        let c=[...owners.entries()].filter(([,o])=>want?o!==army.ownerId:o===army.ownerId)
        if(!c.length) c=[...owners.entries()]
        const [tid]=c[Math.floor(Math.random()*c.length)]
        events.emit('order_move',{entityId:eid,targetProvinceId:tid,speed:1.2}); orders++
      }
    }
    if(orders) events.emit('ai_orders',{count:orders})
  }
}
