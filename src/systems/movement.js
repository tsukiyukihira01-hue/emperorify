import { Position, Army, Province } from '../components/index.js'
export class MovementSystem{
  reads=new Set([Position,Army,Province]); writes=new Set([Position]); phase='movement'
  update(world,events,dt){
    const pp=new Map()
    for(const[,[p]] of world.query(Position,Province)) pp.set(p.provinceId,p)
    const orders=events.drain('order_move')
    for(const o of orders){
      const pos=world.getComponent(o.entityId,Position); if(!pos) continue
      const t=pp.get(o.targetProvinceId); if(!t) continue
      pos._tx=t.x+20; pos._ty=t.y+50; pos._speed=o.speed||1.2; pos.provinceId=o.targetProvinceId
    }
    let m=0
    for(const[eid,[pos,army]] of world.query(Position,Army)){
      if(army.troops<=0) continue
      if(pos._tx!==undefined){
        const dx=pos._tx-pos.x, dy=pos._ty-pos.y, d=Math.hypot(dx,dy)
        if(d<3){ delete pos._tx; delete pos._ty; delete pos._speed } else { const s=(pos._speed||1.2)*2.4*dt; pos.x+=dx/d*s; pos.y+=dy/d*s; m++ }
      } else { pos.x+=Math.sin(eid+Date.now()*0.00008)*0.05*dt; pos.y+=Math.cos(eid+Date.now()*0.00008)*0.05*dt }
    }
    if(m) events.emit('armies_moving',{count:m})
  }
}
