import { Component, registerComponent } from '../core/component.js'

export class Position extends Component {
  constructor(x=0,y=0,provinceId=0){ super(); this.x=x; this.y=y; this.provinceId=provinceId }
  static tableName(){ return 'c_position' }
}
registerComponent(Position)

export class Army extends Component {
  constructor(troops=1000, morale=1.0, ownerId=0){ super(); this.troops=troops; this.morale=morale; this.ownerId=ownerId }
  static tableName(){ return 'c_army' }
}
registerComponent(Army)

export class Province extends Component {
  constructor(ownerId=0, tax=10, manpower=100){ super(); this.ownerId=ownerId; this.tax=tax; this.manpower=manpower }
  static tableName(){ return 'c_province' }
}
registerComponent(Province)

export class Economy extends Component {
  constructor(gold=100, income=0){ super(); this.gold=gold; this.income=income }
  static tableName(){ return 'c_economy' }
}
registerComponent(Economy)

// Relation now supports ownerId as 3rd arg for diplomacy, backwards compatible
export class Relation extends Component {
  constructor(targetId=0, value=0, ownerId=0){ super(); this.targetId=targetId; this.value=value; this.ownerId=ownerId }
  static tableName(){ return 'c_relation' }
}
registerComponent(Relation)

export class MoveOrder extends Component {
  constructor(targetProvinceId=0){ super(); this.targetProvinceId=targetProvinceId }
  static tableName(){ return 'c_moveorder' }
}
registerComponent(MoveOrder)
