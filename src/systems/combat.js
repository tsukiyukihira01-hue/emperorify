import { Position, Army, Province, Relation, TROOP_CATALOG } from '../components/index.js'
function power(comp){
  let p=0
  p+=(comp.militia||0)*TROOP_CATALOG.militia.atk
  p+=(comp.man_at_arms||0)*TROOP_CATALOG.man_at_arms.atk
  p+=(comp.light_cavalry||0)*TROOP_CATALOG.light_cavalry.atk
  p+=(comp.knight||0)*TROOP_CATALOG.knight.atk
  p+=(comp.archer||0)*TROOP_CATALOG.archer.atk
  p+=(comp.longbowman||0)*TROOP_CATALOG.longbowman.atk
  return p
}
function powerVs(my, enemy){
  let p=power(my)
  const eT=(enemy.militia+enemy.man_at_arms+enemy.light_cavalry+enemy.knight+enemy.archer+enemy.longbowman)||1
  const eCav=(enemy.light_cavalry+enemy.knight)/eT
  const eRng=(enemy.archer+enemy.longbowman)/eT
  const eInf=(enemy.militia+enemy.man_at_arms)/eT
  // militia + man-at-arms counter cav
  if(eCav>0.32) p+= (my.militia||0)*1.5 + (my.man_at_arms||0)*3.2
  // knights counter ranged
  if(eRng>0.28) p+= (my.light_cavalry||0)*2.2 + (my.knight||0)*5.5
  // longbow/archer counter infantry
  if(eInf>0.36) p+= (my.archer||0)*1.8 + (my.longbowman||0)*4.2
  return p
}
export class CombatSystem{
  reads=new Set([Position, Army, Province, Relation]); writes=new Set([Army]); phase='combat'
  update(world, events, dt){
    for(const r of events.drain('order_recruit')){
      let at=null; for(const[,[pos]] of world.query(Position, Province)){ if(pos.provinceId===r.provinceId){ at=pos; break } }
      if(!at) continue
      const eid=world.createEntity()
      world.addComponent(eid,new Position(at.x+10+Math.random()*24, at.y+44+Math.random()*14, r.provinceId))
      world.addComponent(eid,new Army(r.ownerId, r.comp||{militia:200,light_cavalry:20,archer:60}, 0.9))
      events.emit('levy_raised',{provinceId:r.provinceId,house:r.ownerId,comp:r.comp})
    }
    const byFief=new Map()
    for(const[eid,[pos,host]] of world.query(Position, Army)){ if(host.troops<=0) continue; if(!byFief.has(pos.provinceId)) byFief.set(pos.provinceId,[]); byFief.get(pos.provinceId).push({host}) }
    // Actually need eid for later but not needed for power
    const byFiefFull=new Map()
    for(const[eid,[pos,host]] of world.query(Position, Army)){ if(host.troops<=0) continue; if(!byFiefFull.has(pos.provinceId)) byFiefFull.set(pos.provinceId,[]); byFiefFull.get(pos.provinceId).push({eid,pos,host}) }
    const atWar=new Set(); for(const[,[rel]] of world.query(Relation)){ if(rel.value<=-66) atWar.add(`${rel.ownerId}->${rel.targetId}`) }
    let battles=0, fallen=0; const losses=new Map()
    for(const[fid,hosts] of byFiefFull){
      if(hosts.length<2) continue
      const houses=[...new Set(hosts.map(h=>h.host.ownerId))]; if(houses.length<2) continue
      let foe=false; for(const a of houses) for(const b of houses) if(a!==b && (atWar.has(`${a}->${b}`)||atWar.has(`${b}->${a}`)||Math.random()<0.32)) foe=true
      if(!foe) continue
      battles++
      const houseComps=new Map()
      for(const {host} of hosts){ const c=houseComps.get(host.ownerId)||{militia:0,man_at_arms:0,light_cavalry:0,knight:0,archer:0,longbowman:0}; c.militia+=host.militia; c.man_at_arms+=host.man_at_arms; c.light_cavalry+=host.light_cavalry; c.knight+=host.knight; c.archer+=host.archer; c.longbowman+=host.longbowman; houseComps.set(host.ownerId,c) }
      for(const {host} of hosts){
        let eComp={militia:0,man_at_arms:0,light_cavalry:0,knight:0,archer:0,longbowman:0}; for(const [hid,c] of houseComps) if(hid!==host.ownerId){ eComp.militia+=c.militia; eComp.man_at_arms+=c.man_at_arms; eComp.light_cavalry+=c.light_cavalry; eComp.knight+=c.knight; eComp.archer+=c.archer; eComp.longbowman+=c.longbowman }
        const enP=powerVs(eComp, host.comp)
        const base=(enP*0.00105 + 22 + Math.random()*38)*dt
        const tot=host.troops||1
        const dmg=(share)=>Math.floor(base*share*(0.9+Math.random()*0.22))
        const mShare=host.militia/tot, maShare=host.man_at_arms/tot, lcShare=host.light_cavalry/tot, kShare=host.knight/tot, aShare=host.archer/tot, lbShare=host.longbowman/tot
        const before=host.troops
        host.militia=Math.max(0,host.militia-dmg(mShare*1.0))
        host.man_at_arms=Math.max(0,host.man_at_arms-dmg(maShare*0.88))
        host.light_cavalry=Math.max(0,host.light_cavalry-dmg(lcShare*0.86))
        host.knight=Math.max(0,host.knight-dmg(kShare*0.78))
        host.archer=Math.max(0,host.archer-dmg(aShare*0.92))
        host.longbowman=Math.max(0,host.longbowman-dmg(lbShare*0.85))
        host.morale=Math.max(0,host.morale-0.05*dt)
        const lost=before-host.troops; fallen+=lost; losses.set(host.ownerId,(losses.get(host.ownerId)||0)+lost)
      }
      let victor=null,best=-1,remain=new Map(); for(const {host} of hosts) remain.set(host.ownerId,(remain.get(host.ownerId)||0)+host.troops); for(const [h,r] of remain) if(r>best){best=r;victor=h}
      events.emit('battle_joined',{fiefId:fid,houses,victor,fallen}); if(victor!=null) events.emit('battle_won',{provinceId:fid,winner:victor,losers:houses.filter(h=>h!==victor),warScoreGain:14})
    }
    if(battles) events.emit('combat_tick',{battles,casualties:fallen,lossesByOwner:Object.fromEntries(losses)})
  }
}
