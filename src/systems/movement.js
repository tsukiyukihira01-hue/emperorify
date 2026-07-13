import { Position, Army, Province } from '../components/index.js'
export class MovementSystem{
  reads=new Set([Position, Army, Province])
  writes=new Set([Position])
  phase='movement'
  update(world, events, dt){
    const provincePos=new Map()
    for(const [, [pPos]] of world.query(Position, Province)){ provincePos.set(pPos.provinceId, pPos) }
    const orders=events.drain('order_move')
    for(const o of orders){
      const pos=world.getComponent(o.entityId, Position)
      if(!pos) continue
      const target=provincePos.get(o.targetProvinceId)
      if(!target) continue
      pos._tx=target.x+20; pos._ty=target.y+50; pos._speed=o.speed||1.2; pos.provinceId=o.targetProvinceId
    }
    let moved=0
    for(const [eid, [pos, army]] of world.query(Position, Army)){
      if(army.troops<=0) continue
      if(pos._tx!==undefined){
        const dx=pos._tx-pos.x, dy=pos._ty-pos.y, dist=Math.hypot(dx,dy)
        if(dist<3){ delete pos._tx; delete pos._ty; delete pos._speed }else{ const s=(pos._speed||1.2)*2.4*dt; pos.x+=(dx/dist)*s; pos.y+=(dy/dist)*s; moved++ }
      }else{ pos.x+=Math.sin(eid+Date.now()*0.00008)*0.05*dt; pos.y+=Math.cos(eid+Date.now()*0.00008)*0.05*dt }
    }
    if(moved) events.emit('armies_moving',{count:moved})
  }
}
