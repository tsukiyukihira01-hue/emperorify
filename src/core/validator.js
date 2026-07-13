import { Position, Army, Province, Economy } from '../components/index.js'
export function validateWorld(world){
  const e=[]
  for(const [id,[p]] of world.query(Position)){
    if(!Number.isFinite(p.x)||!Number.isFinite(p.y)) e.push({entity:id,component:'Position',issue:'NaN'})
    if(p.x<-10000||p.x>10000||p.y<-10000||p.y>10000) e.push({entity:id,component:'Position',issue:'OOB'})
  }
  for(const [id,[a]] of world.query(Army)){
    if(!Number.isFinite(a.troops)||a.troops<0) e.push({entity:id,component:'Army',issue:`troops ${a.troops}`})
    if(!Number.isFinite(a.morale)||a.morale<0||a.morale>1.5) e.push({entity:id,component:'Army',issue:`morale ${a.morale}`})
  }
  for(const [id,[pr]] of world.query(Province)){ if(pr.tax<0||pr.tax>10000) e.push({entity:id,component:'Province',issue:`tax ${pr.tax}`}) }
  for(const [id,[ec]] of world.query(Economy)){ if(!Number.isFinite(ec.gold)) e.push({entity:id,component:'Economy',issue:'gold NaN'}) }
  return e
}
export function autoFixWorld(world,errs){
  let f=0
  for(const er of errs){
    if(er.component==='Position'){ const p=world.getComponent(er.entity,Position); if(p){ if(!Number.isFinite(p.x))p.x=0; if(!Number.isFinite(p.y))p.y=0; p.x=Math.max(-5000,Math.min(5000,p.x)); p.y=Math.max(-5000,Math.min(5000,p.y)); f++ } }
    if(er.component==='Army'){ const a=world.getComponent(er.entity,Army); if(a){ if(!Number.isFinite(a.troops)||a.troops<0)a.troops=0; if(!Number.isFinite(a.morale)||a.morale<0)a.morale=0; if(a.morale>1)a.morale=1; f++ } }
    if(er.component==='Economy'){ const ec=world.getComponent(er.entity,Economy); if(ec&&!Number.isFinite(ec.gold)){ ec.gold=0; f++ } }
  }
  return f
}
