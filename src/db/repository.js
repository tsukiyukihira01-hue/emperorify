import { COMPONENT_REGISTRY } from '../core/component.js'
import { migrateRecord, stampRecord, SCHEMA_VERSION } from './migrations.js'
export class Repository{
  constructor(dbName='ecs_world'){ this.dbName=dbName; this.db=null }
  async init(){
    return new Promise((res,rej)=>{
      const req=indexedDB.open(this.dbName, SCHEMA_VERSION)
      req.onupgradeneeded=(e)=>{
        const db=e.target.result
        for(const [,Ctor] of COMPONENT_REGISTRY){
          const sname=Ctor.tableName()
          if(!db.objectStoreNames.contains(sname)) db.createObjectStore(sname,{keyPath:'entityId'})
        }
      }
      req.onsuccess=(e)=>{ this.db=e.target.result; res() }
      req.onerror=()=>rej(req.error)
    })
  }
  async bulkSave(world){
    if(!this.db) await this.init()
    const tx=this.db.transaction([...COMPONENT_REGISTRY.values()].map(c=>c.tableName()),'readwrite')
    for(const [name,Ctor] of COMPONENT_REGISTRY){
      const storeName=Ctor.tableName()
      if(!world.store.has(name)) continue
      const map=world.store.get(name)
      const os=tx.objectStore(storeName)
      os.clear()
      for(const [eid,comp] of map){ os.put({entityId:eid, ...stampRecord(comp)}) }
    }
    return new Promise((res,rej)=>{ tx.oncomplete=res; tx.onerror=()=>rej(tx.error) })
  }
  async loadAll(world){
    if(!this.db) await this.init()
    const names=[...COMPONENT_REGISTRY.values()].map(c=>c.tableName())
    const tx=this.db.transaction(names,'readonly')
    for(const [name,Ctor] of COMPONENT_REGISTRY){
      const storeName=Ctor.tableName()
      if(!tx.objectStoreNames.contains(storeName)) continue
      const os=tx.objectStore(storeName)
      const req=os.getAll()
      await new Promise((res,rej)=>{
        req.onsuccess=()=>{
          for(let row of req.result){
            row=migrateRecord(storeName,row)
            const {entityId,_v,...data}=row
            try{
              const comp=Ctor.fromJSON(data)
              world.addComponent(entityId, comp)
              if(entityId>=world.nextId) world.nextId=entityId+1
            }catch(e){ console.warn('migrate skip',e) }
          }
          res()
        }
        req.onerror=()=>rej(req.error)
      })
    }
  }
  async clear(){ if(!this.db) await this.init(); indexedDB.deleteDatabase(this.dbName) }
}
