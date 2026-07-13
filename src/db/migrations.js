/**
 * migrations.js - versioned component data, prevents save corruption on updates.
 */
export const SCHEMA_VERSION = 2

export function migrateRecord(tableName, row){
  // row is {entityId, ...data, _v?}
  if(!row) return row
  const v = row._v || 1

  // v1 -> v2: Position gained _tx/_ty transient fields (should not be persisted), Province gained manpower default
  if(v < 2){
    if(tableName === 'c_province'){
      if(row.manpower == null) row.manpower = 100
    }
    if(tableName === 'c_army'){
      if(row.morale == null) row.morale = 1.0
      if(row.ownerId == null) row.ownerId = 0
    }
    if(tableName === 'c_position'){
      // transient movement targets should never be saved, strip them
      delete row._tx
      delete row._ty
      delete row._speed
    }
    row._v = 2
  }

  return row
}

export function stampRecord(comp){
  const json = comp.toJSON ? comp.toJSON() : {...comp}
  json._v = SCHEMA_VERSION
  // never persist transient fields
  delete json._tx
  delete json._ty
  delete json._speed
  return json
}
