// Pure data only. AI Rule: add new component here, never edit another component.
export const COMPONENT_REGISTRY = new Map()

export function registerComponent(cls){
  COMPONENT_REGISTRY.set(cls.name, cls)
  return cls
}

export class Component {
  // override in subclass for fast binary/table storage
  static tableName(){ return `c_${this.name.toLowerCase()}` }
  toJSON(){ const o={}; for(const k of Object.keys(this)) o[k]=this[k]; return o }
  static fromJSON(data){ const c = new this(); Object.assign(c, data); return c }
}
