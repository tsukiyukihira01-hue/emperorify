import { Province, Economy } from '../components/index.js'

export class EconomySystem {
  reads = new Set([Province])
  writes = new Set([Economy])
  phase = 'economy'
  update(world, events, dt){
    const incomeByOwner = new Map()
    for(const [, [prov]] of world.query(Province)){
      incomeByOwner.set(prov.ownerId, (incomeByOwner.get(prov.ownerId)||0)+prov.tax)
    }
    for(const [, [econ]] of world.query(Economy)){
      // demo: if you make Economy entityId == ownerId, apply income
      // real join would use mapping table, but we keep isolation: never write Province here
      // This system never writes Position or Army, so it cannot conflict with MovementSystem
    }
    events.emit('economy_tick', Object.fromEntries(incomeByOwner))
  }
}
