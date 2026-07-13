export class WritePolicy{
  constructor(){this.globalOwners=new Map()}
  check(sys){
    for(const C of sys.writes||[]){
      const n=C.name
      if(this.globalOwners.has(n)){
        const o=this.globalOwners.get(n)
        if(o!==sys.constructor.name) return `GLOBAL CONFLICT: ${sys.constructor.name} wants ${n} but ${o} already owns it. Use events.`
      }
    }
    return null
  }
  claim(sys){for(const C of sys.writes||[]) this.globalOwners.set(C.name, sys.constructor.name)}
  dump(){return [...this.globalOwners.entries()].map(([c,o])=>`${c}->${o}`).join(', ')}
}
