export class WritePolicy {
  constructor(){ this.globalOwners=new Map() }
  check(sys){
    for(const C of sys.writes||[]){
      const name=C.name
      if(this.globalOwners.has(name)){
        const owner=this.globalOwners.get(name)
        if(owner!==sys.constructor.name) return `GLOBAL CONFLICT: ${sys.constructor.name} wants to write ${name} but ${owner} already owns it globally. Only one writer per component allowed. Emit an event instead.`
      }
    }
    return null
  }
  claim(sys){ for(const C of sys.writes||[]) this.globalOwners.set(C.name, sys.constructor.name) }
  dump(){ return [...this.globalOwners.entries()].map(([c,o])=>`${c}->${o}`).join(', ') }
}
