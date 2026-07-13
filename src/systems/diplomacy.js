import { Province, Relation } from '../components/index.js'
export class DiplomacySystem{
  reads=new Set([Province, Relation]); writes=new Set([Relation]); phase='ai'
  update(world, events, dt){
    const factions=new Set(); const provCount=new Map()
    for(const[,[prov]] of world.query(Province)){ factions.add(prov.ownerId); provCount.set(prov.ownerId,(provCount.get(prov.ownerId)||0)+1) }
    const ids=[...factions]; if(ids.length<2) return
    const relMap=new Map()
    for(const[eid,[rel]] of world.query(Relation)){ if(rel.ownerId==null) continue; relMap.set(`${rel.ownerId}->${rel.targetId}`,{eid,rel}) }
    let created=0
    for(const a of ids){ for(const b of ids){ if(a===b) continue; const k=`${a}->${b}`; if(!relMap.has(k)){ const eid=world.createEntity(); const r=new Relation(b,0,a); world.addComponent(eid,r); relMap.set(k,{eid,rel:r}); created++ } } }
    if(created) events.emit('diplomacy_init',{created})
    let changed=0,wars=0,peaces=0
    for(const {rel} of relMap.values()){
      const before=rel.value; rel.value+=(Math.random()-0.5)*1.6*dt
      const ac=provCount.get(rel.ownerId)||1, bc=provCount.get(rel.targetId)||1
      if(ac>4&&bc>4) rel.value-=0.3*dt
      rel.value=Math.max(-100,Math.min(100,rel.value))
      if(rel.value<=-75&&Math.random()<0.015&&rel.value!==-100){ rel.value=-100; events.emit('war_declared',{from:rel.ownerId,to:rel.targetId}); wars++ }
      if(rel.value>=60&&before<60&&Math.random()<0.02){ events.emit('peace_made',{from:rel.ownerId,to:rel.targetId}); peaces++ }
      if(Math.abs(rel.value-before)>2) changed++
    }
    if(changed) events.emit('relation_changed',{changed})
    if(wars||peaces) events.emit('diplomacy_tick',{wars,peaces,relations:relMap.size})
  }
}
