import { Position, Army, Province } from '../components/index.js'

export class MovementSystem {
  reads = new Set([Position, Army, Province])
  writes = new Set([Position])
  phase = 'movement'

  update(world, events, dt){
    // Build provinceId -> world position lookup
    const provincePos = new Map()
    for(const [, [pPos]] of world.query(Position, Province)){
      provincePos.set(pPos.provinceId, pPos)
    }

    // Handle AI orders - this is the ONLY place Position is written from orders
    const orders = events.drain('order_move')
    for(const o of orders){
      const pos = world.getComponent(o.entityId, Position)
      const army = world.getComponent(o.entityId, Army)
      if(!pos || !army) continue
      const target = provincePos.get(o.targetProvinceId)
      if(!target) continue
      // set intermediate target, movement will lerp toward it
      // store target in a hidden field on Position (still same component, safe because only this system writes it)
      pos._tx = target.x + 20
      pos._ty = target.y + 50
      pos._speed = o.speed || 1.0
      pos.provinceId = o.targetProvinceId // logical province changes when order accepted
    }

    let moved = 0
    for(const [eid, [pos, army]] of world.query(Position, Army)){
      if(army.troops<=0) continue
      if(pos._tx !== undefined){
        const dx = pos._tx - pos.x
        const dy = pos._ty - pos.y
        const dist = Math.hypot(dx, dy)
        if(dist < 2){
          delete pos._tx; delete pos._ty; delete pos._speed
        } else {
          const s = (pos._speed||1.0) * 2.2 * dt
          pos.x += (dx/dist)*s
          pos.y += (dy/dist)*s
          moved++
        }
      } else {
        // idle drift when no order
        pos.x += Math.sin(eid + Date.now()*0.0001)*0.08*dt
        pos.y += Math.cos(eid + Date.now()*0.0001)*0.08*dt
      }
    }
    if(moved) events.emit('armies_moving', { count: moved })
  }
}
