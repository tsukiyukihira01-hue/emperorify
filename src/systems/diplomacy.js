import { Province, Relation, Economy, Army } from '../components/index.js'

/**
 * DiplomacySystem - SAFE plugin
 * RULE: Only writes Relation, nothing else.
 * No other system writes Relation, so global policy allows it.
 * It never touches Position, Army, Province, Economy.
 * Communicates via events: war_declared, peace_made, relation_changed
 */
export class DiplomacySystem{
  reads=new Set([Province, Relation, Economy, Army])
  writes=new Set([Relation])
  phase='ai'

  update(world, events, dt){
    // 1. collect faction ids from provinces
    const factions=new Set()
    const provCount=new Map()
    for(const[,[prov]] of world.query(Province)){
      factions.add(prov.ownerId)
      provCount.set(prov.ownerId,(provCount.get(prov.ownerId)||0)+1)
    }
    const ids=[...factions]
    if(ids.length<2) return

    // 2. index existing relations owner->target -> comp
    const relMap=new Map() // key `${owner}->${target}` -> {eid, rel}
    for(const[eid,[rel]] of world.query(Relation)){
      const owner=rel.ownerId||0
      if(owner===0) continue // legacy without owner, skip
      relMap.set(`${owner}->${rel.targetId}`, {eid, rel})
    }

    // 3. ensure every directed pair exists
    let created=0
    for(const a of ids){
      for(const b of ids){
        if(a===b) continue
        const key=`${a}->${b}`
        if(!relMap.has(key)){
          const eid=world.createEntity()
          const r=new Relation(b, 0, a) // target B, value 0, owner A
          world.addComponent(eid, r)
          relMap.set(key,{eid, rel:r})
          created++
        }
      }
    }
    if(created) events.emit('diplomacy_init',{created})

    // 4. update relations
    let changed=0, wars=0, peaces=0
    for(const {rel} of relMap.values()){
      const before=rel.value
      // random drift
      rel.value += (Math.random()-0.5)*1.6*dt
      // rivalry: large empires dislike each other
      const aCount=provCount.get(rel.ownerId)||1
      const bCount=provCount.get(rel.targetId)||1
      if(aCount>4 && bCount>4) rel.value -= 0.3*dt
      // clamp
      if(rel.value<-100) rel.value=-100
      if(rel.value>100) rel.value=100

      // war trigger
      if(rel.value<=-75 && Math.random()<0.015){
        if(rel.value!==-100){
          rel.value=-100
          events.emit('war_declared',{from:rel.ownerId,to:rel.targetId})
          wars++
        }
      }
      // peace trigger
      if(rel.value>=60 && before<60 && Math.random()<0.02){
        events.emit('peace_made',{from:rel.ownerId,to:rel.targetId})
        peaces++
      }
      if(Math.abs(rel.value-before)>2) changed++
    }

    if(changed) events.emit('relation_changed',{changed})
    if(wars||peaces) events.emit('diplomacy_tick',{wars,peaces,relations:relMap.size})
  }
}
