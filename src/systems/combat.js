import { Army, Position } from '../components/index.js'

export class CombatSystem {
  reads = new Set([Army, Position])
  writes = new Set([Army])
  phase = 'combat'
  update(world, events, dt){
    const buckets = new Map()
    for(const [eid, [pos, army]] of world.query(Position, Army)){
      const k = pos.provinceId|0
      if(!buckets.has(k)) buckets.set(k, [])
      buckets.get(k).push([eid, army])
    }
    for(const [provId, list] of buckets){
      if(list.length<2) continue
      // if different owners in same province, emit battle, do not touch Province.owner here
      const owners = new Set(list.map(([,a])=>a.ownerId))
      if(owners.size>1){
        events.emit('battle_started', {provinceId:provId, armies:list.map(([id])=>id)})
        // example damage, this system is the ONLY writer of Army in combat phase
        for(const [, army] of list) army.morale = Math.max(0, army.morale-0.05)
      }
    }
  }
}
