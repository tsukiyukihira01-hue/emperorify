import { validateWorld, autoFixWorld, setFixCtors } from './validator.js'
import { WritePolicy } from './policy.js'
import { Position, Army } from '../components/index.js'

const PHASE_ORDER = ["input","ai","movement","economy","combat","persist","ui"]

export class TickEngine {
  constructor(world, events){
    this.world = world; this.events = events
    this.systemsByPhase = new Map(PHASE_ORDER.map(p=>[p,[]]))
    this.writeOwnersByPhase = new Map()
    this.policy = new WritePolicy()
    this.tickCount = 0

    // inject real Ctors for autoFix to avoid circular import
    try{ setFixCtors({ Position, Army }) }catch{}
  }

  register(sys){
    if(!sys.phase) throw new Error(`${sys.constructor.name} missing phase`)
    if(!this.systemsByPhase.has(sys.phase)) this.systemsByPhase.set(sys.phase, [])

    // 1. GLOBAL check - only one writer ever
    const globalErr = this.policy.check(sys)
    if(globalErr){
      throw new Error(globalErr)
    }

    // 2. PHASE check - original safety
    for(const C of sys.writes||[]){
      const key = `${sys.phase}:${C.name}`
      if(this.writeOwnersByPhase.has(key)){
        throw new Error(`CONFLICT: ${sys.constructor.name} and ${this.writeOwnersByPhase.get(key)} both write ${C.name} in phase ${sys.phase}. Use events.`)
      }
      this.writeOwnersByPhase.set(key, sys.constructor.name)
    }

    this.policy.claim(sys)
    this.systemsByPhase.get(sys.phase).push(sys)
    console.log(`[Engine] OK ${sys.constructor.name} phase=${sys.phase} reads=[${[...(sys.reads||[])].map(c=>c.name)}] writes=[${[...(sys.writes||[])].map(c=>c.name)}]`)
    console.log(`[Policy] owners: ${this.policy.dump()}`)
  }

  tick(dt=1){
    this.tickCount++
    for(const phase of PHASE_ORDER){
      const list = this.systemsByPhase.get(phase)||[]
      for(const sys of list){
        try{
          sys.update(this.world, this.events, dt)
        }catch(e){
          console.error(`[Engine] ${sys.constructor.name} crashed in ${phase}`, e)
          this.events.emit('system_error', { system: sys.constructor.name, phase, message: e.message, stack: e.stack })
          // do NOT stop tick, isolate failure
        }
      }

      // validate after each phase
      try{
        const errors = validateWorld(this.world)
        if(errors.length>0){
          console.warn(`[Validator] ${errors.length} issues after phase ${phase}`, errors)
          this.events.emit('validation_failed', { phase, errors, tick:this.tickCount })
          autoFixWorld(this.world, errors)
          this.events.emit('validation_fixed', { phase, fixed: errors.length })
        }
      }catch(ve){
        console.error('[Validator] validator itself crashed', ve)
      }
    }
    this.world.commit()
    this.events.emit('tick_end', { tick:this.tickCount })
  }
}
