/**
 * policy.js - GLOBAL write lock, not just per-phase.
 * This is what makes the ECS AI-proof.
 * Before hardening: two systems in different phases could both write Army and corrupt data.
 * After: only ONE system in the entire game may write a given component, ever.
 */

export class WritePolicy {
  constructor(){
    this.globalOwners = new Map() // ComponentName -> systemName
  }

  // Returns null if ok, or error string if conflict
  check(sys){
    for(const C of sys.writes||[]){
      const name = C.name
      if(this.globalOwners.has(name)){
        const owner = this.globalOwners.get(name)
        if(owner !== sys.constructor.name){
          return `GLOBAL CONFLICT: ${sys.constructor.name} wants to write ${name} but ${owner} already owns it globally. Only one writer per component allowed. Emit an event instead.`
        }
      }
    }
    return null
  }

  claim(sys){
    for(const C of sys.writes||[]){
      this.globalOwners.set(C.name, sys.constructor.name)
    }
  }

  dump(){
    return [...this.globalOwners.entries()].map(([c,o])=>`${c} -> ${o}`).join(', ')
  }
}

export const CANONICAL_OWNERS = {
  Position: 'MovementSystem',
  Army: 'CombatSystem',
  Province: 'EconomySystem',
  Economy: 'EconomySystem',
  Relation: 'DiplomacySystem',
  MoveOrder: 'MovementSystem'
}
