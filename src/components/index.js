import { Component, registerComponent } from '../core/component.js'

export const PLAYER_HOUSE = 1

export const TROOP_CATALOG = {
  // T1
  militia:       { id:'militia',       branch:'infantry', tier:1, name:'Militia',       hp:10, atk:6,  def:4, speed:1.0, cost:12, upkeep:1,   counters:['light_cavalry'], weakTo:['archer','longbowman'] },
  light_cavalry: { id:'light_cavalry', branch:'cavalry',  tier:1, name:'Light Cavalry', hp:14, atk:9,  def:3, speed:1.6, cost:22, upkeep:2,   counters:['archer'],        weakTo:['militia','man_at_arms'] },
  archer:        { id:'archer',        branch:'ranged',   tier:1, name:'Archer',        hp:8,  atk:8,  def:2, speed:1.1, cost:18, upkeep:1.4, counters:['militia'],       weakTo:['light_cavalry','knight'] },
  // T2 - unlocked by buildings
  man_at_arms:   { id:'man_at_arms',   branch:'infantry', tier:2, name:'Man-at-Arms',   hp:18, atk:12, def:9, speed:1.0, cost:30, upkeep:2.4, counters:['light_cavalry','knight'], weakTo:['longbowman'] , unlock:{keep:2} },
  knight:        { id:'knight',        branch:'cavalry',  tier:2, name:'Knight',        hp:28, atk:19, def:12,speed:1.5, cost:58, upkeep:4.8, counters:['archer','longbowman'], weakTo:['man_at_arms'], unlock:{keep:2, market:1} },
  longbowman:    { id:'longbowman',    branch:'ranged',   tier:2, name:'Longbowman',    hp:13, atk:16, def:4, speed:1.1, cost:34, upkeep:2.8, counters:['militia','man_at_arms'], weakTo:['knight'], unlock:{market:2} },
}

export const BRANCH = {
  infantry:['militia','man_at_arms'],
  cavalry:['light_cavalry','knight'],
  ranged:['archer','longbowman']
}

export class Position extends Component { constructor(x=0,y=0,provinceId=0){ super(); this.x=x; this.y=y; this.provinceId=provinceId } static tableName(){ return 'c_position' } }
registerComponent(Position)

export class Army extends Component {
  constructor(ownerId=0, comp={}, morale=1.0){
    super()
    if(typeof comp==='number'){ // legacy
      this.militia=comp; this.man_at_arms=0; this.light_cavalry=0; this.knight=0; this.archer=0; this.longbowman=0; this.ownerId=morale||0; this.morale=1.0
    } else {
      this.ownerId=ownerId
      this.militia=Math.max(0,Math.floor(comp.militia||0))
      this.man_at_arms=Math.max(0,Math.floor(comp.man_at_arms||comp.manAtArms||0))
      this.light_cavalry=Math.max(0,Math.floor(comp.light_cavalry||0))
      this.knight=Math.max(0,Math.floor(comp.knight||0))
      this.archer=Math.max(0,Math.floor(comp.archer||0))
      this.longbowman=Math.max(0,Math.floor(comp.longbowman||0))
      this.morale=morale
    }
  }
  get troops(){ return this.militia+this.man_at_arms+this.light_cavalry+this.knight+this.archer+this.longbowman }
  get comp(){ return { militia:this.militia, man_at_arms:this.man_at_arms, light_cavalry:this.light_cavalry, knight:this.knight, archer:this.archer, longbowman:this.longbowman } }
  get infantry(){ return this.militia+this.man_at_arms }
  get cavalry(){ return this.light_cavalry+this.knight }
  get ranged(){ return this.archer+this.longbowman }
  static tableName(){ return 'c_army' }
  toJSON(){ return { ownerId:this.ownerId, militia:this.militia, man_at_arms:this.man_at_arms, light_cavalry:this.light_cavalry, knight:this.knight, archer:this.archer, longbowman:this.longbowman, morale:this.morale } }
  static fromJSON(d){ return new Army(d.ownerId||0,{militia:d.militia||d.troops||0, man_at_arms:d.man_at_arms||0, light_cavalry:d.light_cavalry||0, knight:d.knight||0, archer:d.archer||0, longbowman:d.longbowman||0}, d.morale||1) }
}
registerComponent(Army)

export class Province extends Component { constructor(ownerId=0, tax=10, manpower=130, name=''){ super(); this.ownerId=ownerId; this.tax=tax; this.manpower=manpower; this.name=name } static tableName(){ return 'c_province' } }
registerComponent(Province)

export class Economy extends Component { constructor(gold=220, income=0, ownerId=0, warExhaustion=0){ super(); this.gold=gold; this.income=income; this.ownerId=ownerId; this.warExhaustion=warExhaustion } static tableName(){ return 'c_economy' } }
registerComponent(Economy)

export class Relation extends Component { constructor(targetId=0, value=0, ownerId=0, warScore=0){ super(); this.targetId=targetId; this.value=value; this.ownerId=ownerId; this.warScore=warScore } static tableName(){ return 'c_relation' } }
registerComponent(Relation)

export class TradeRoute extends Component { constructor(fromProvinceId=0,toProvinceId=0,value=5,ownerId=0,active=true){ super(); this.fromProvinceId=fromProvinceId; this.toProvinceId=toProvinceId; this.value=value; this.ownerId=ownerId; this.active=active; this.fromOwner=ownerId; this.toOwner=0 } static tableName(){ return 'c_traderoute' } }
registerComponent(TradeRoute)

export class Building extends Component { constructor(provinceId=0,type='manor',level=1,ownerId=0){ super(); this.provinceId=provinceId; this.type=type; this.level=level; this.ownerId=ownerId } static tableName(){ return 'c_building' } }
registerComponent(Building)

export class Player extends Component { constructor(houseId=1){ super(); this.houseId=houseId } static tableName(){ return 'c_player' } }
registerComponent(Player)

export function hasUnlock(houseId, world, need){
  if(!need) return true
  let keep=0, market=0, abbey=0
  for(const[,[b]] of world.query(Building)){ if(b.ownerId!==houseId) continue; if(b.type==='keep') keep=Math.max(keep,b.level); if(b.type==='market') market=Math.max(market,b.level); if(b.type==='abbey') abbey=Math.max(abbey,b.level) }
  if(need.keep && keep<need.keep) return false
  if(need.market && market<need.market) return false
  if(need.abbey && abbey<need.abbey) return false
  return true
}
