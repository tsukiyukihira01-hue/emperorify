import { Position, Province, Economy, TradeRoute, Building, Army, PLAYER_HOUSE, hasUnlock, TROOP_CATALOG } from '../components/index.js'
export class EconomySystem{
  reads=new Set([Position, Province, Economy, TradeRoute, Building, Army]); writes=new Set([Economy, Province]); phase='economy'
  update(world, events, dt){
    const tithe=new Map(), fiefsByHouse=new Map()
    for(const[,[pos,fief]] of world.query(Position, Province)){ tithe.set(fief.ownerId,(tithe.get(fief.ownerId)||0)+fief.tax); if(!fiefsByHouse.has(fief.ownerId)) fiefsByHouse.set(fief.ownerId,[]); fiefsByHouse.get(fief.ownerId).push({pos,fief}); fief.manpower=Math.min(1300,(fief.manpower||0)+1.65*dt) }
    for(const[,[b]] of world.query(Building)){ const bonus=b.type==='manor'?3*b.level:b.type==='market'?5*b.level:2*b.level; tithe.set(b.ownerId,(tithe.get(b.ownerId)||0)+bonus); if(b.type==='keep'){ const arr=fiefsByHouse.get(b.ownerId)||[]; for(const {fief} of arr) fief.manpower=Math.min(1300,fief.manpower+0.75*b.level*dt) } }
    const toll=new Map(); for(const[,[r]] of world.query(TradeRoute)){ if(!r.active) continue; toll.set(r.ownerId,(toll.get(r.ownerId)||0)+r.value) }
    const treasury=new Map(); for(const[,[e]] of world.query(Economy)){ treasury.set(e.ownerId||0,e); if(e.warExhaustion==null) e.warExhaustion=0 }
    for(const hid of tithe.keys()){ if(!treasury.has(hid)){ const eid=world.createEntity(); const c=new Economy(240,0,hid,0); world.addComponent(eid,c); treasury.set(hid,c) } }
    const combats=events.drain('combat_tick'); let hadWar=false; for(const ct of combats){ hadWar=true; for(const [hs,l] of Object.entries(ct.lossesByOwner||{})){ const t=treasury.get(Number(hs)); if(t) t.warExhaustion=Math.min(100,t.warExhaustion+l*0.017) } }
    if(!hadWar) for(const t of treasury.values()) t.warExhaustion=Math.max(0,t.warExhaustion-0.5*dt); else for(const t of treasury.values()) if(t.warExhaustion>0){ t.gold-=t.warExhaustion*0.016*dt; if(t.gold<0) t.gold=0 }
    for(const tr of events.drain('peace_treaty')){ const w=treasury.get(tr.winner), l=treasury.get(tr.loser); const gold=tr.demands?.gold||0; if(w&&l&&gold>0){ const take=Math.min(l.gold*0.6,gold); l.gold-=take; w.gold+=take } let annexed=0; for(const pid of tr.demands?.provinces||[]){ for(const[,[pos,fief]] of world.query(Position, Province)) if(pos.provinceId===pid && fief.ownerId===tr.loser){ fief.ownerId=tr.winner; annexed++; events.emit('fief_annexed',{fiefId:pid,from:tr.loser,to:tr.winner}); break } } if(w) w.warExhaustion=Math.max(0,w.warExhaustion-28); if(l) l.warExhaustion=Math.max(0,l.warExhaustion-18); events.emit('tribute_paid',{winner:tr.winner,loser:tr.loser,gold,annexed,warScore:tr.warScore,byPlayer:tr.byPlayer||false}) }
    for(const dem of events.drain('tribute_demand')){ const from=treasury.get(dem.from), to=treasury.get(dem.to); const gold=dem.gold||0; if(from&&to&&gold>0){ const take=Math.min(from.gold*0.55,gold); if(take>5){ from.gold-=take; to.gold+=take; events.emit('tribute_extorted',{from:dem.from,to:dem.to,gold:Math.floor(take),byPlayer:dem.byPlayer}) } } }
    for(const [hid,c] of treasury){ const rev=(tithe.get(hid)||0)+(toll.get(hid)||0); c.income=rev; c.gold+=rev*0.118*dt; if(!Number.isFinite(c.gold)) c.gold=0 }
    // conquest
    const fiefMap=new Map(); for(const[,[pos,fief]] of world.query(Position, Province)) fiefMap.set(pos.provinceId,{pos,fief})
    const hostsByFief=new Map(); for(const[,[pos,host]] of world.query(Position, Army)){ if(host.troops<=0) continue; if(!hostsByFief.has(pos.provinceId)) hostsByFief.set(pos.provinceId,[]); hostsByFief.get(pos.provinceId).push(host) }
    let taken=0; for(const [fid,hosts] of hostsByFief){ const entry=fiefMap.get(fid); if(!entry) continue; const {fief}=entry; const houses=[...new Set(hosts.map(h=>h.ownerId))]; if(houses.length!==1) continue; const sole=houses[0]; if(sole===fief.ownerId) continue; const str=hosts.reduce((s,h)=>s+h.troops,0); if(str<190) continue; if(Math.random()<0.38||str>720){ const old=fief.ownerId; fief.ownerId=sole; taken++; events.emit('fief_seized',{fiefId:fid,from:old,to:sole,men:str}) } } if(taken) events.emit('conquest_tick',{conquered:taken})
    // AI muster with unlocks
    let mustered=0
    for(const[hid,coff] of treasury){
      if(hid===PLAYER_HOUSE) continue
      if(coff.gold<130) continue; if(coff.warExhaustion>87 && Math.random()<0.55) continue; if(Math.random()>0.055) continue
      const holds=fiefsByHouse.get(hid)||[]; if(!holds.length) continue; holds.sort((a,b)=>b.fief.manpower-a.fief.manpower); const pick=holds[0]; if(!pick||pick.fief.manpower<58) continue
      const canMAA=hasUnlock(hid,world,TROOP_CATALOG.man_at_arms.unlock); const canKnight=hasUnlock(hid,world,TROOP_CATALOG.knight.unlock); const canLB=hasUnlock(hid,world,TROOP_CATALOG.longbowman.unlock)
      let comp
      const r=Math.random()
      if(canKnight && r<0.22) comp={militia:20,man_at_arms:30,light_cavalry:15,knight:45,archer:10,longbowman:20}
      else if(canMAA && r<0.45) comp={militia:60,man_at_arms:90,light_cavalry:15,knight:0,archer:30,longbowman:25}
      else if(canLB && r<0.68) comp={militia:40,man_at_arms:10,light_cavalry:10,knight:5,archer:35,longbowman:95}
      else if(r<0.5) comp={militia:55,man_at_arms:0,light_cavalry:26,knight:0,archer:30,longbowman:0,archer:0} // fallback T1 mix - intentional duplicate will be overwritten
      else comp={militia:140,man_at_arms:0,light_cavalry:28,knight:0,archer:85,longbowman:0}
      // fix duplicate key
      if(!comp.archer) comp.archer=comp.archer||0
      const cost=Math.floor((comp.militia||0)*0.9 + (comp.man_at_arms||0)*2.1 + (comp.light_cavalry||0)*1.85 + (comp.knight||0)*4.2 + (comp.archer||0)*1.45 + (comp.longbowman||0)*2.3)
      if(coff.gold<cost) continue; coff.gold-=cost; pick.fief.manpower-=60
      events.emit('order_recruit',{provinceId:pick.pos.provinceId,ownerId:hid,comp}); mustered++; if(mustered>=2) break
    }
    if(mustered) events.emit('muster_tick',{mustered})
  }
}
