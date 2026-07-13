import { Position, Army, Province, Economy } from '../components/index.js'

export function validateWorld(world){
  const errors=[]
  for(const [eid, [pos]] of world.query(Position)){
    if(!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) errors.push({entity:eid, component:'Position', issue:`NaN ${pos.x},${pos.y}`, fix:'clamp'})
    if(pos.x < -10000 || pos.x > 10000 || pos.y < -10000 || pos.y > 10000) errors.push({entity:eid, component:'Position', issue:`OOB ${pos.x},${pos.y}`, fix:'clamp'})
  }
  for(const [eid, [army]] of world.query(Army)){
    if(!Number.isFinite(army.troops) || army.troops < 0) errors.push({entity:eid, component:'Army', issue:`troops ${army.troops}`, fix:'0'})
    if(!Number.isFinite(army.morale) || army.morale < 0 || army.morale > 2) errors.push({entity:eid, component:'Army', issue:`morale ${army.morale}`, fix:'clamp'})
  }
  for(const [eid, [prov]] of world.query(Province)){
    if(prov.tax < 0 || prov.tax > 10000) errors.push({entity:eid, component:'Province', issue:`tax ${prov.tax}`})
  }
  for(const [eid, [eco]] of world.query(Economy)){
    if(!Number.isFinite(eco.gold)) errors.push({entity:eid, component:'Economy', issue:'gold NaN'})
  }
  return errors
}

export function autoFixWorld(world, errors){
  let fixed=0
  for(const err of errors){
    if(err.component==='Position'){
      const p = world.getComponent(err.entity, Position)
      if(p){ if(!Number.isFinite(p.x)) p.x=0; if(!Number.isFinite(p.y)) p.y=0; p.x=Math.max(-5000,Math.min(5000,p.x)); p.y=Math.max(-5000,Math.min(5000,p.y)); fixed++ }
    }
    if(err.component==='Army'){
      const a = world.getComponent(err.entity, Army)
      if(a){ if(!Number.isFinite(a.troops)||a.troops<0) a.troops=0; if(!Number.isFinite(a.morale)||a.morale<0) a.morale=0; if(a.morale>1) a.morale=1; fixed++ }
    }
    if(err.component==='Economy'){
      const e = world.getComponent(err.entity, Economy)
      if(e && !Number.isFinite(e.gold)) { e.gold=0; fixed++ }
    }
  }
  return fixed
}
