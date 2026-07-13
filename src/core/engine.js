import { validateWorld, autoFixWorld } from './validator.js'
import { WritePolicy } from './policy.js'
const PHASE_ORDER=["input","ai","movement","economy","combat","persist","ui"]
export class TickEngine{
  constructor(world,events){this.world=world;this.events=events;this.systemsByPhase=new Map(PHASE_ORDER.map(p=>[p,[]]));this.writeOwnersByPhase=new Map();this.policy=new WritePolicy();this.tickCount=0}
  register(sys){
    if(!sys.phase) throw new Error(`${sys.constructor.name} missing phase`)
    if(!this.systemsByPhase.has(sys.phase)) this.systemsByPhase.set(sys.phase,[])
    const g=this.policy.check(sys); if(g) throw new Error(g)
    for(const C of sys.writes||[]){const k=`${sys.phase}:${C.name}`; if(this.writeOwnersByPhase.has(k)) throw new Error(`CONFLICT ${sys.constructor.name} vs ${this.writeOwnersByPhase.get(k)} on ${C.name} in ${sys.phase}`); this.writeOwnersByPhase.set(k,sys.constructor.name)}
    this.policy.claim(sys); this.systemsByPhase.get(sys.phase).push(sys)
    console.log(`[Engine] OK ${sys.constructor.name} phase=${sys.phase}`)
  }
  tick(dt=1){
    this.tickCount++
    for(const phase of PHASE_ORDER){
      const list=this.systemsByPhase.get(phase)||[]
      for(const sys of list){ try{sys.update(this.world,this.events,dt)}catch(e){console.error(e); this.events.emit('system_error',{system:sys.constructor.name,phase,message:e.message})}}
      try{const errs=validateWorld(this.world); if(errs.length){this.events.emit('validation_failed',{phase,errors:errs}); autoFixWorld(this.world,errs); this.events.emit('validation_fixed',{phase,fixed:errs.length})}}catch{}
    }
    this.world.commit(); this.events.emit('tick_end',{tick:this.tickCount})
  }
}
