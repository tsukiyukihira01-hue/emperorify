// World owns all component storage. No system touches storage directly except via query.
export class World {
  constructor(){
    this.store = new Map() // ComponentName -> Map(entityId -> comp)
    this.nextId = 1
    this.toDestroy = new Set()
  }
  createEntity(){
    const id = this.nextId++
    return id
  }
  destroyEntity(id){ this.toDestroy.add(id) }

  _mapFor(Ctor){
    if(!this.store.has(Ctor.name)) this.store.set(Ctor.name, new Map())
    return this.store.get(Ctor.name)
  }
  addComponent(eid, comp){
    this._mapFor(comp.constructor).set(eid, comp)
  }
  getComponent(eid, Ctor){
    return this._mapFor(Ctor).get(eid)
  }
  hasComponent(eid, Ctor){
    return this._mapFor(Ctor).has(eid)
  }
  removeComponent(eid, Ctor){
    this._mapFor(Ctor).delete(eid)
  }
  // query(A,B) yields [eid, [A,B]] only if entity has ALL
  *query(...Ctors){
    if(Ctors.length===0) return
    // iterate smallest for speed
    let smallest = Ctors[0]
    let minSize = this._mapFor(smallest).size
    for(const C of Ctors){ const s=this._mapFor(C).size; if(s<minSize){ smallest=C; minSize=s } }
    for(const [eid, comp0] of this._mapFor(smallest)){
      const comps=[]
      let ok=true
      for(const C of Ctors){
        if(C===smallest){ comps.push(comp0); continue }
        const c = this._mapFor(C).get(eid)
        if(!c){ ok=false; break }
        comps.push(c)
      }
      if(ok) yield [eid, comps]
    }
  }
  commit(){
    for(const eid of this.toDestroy){
      for(const m of this.store.values()) m.delete(eid)
    }
    this.toDestroy.clear()
  }
}
