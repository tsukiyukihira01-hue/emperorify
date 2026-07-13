const PHASE_ORDER = ["input","ai","movement","economy","combat","persist","ui"]

export class TickEngine {
  constructor(world, events){
    this.world = world; this.events = events
    this.systemsByPhase = new Map(PHASE_ORDER.map(p=>[p,[]]))
    this.writeOwners = new Map() // key = phase:ComponentName -> systemName
  }
  register(sys){
    if(!this.systemsByPhase.has(sys.phase)) this.systemsByPhase.set(sys.phase, [])
    // conflict check: two systems cannot write same component in same phase
    for(const C of sys.writes||[]){
      const key = `${sys.phase}:${C.name}`
      if(this.writeOwners.has(key)){
        throw new Error(`CONFLICT: ${sys.constructor.name} and ${this.writeOwners.get(key)} both write ${C.name} in phase ${sys.phase}. Split component or merge systems, or emit event instead.`)
      }
      this.writeOwners.set(key, sys.constructor.name)
    }
    this.systemsByPhase.get(sys.phase).push(sys)
    console.log(`[Engine] ${sys.constructor.name} phase=${sys.phase} reads=[${[...(sys.reads||[])].map(c=>c.name)}] writes=[${[...(sys.writes||[])].map(c=>c.name)}]`)
  }
  tick(dt=1){
    for(const phase of PHASE_ORDER){
      const list = this.systemsByPhase.get(phase)||[]
      for(const sys of list) sys.update(this.world, this.events, dt)
    }
    this.world.commit()
  }
}
