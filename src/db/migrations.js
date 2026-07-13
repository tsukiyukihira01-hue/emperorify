export const SCHEMA_VERSION=2
export function migrateRecord(tableName, row){
  if(!row) return row
  const v=row._v||1
  if(v<2){
    if(tableName==='c_province' && row.manpower==null) row.manpower=100
    if(tableName==='c_army'){ if(row.morale==null) row.morale=1; if(row.ownerId==null) row.ownerId=0 }
    if(tableName==='c_position'){ delete row._tx; delete row._ty; delete row._speed }
    row._v=2
  }
  return row
}
export function stampRecord(comp){
  const json=comp.toJSON?comp.toJSON():{...comp}
  json._v=SCHEMA_VERSION
  delete json._tx; delete json._ty; delete json._speed
  return json
}
