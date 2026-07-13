import { Position, Army, Province, Economy } from '../components/index.js'

/**
 * validateWorld: returns array of errors, empty if clean.
 * This runs after every phase, so a single bad system cannot corrupt save.
 */
export function validateWorld(world){
  const errors = []

  for(const [eid, [pos]] of world.query(Position)){
    if(!Number.isFinite(pos.x) || !Number.isFinite(pos.y)){
      errors.push({ entity:eid, component:'Position', issue:`NaN pos ${pos.x},${pos.y}`, fix:'clamp' })
    }
    if(pos.x < -10000 || pos.x > 10000 || pos.y < -10000 || pos.y > 10000){
      errors.push({ entity:eid, component:'Position', issue:`out of bounds ${pos.x},${pos.y}`, fix:'clamp' })
    }
  }

  for(const [eid, [army]] of world.query(Army)){
    if(!Number.isFinite(army.troops) || army.troops < 0){
      errors.push({ entity:eid, component:'Army', issue:`troops ${army.troops}`, fix:'clamp to 0' })
    }
    if(army.morale < 0 || army.morale > 2 || !Number.isFinite(army.morale)){
      errors.push({ entity:eid, component:'Army', issue:`morale ${army.morale}`, fix:'clamp 0..1' })
    }
  }

  for(const [eid, [prov]] of world.query(Province)){
    if(prov.tax < 0 || prov.tax > 1000){
      errors.push({ entity:eid, component:'Province', issue:`tax ${prov.tax}`, fix:'clamp' })
    }
  }

  for(const [eid, [eco]] of world.query(Economy)){
    if(!Number.isFinite(eco.gold)){
      errors.push({ entity:eid, component:'Economy', issue:`gold NaN`, fix:'reset 0' })
    }
  }

  return errors
}

export function autoFixWorld(world, errors){
  let fixed = 0
  for(const err of errors){
    if(err.component==='Position'){
      const { Position } = requireShim()
      const pos = world.getComponent(err.entity, Position)
      if(pos){
        if(!Number.isFinite(pos.x)) pos.x = 0
        if(!Number.isFinite(pos.y)) pos.y = 0
        pos.x = Math.max(-5000, Math.min(5000, pos.x))
        pos.y = Math.max(-5000, Math.min(5000, pos.y))
        fixed++
      }
    }
    if(err.component==='Army'){
      const { Army } = requireShim()
      const a = world.getComponent(err.entity, Army)
      if(a){
        if(!Number.isFinite(a.troops) || a.troops<0) a.troops=0
        if(!Number.isFinite(a.morale) || a.morale<0) a.morale=0
        if(a.morale>1) a.morale=1
        fixed++
      }
    }
  }
  return fixed
}

function requireShim(){
  // dynamic import shim to avoid circular, components already registered
  // we use globalThis to pull from registry in real fix, but for browser we import directly via closure below
  // This function will be overwritten by engine with actual Ctors, fallback:
  return { Position: class{}, Army: class{} }
}

// Allow engine to inject real Ctors for fixing without circular import
export function setFixCtors(map){ requireShim = ()=>map }
