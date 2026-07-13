import { World } from './core/world.js'
import { EventBus } from './core/events.js'
import { TickEngine } from './core/engine.js'
import { Position, Army, Province, Economy, Relation, TradeRoute, Building, PLAYER_HOUSE, hasUnlock, TROOP_CATALOG } from './components/index.js'
import { MovementSystem } from './systems/movement.js'
import { EconomySystem } from './systems/economy.js'
import { CombatSystem } from './systems/combat.js'
import { AISystem } from './systems/ai.js'
import { DiplomacySystem } from './systems/diplomacy.js'
import { TradeSystem } from './systems/trade.js'
import { BuilderSystem } from './systems/builder.js'
import { PlayerSystem } from './systems/player.js'
import { Repository } from './db/repository.js'
import { Renderer } from './ui/renderer.js'

const logEl=document.getElementById('log');const statsEl=document.getElementById('stats')
const log=m=>{console.log(m);if(logEl) logEl.textContent=String(m).slice(0,950)}
const world=new World();const events=new EventBus();const engine=new TickEngine(world,events);const repo=new Repository()
try{ engine.register(new PlayerSystem()); engine.register(new AISystem()); engine.register(new DiplomacySystem()); engine.register(new MovementSystem()); engine.register(new BuilderSystem()); engine.register(new TradeSystem()); engine.register(new EconomySystem()); engine.register(new CombatSystem()); log('T2 + Liege ready: House '+PLAYER_HOUSE+' YOU • '+engine.policy.dump()) }catch(e){log('BLOCKED '+e.message);throw e}
const canvas=document.getElementById('map');const renderer=new Renderer(canvas,world,events)
const fiefNames=['Ashford','Brambleholm','Crowmere','Dunwick','Eldham','Foxley','Greenford','Hartwell','Ironford','Kestrel','Lavenham','Merewick']
function boot(){ if([...world.query(Position)].length) return; for(let i=0;i<28;i++){ const eid=world.createEntity(); const px=(i%7)*122+16, py=Math.floor(i/7)*124+16; const house=i<8?PLAYER_HOUSE:i%3===1?2:3; const name=fiefNames[i%fiefNames.length]+' '+(Math.floor(i/fiefNames.length)+1); world.addComponent(eid,new Position(px,py,i)); world.addComponent(eid,new Province(house,10+Math.floor(Math.random()*12),150,name)); if(Math.random()>0.30){ const militia=160+Math.floor(Math.random()*260); const archer=Math.random()<0.5?60+Math.floor(Math.random()*110):0; const cav=Math.random()<0.38?30+Math.floor(Math.random()*70):0; world.addComponent(eid,new Army(house,{militia,light_cavalry:cav,archer},0.9)) } } const pe=world.createEntity(); world.addComponent(pe,new Economy(360,0,PLAYER_HOUSE,0)) }

let selectedFiefId=null, selectedArmyId=null
function ensurePanels(){
  if(!document.getElementById('playerPanel')){
    const p=document.createElement('div'); p.id='playerPanel'
    p.style.cssText='position:fixed;right:12px;top:12px;width:328px;background:#fffef6;border:1px solid #d6c7a1;border-radius:12px;padding:12px;box-shadow:0 8px 24px rgba(0,0,0,0.14);font-family:ui-serif,serif;z-index:10;max-height:90vh;overflow:auto'
    p.innerHTML=`<div style="font-weight:800;font-size:14px;color:#7a4a00;margin-bottom:6px">Your Court — House 1 ★ <span id="unlockBadges" style="font-size:10px;font-weight:600"></span></div><div id="selInfo" style="font-size:12px;color:#444;min-height:28px;margin-bottom:8px">Click a fief/host.</div>
    <div style="font-weight:700;font-size:11px;margin:6px 0 4px;color:#3f2e1a">TIER 1 — Always</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px"><button id="btnRecMilitia" style="padding:7px;border-radius:8px;border:1px solid #cbb98f;background:#fef9e7;cursor:pointer">Militia 200M<br><span style="font-size:10px">~55g counter Cav</span></button><button id="btnRecArcher" style="padding:7px;border-radius:8px;border:1px solid #cbb98f;background:#eef6ff;cursor:pointer">Archer 160A<br><span style="font-size:10px">~62g counter Inf</span></button><button id="btnRecCav" style="padding:7px;border-radius:8px;border:1px solid #cbb98f;background:#f0ffe9;cursor:pointer">Light Cav 110C<br><span style="font-size:10px">~68g counter Ranged</span></button><button id="btnRecMixed" style="padding:7px;border-radius:8px;border:1px solid #cbb98f;background:#fff4e0;cursor:pointer">Mixed Levy<br><span style="font-size:10px">120M40A30C ~70g</span></button></div>
    <div style="font-weight:700;font-size:11px;margin:8px 0 4px;color:#7c3a00">TIER 2 — Requires Buildings</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px"><button id="btnRecMAA" style="padding:7px;border-radius:8px;border:1px solid #d6b87a;background:#fff7d6;cursor:pointer">Man-at-Arms 80<br><span style="font-size:10px">Keep 2 • 72g • tank</span></button><button id="btnRecKnight" style="padding:7px;border-radius:8px;border:1px solid #d6b87a;background:#fef3c7;cursor:pointer">Knight 45<br><span style="font-size:10px">Keep2+Market1 • 132g</span></button><button id="btnRecLongbow" style="padding:7px;border-radius:8px;border:1px solid #d6b87a;background:#e0f2fe;cursor:pointer">Longbow 90<br><span style="font-size:10px">Market2 • 92g • anti-inf</span></button><button id="btnRecElite" style="padding:7px;border-radius:8px;border:1px solid #b45309;background:#ffedd5;cursor:pointer">Elite Guard<br><span style="font-size:10px">30MAA+20K+20LB ~168g</span></button></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px"><button id="btnBuildManor" style="padding:6px;border-radius:8px;border:1px solid #cbb98f;background:white;cursor:pointer">Manor +3</button><button id="btnBuildKeep" style="padding:6px;border-radius:8px;border:1px solid #cbb98f;background:white;cursor:pointer">Keep +levy unlock T2</button><button id="btnBuildMarket" style="padding:6px;border-radius:8px;border:1px solid #cbb98f;background:white;cursor:pointer">Market +5 unlock LB</button><button id="btnBuildAbbey" style="padding:6px;border-radius:8px;border:1px solid #cbb98f;background:white;cursor:pointer">Abbey</button></div><div id="goldInfo" style="font-size:12px;font-weight:700"></div>`
    document.body.appendChild(p)
  }
  if(!document.getElementById('liegePanel')){
    const lp=document.createElement('div'); lp.id='liegePanel'
    lp.style.cssText='position:fixed;left:12px;top:44px;width:350px;background:#fdfbf3;border:1px solid #b9a88a;border-radius:12px;padding:12px;box-shadow:0 8px 24px rgba(0,0,0,0.14);font-family:ui-serif,serif;z-index:10;max-height:80vh;overflow:auto'
    lp.innerHTML=`<div style="font-weight:800;font-size:14px;color:#3f2e1a">Liege Menu — Tribute & Peace</div><div style="font-size:11px;color:#6b5a2a;margin:4px 0 8px">WarScore from battles/seizes. WS≥25 demand tribute, WS≥30 peace+gold, WS≥60 peace+gold+fief. Counter: Inf>Cav>Ranged>Inf, T2 beats T1.</div><div id="housesList" style="display:flex;flex-direction:column;gap:8px"></div><div id="liegeLog" style="margin-top:8px;font-size:11px;background:#fff7d6;padding:6px;border-radius:8px;min-height:22px"></div>`
    document.body.appendChild(lp)
  }
}
function updatePanels(){
  ensurePanels()
  const selInfo=document.getElementById('selInfo'); const goldInfo=document.getElementById('goldInfo'); const badgeEl=document.getElementById('unlockBadges')
  const econ=[...world.query(Economy)].find(([, [e]])=>e.ownerId===PLAYER_HOUSE)?.[1]?.[0]
  if(goldInfo && econ) goldInfo.textContent=`Crowns: ${Math.floor(econ.gold)} • Income: ${Math.floor(econ.income)} • Unrest: ${Math.floor(econ.warExhaustion)}`
  if(badgeEl){ const canMAA=hasUnlock(PLAYER_HOUSE,world,TROOP_CATALOG.man_at_arms.unlock); const canK=hasUnlock(PLAYER_HOUSE,world,TROOP_CATALOG.knight.unlock); const canLB=hasUnlock(PLAYER_HOUSE,world,TROOP_CATALOG.longbowman.unlock); badgeEl.innerHTML=`${canMAA?'🛡️MAA':''} ${canK?'⚔️Knight':''} ${canLB?'🏹Longbow':''} ${(!canMAA&&!canK&&!canLB)?'(build Keep2/Market2)':''}` }
  if(selectedArmyId!=null){ const a=world.getComponent(selectedArmyId, Army); const p=world.getComponent(selectedArmyId, Position); if(a && selInfo) selInfo.innerHTML=`Host <b>${selectedArmyId}</b> Fief ${p?.provinceId}<br>M:${a.militia} MAA:${a.man_at_arms} C:${a.light_cavalry} K:${a.knight} A:${a.archer} LB:${a.longbowman} • T:${a.troops}<br><i>Click fief to march</i>` }
  else if(selectedFiefId!=null){ const entry=[...world.query(Position, Province)].find(([, [pp]])=>pp.provinceId===selectedFiefId); const pr=entry?.[1]?.[1]; if(selInfo) selInfo.innerHTML=`Fief <b>${selectedFiefId} ${pr?.name||''}</b> Owner H${pr?.ownerId} ${pr?.ownerId===PLAYER_HOUSE?'(YOU)':''}<br>Tithe ${pr?.tax} Levy ${Math.floor(pr?.manpower||0)} ${pr?.ownerId===PLAYER_HOUSE?'<br>Use recruit buttons':''}` }
  const list=document.getElementById('housesList'); if(!list) return; const houses=[...new Set([...world.query(Province)].map(([, [pr]])=>pr.ownerId))].filter(h=>h!==PLAYER_HOUSE).sort(); const relMap=new Map(); for(const[,[rel]] of world.query(Relation)){ if(rel.ownerId===PLAYER_HOUSE) relMap.set(rel.targetId,rel) } list.innerHTML=''; for(const hid of houses){ const rel=relMap.get(hid); const val=rel?Math.floor(rel.value):0; const score=rel?Math.floor(rel.warScore):0; const isWar=val<=-66; const fc=[...world.query(Province)].filter(([, [pr]])=>pr.ownerId===hid).length; const div=document.createElement('div'); div.style.cssText='border:1px solid #e2d5b1;border-radius:10px;padding:8px;background:white'; div.innerHTML=`<div style="display:flex;justify-content:space-between"><b>House ${hid}</b><span style="font-size:11px;padding:2px 6px;border-radius:6px;background:${isWar?'#fee2e2':'#dcfce7'};color:${isWar?'#991b1b':'#166534'}">${isWar?'WAR':'PEACE'} WS:${score} Op:${val}</span></div><div style="font-size:11px;color:#666">Fiefs ${fc}</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px"><button data-act="war" data-h="${hid}" style="padding:6px;border-radius:8px;border:1px solid #fca5a5;background:#fff1f2;cursor:pointer;font-size:11px">Declare War</button><button data-act="tribute" data-h="${hid}" style="padding:6px;border-radius:8px;border:1px solid #fde68a;background:#fffbeb;cursor:pointer;font-size:11px">Demand</button><button data-act="peace" data-h="${hid}" style="padding:6px;border-radius:8px;border:1px solid #a7f3d0;background:#ecfdf5;cursor:pointer;font-size:11px">Sue Peace</button></div>`; list.appendChild(div) } list.querySelectorAll('button').forEach(btn=>{ btn.onclick=()=>{ const h=Number(btn.dataset.h); const act=btn.dataset.act; if(act==='war') events.emit('player_declare_war',{target:h}); if(act==='tribute'){ const rel=relMap.get(h); const ws=rel?.warScore||0; const ask=Math.floor(Math.max(28, ws*3.6+34)); events.emit('player_demand_tribute',{target:h,gold:ask}) } if(act==='peace') events.emit('player_sue_peace',{target:h}) } })
}
ensurePanels()
document.addEventListener('click',e=>{
  const id=e.target.id
  if(!selectedFiefId && id && id.startsWith('btnRec')){ log('Select YOUR fief first (gold border)'); return }
  if(id==='btnRecMilitia') events.emit('player_recruit',{provinceId:selectedFiefId,comp:{militia:200},house:PLAYER_HOUSE})
  if(id==='btnRecArcher') events.emit('player_recruit',{provinceId:selectedFiefId,comp:{archer:160},house:PLAYER_HOUSE})
  if(id==='btnRecCav') events.emit('player_recruit',{provinceId:selectedFiefId,comp:{light_cavalry:110},house:PLAYER_HOUSE})
  if(id==='btnRecMixed') events.emit('player_recruit',{provinceId:selectedFiefId,comp:{militia:120,light_cavalry:30,archer:40},house:PLAYER_HOUSE})
  if(id==='btnRecMAA') events.emit('player_recruit',{provinceId:selectedFiefId,comp:{man_at_arms:80},house:PLAYER_HOUSE})
  if(id==='btnRecKnight') events.emit('player_recruit',{provinceId:selectedFiefId,comp:{knight:45},house:PLAYER_HOUSE})
  if(id==='btnRecLongbow') events.emit('player_recruit',{provinceId:selectedFiefId,comp:{longbowman:90},house:PLAYER_HOUSE})
  if(id==='btnRecElite') events.emit('player_recruit',{provinceId:selectedFiefId,comp:{man_at_arms:30,knight:20,longbowman:20},house:PLAYER_HOUSE})
  if(id==='btnBuildManor') events.emit('player_build',{provinceId:selectedFiefId,kind:'manor',house:PLAYER_HOUSE})
  if(id==='btnBuildKeep') events.emit('player_build',{provinceId:selectedFiefId,kind:'keep',house:PLAYER_HOUSE})
  if(id==='btnBuildMarket') events.emit('player_build',{provinceId:selectedFiefId,kind:'market',house:PLAYER_HOUSE})
  if(id==='btnBuildAbbey') events.emit('player_build',{provinceId:selectedFiefId,kind:'abbey',house:PLAYER_HOUSE})
})
events.on('player_select_army',d=>{ selectedArmyId=d.entityId; selectedFiefId=d.provinceId; updatePanels() })
events.on('player_select_fief',d=>{ selectedFiefId=d.provinceId; if(d.owner!==PLAYER_HOUSE) selectedArmyId=null; updatePanels() })
events.on('player_order_failed',d=>{ log(`Order failed: ${d.reason}`) })
events.on('demand_accepted',d=>{ document.getElementById('liegeLog').textContent=`House ${d.to} paid ${d.gold} crowns! WS ${d.warScore}`; log(`Tribute: House ${d.to} paid ${d.gold}`) })
events.on('demand_rejected',d=>{ document.getElementById('liegeLog').textContent=`House ${d.to} rejected: ${d.reason} (WS ${d.warScore})`; log(`Demand rejected by H${d.to}: ${d.reason}`) })
events.on('tribute_extorted',d=>{ if(d.byPlayer) log(`Collected ${d.gold} from House ${d.from}`) })
events.on('peace_accepted',d=>{ const el=document.getElementById('liegeLog'); if(d.asLoser){ el.textContent=`You surrendered to H${d.from}: paid ${d.gold} ${d.provs?.length?'+ fief':''}`; log(`Surrendered to H${d.from}`) } else { el.textContent=`Peace H${d.from}: gained ${d.gold} ${d.provs?.length?'+ fief '+d.provs[0]:''} WS ${d.warScore}`; log(`Peace H${d.from} gained ${d.gold}`) } updatePanels() })
events.on('peace_rejected',d=>{ document.getElementById('liegeLog').textContent=`H${d.from} rejected peace: ${d.reason}`; log(`Peace rejected H${d.from}`) })
events.on('oath_broken',d=>{ if(d.byPlayer) log(`You declared war on House ${d.to}!`); updatePanels() })
function updateStats(){ let mil=0,maa=0,cav=0,kni=0,arc=0,lb=0, myT=0; for(const[,[a]] of world.query(Army)){ mil+=a.militia; maa+=a.man_at_arms; cav+=a.light_cavalry; kni+=a.knight; arc+=a.archer; lb+=a.longbowman; if(a.ownerId===PLAYER_HOUSE) myT+=a.troops } const p=[...world.query(Province)].length, myP=[...world.query(Province)].filter(([, [pr]])=>pr.ownerId===PLAYER_HOUSE).length; const myGold=[...world.query(Economy)].find(([, [e]])=>e.ownerId===PLAYER_HOUSE)?.[1]?.[0]?.gold||0; if(statsEl) statsEl.textContent=`YOU: Fiefs ${myP}/${p} Troops ${myT} Gold ${Math.floor(myGold)} | World M:${mil} MAA:${maa} C:${cav} K:${kni} A:${arc} LB:${lb} T:${engine.tickCount}`; updatePanels() }
events.on('levy_raised',d=>{ if(d.house===PLAYER_HOUSE){ const c=d.comp; log(`You mustered ${c.militia?c.militia+'M ':''}${c.man_at_arms?c.man_at_arms+'MAA ':''}${c.knight?c.knight+'K ':''}${c.longbowman?c.longbowman+'LB ':''}${c.archer?c.archer+'A ':''}${c.light_cavalry?c.light_cavalry+'C ':''}`) } })
events.on('battle_joined',d=>log(`Battle fief ${d.fiefId} H${d.houses.join(' vs H')} victor H${d.victor} fallen ${d.fallen}`))
events.on('fief_seized',d=>{ if(d.to===PLAYER_HOUSE) log(`You seized fief ${d.fiefId} from H${d.from}! +26 WS`); else if(d.from===PLAYER_HOUSE) log(`Lost fief ${d.fiefId} to H${d.to}!`) })
events.on('tribute_paid',d=>{ if(d.byPlayer) log(`Treaty: you ${d.winner===PLAYER_HOUSE?'gained':'lost'} ${d.gold} crowns ${d.annexed?'+'+d.annexed+' fiefs':''}`) })
events.on('edifice_raised',d=>{ if(d.byPlayer){ log(`You built ${d.kind} in fief ${d.fiefId} — ${d.kind==='keep'?'Keep2 unlocks MAA/Knight':d.kind==='market'?'Market2 unlocks Longbow':'+income'}`); updatePanels() } })
document.getElementById('tick').onclick=()=>{engine.tick(1);updateStats()}
document.getElementById('run').onclick=async()=>{for(let i=0;i<60;i++){engine.tick(1);await new Promise(r=>setTimeout(r,16))}updateStats()}
document.getElementById('save').onclick=async()=>{try{await repo.bulkSave(world);log('Saved v8 T2+Liege')}catch(e){log('Save err '+e.message)}}
document.getElementById('clear')?.addEventListener('click',async()=>{await repo.clear();location.reload()})
try{await repo.loadAll(world);log('Chronicle loaded')}catch{log('No chronicle')}
boot();updateStats();(function loop(){try{renderer.draw()}catch(e){log('Render '+e.message)}requestAnimationFrame(loop)})();log('READY — T2 unlocked: Build Keep2 for Man-at-Arms & Knight, Market2 for Longbowman. Recruit elite to crush T1.')
