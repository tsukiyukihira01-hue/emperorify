import { Position, Army, Province } from '../components/index.js'

/**
 * AISystem - the safe brain.
 * RULE: writes = empty set. It NEVER modifies a component.
 * It only reads world and emits 'order_move' events.
 * MovementSystem is the ONLY writer of Position, so no conflict possible.
 */
export class AISystem {
  reads = new Set([Position, Army, Province])
  writes = new Set()
  phase = 'ai'

  update(world, events, dt){
    // Build friendly province cache: provinceId -> {ownerId}
    const provinceOwner = new Map()
    for(const [, [pos, prov]] of world.query(Position, Province)){
      provinceOwner.set(pos.provinceId, prov.ownerId)
    }

    let orders = 0
    for(const [eid, [pos, army]] of world.query(Position, Army)){
      if(army.troops <= 0) continue

      // Low morale = retreat to random friendly province
      if(army.morale < 0.3){
        const friendly = [...provinceOwner.entries()].filter(([,owner])=>owner===army.ownerId)
        if(friendly.length===0) continue
        const [targetId] = friendly[Math.floor(Math.random()*friendly.length)]
        events.emit('order_move', { entityId: eid, targetProvinceId: targetId, reason: 'retreat', speed: 2.5 })
        orders++
        continue
      }

      // 4% chance each tick to start a new campaign
      if(Math.random() < 0.04){
        // 70% attack enemy province, 30% reinforce friendly
        const wantEnemy = Math.random() < 0.7
        let candidates = [...provinceOwner.entries()].filter(([,owner]) => wantEnemy ? owner!==army.ownerId : owner===army.ownerId)
        if(candidates.length===0) candidates = [...provinceOwner.entries()]
        const [targetId] = candidates[Math.floor(Math.random()*candidates.length)]
        events.emit('order_move', { entityId: eid, targetProvinceId: targetId, reason: wantEnemy?'attack':'reinforce', speed: 1.2 })
        orders++
      }
    }
    if(orders>0) events.emit('ai_orders', { count: orders })
  }
}
