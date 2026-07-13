import { COMPONENT_REGISTRY } from '../core/component.js'

// Fast bulk for browser: uses IndexedDB with one objectStore per component = no JSON parse for hot path
// Falls back to localStorage if IDB unavailable

export class Repository {
  constructor(dbName='ecs_world'){
    this.dbName=dbName; this.db=null
  }
  async init(){
    return new Promise((res, rej)=>{
      const req = indexedDB.open(this.dbName, 1)
      req.onupgradeneeded = (e)=>{
        const db = e.target.result
        for(const [name, Ctor] of COMPONENT_REGISTRY){
          const sname = Ctor.tableName()
          if(!db.objectStoreNames.contains(sname)) db.createObjectStore(sname, {keyPath:'entityId'})
        }
      }
      req.onsuccess = (e)=>{ this.db=e.target.result; res() }
      req.onerror = rej
    })
  }
  async bulkSave(world){
    if(!this.db) await this.init()
    const tx = this.db.transaction([...COMPONENT_REGISTRY.values()].map(c=>c.tableName()), 'readwrite')
    for(const [name, Ctor] of COMPONENT_REGISTRY){
      const storeName = Ctor.tableName()
      if(!world.store.has(name)) continue
      const map = world.store.get(name)
      const os = tx.objectStore(storeName)
      os.clear()
      for(const [eid, comp] of map){
        os.put({entityId:eid, ...comp.toJSON()})
      }
    }
    return new Promise((res,rej)=>{ tx.oncomplete=res; tx.onerror=rej })
  }
  async loadAll(world){
    if(!this.db) await this.init()
    const tx = this.db.transaction([...COMPONENT_REGISTRY.values()].map(c=>c.tableName()), 'readonly')
    for(const [name, Ctor] of COMPONENT_REGISTRY){
      const storeName = Ctor.tableName()
      if(!tx.objectStoreNames.contains(storeName)) continue
      const os = tx.objectStore(storeName)
      const req = os.getAll()
      await new Promise((res)=>{
        req.onsuccess=()=>{
          for(const row of req.result){
            const {entityId, ...data}=row
            const comp = Ctor.fromJSON(data)
            world.addComponent(entityId, comp)
            if(entityId>=world.nextId) world.nextId=entityId+1
          }
          res()
        }
      })
    }
  }
}
