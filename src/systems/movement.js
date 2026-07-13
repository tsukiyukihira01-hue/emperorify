import { Position, Army } from '../components/index.js'

export class MovementSystem {
  reads = new Set([Position, Army])
  writes = new Set([Position])
  phase = 'movement'
  update(world, events, dt){
    let moved=0
    for(const [eid, [pos, army]] of world.query(Position, Army)){
      if(army.troops<=0) continue
      // simple drift, real game would read events 'order_move'
      pos.x += Math.sin(eid)*0.3*dt
      pos.y += Math.cos(eid)*0.2*dt
      moved++
    }
    if(moved) events.emit('armies_moved', {count:moved})
  }
}
