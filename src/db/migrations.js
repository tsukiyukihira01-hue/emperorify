export const SCHEMA_VERSION=2
export function migrateRecord(tname,row){
  if(!row) return row
  const v=row._v||1
  if(v<2){
    if(tname==='c_province'&&row.manpower==null) row.manpower=100
    if(tname==='c_army'){ if(row.morale==null) row.morale=1; if(row.ownerId==null) row.ownerId=0 }
    if(tname==='c_position'){ delete row._tx; delete row._ty; delete row._speed }
    row._v=2
  }
  return row
}
export function stampRecord(comp){
  const j=comp.toJSON?comp.toJSON():{...comp}
  j._v=SCHEMA_VERSION
  delete j._tx; delete j._ty; delete j._speed
  return j
}
