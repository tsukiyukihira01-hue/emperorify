import { World } from './core/world.js'
import { EventBus } from './core/events.js'
import { TickEngine } from './core/engine.js'
import { Position, Army, Province, Economy, Relation, TradeRoute, Building } from './components/index.js'
import { MovementSystem } from './systems/movement.js'
import { EconomySystem } from './systems/economy.js'
import { CombatSystem } from './systems/combat.js'
import { AISystem } from './systems/ai.js'
import { DiplomacySystem } from './systems/diplomacy.js'
import { TradeSystem } from './systems/trade.js'
import { BuilderSystem } from './systems/builder.js'
import { Repository } from './db/repository.js'
import { Renderer } from './ui/renderer.js'
const logEl=document.getElementById('log');const statsEl=document.getElementById('stats');const log=m=>{console.log(m);if(logEl) logEl.textContent=String(m).slice(0,700)}
const world=new World();const events=new EventBus();const engine=new TickEngine(world,events);const repo=new Repository()
try{engine.register(new AISystem());engine.register(new DiplomacySystem());engine.register(new MovementSystem());engine.register(new BuilderSystem());engine.register(new TradeSystem());engine.register(new EconomySystem());engine.register(new CombatSystem());log('Hardened OK: '+engine.policy.dump())}catch(e){log('BLOCKED '+e.message);throw e}
const canvas=document.getElementById('map');const renderer=new Renderer(canvas,world)
function boot(){if([...world.query(Position)].length) return;for(let i=0;i<30;i++){const eid=world.createEntity();const px=(i%6)*120+20,py=Math.floor(i/6)*120+20,own=i%2===0?1:2;world.addComponent(eid,new Position(px,py,i%12));world.addComponent(eid,new Province(own,12+Math.floor(Math.random()*18),100));if(Math.random()>0.25) world.addComponent(eid,new Army(900+Math.floor(Math.random()*2800),0.9,own))}}
function updateStats(){const a=[...world.query(Army)].length;const p=[...world.query(Province)].length;const r=[...world.query(Relation)].length;const tr=[...world.query(TradeRoute)].filter(([, [t]])=>t.active).length;const bd=[...world.query(Building)].length;const gold=[...world.query(Economy)].reduce((s,[, [e]])=>s+Math.floor(e.gold),0);if(statsEl) statsEl.textContent=`A:${a} P:${p} Rel:${r} Trade:${tr} Build:${bd} Gold:${gold} T:${engine.tickCount} | ${engine.policy.dump()}`}
events.on('ai_orders',d=>log(`AI ${d.count} orders`));events.on('armies_moving',d=>log(`${d.count} marching`));events.on('diplomacy_init',d=>log(`Diplomacy ${d.created} relations`));events.on('war_declared',d=>log(`WAR ${d.from}->${d.to}`));events.on('peace_made',d=>log(`Peace ${d.from}<->${d.to}`));events.on('trade_created',d=>log(`Trade +${d.created}`));events.on('building_built',d=>log(`Built ${d.type} for ${d.owner}`));events.on('battle_started',d=>log(`Battle in ${d.provinceId} ${d.owners.join('vs')}`));events.on('combat_tick',d=>log(`Combat ${d.battles} b ${d.casualties} dead`));events.on('validation_failed',d=>log(`Fix ${d.errors.length} after ${d.phase}`));events.on('system_error',d=>log(`Crash ${d.system}: ${d.message}`))
document.getElementById('tick').onclick=()=>{engine.tick(1);updateStats()};document.getElementById('run').onclick=async()=>{for(let i=0;i<60;i++){engine.tick(1);await new Promise(r=>setTimeout(r,16))}updateStats()};document.getElementById('save').onclick=async()=>{try{await repo.bulkSave(world);log('Saved v3 full')}catch(e){log('Save err '+e.message)}};document.getElementById('clear')?.addEventListener('click',async()=>{await repo.clear();location.reload()})
try{await repo.loadAll(world);log('Save loaded')}catch{log('No save')}boot();updateStats();(function loop(){try{renderer.draw()}catch(e){log('Render '+e.message)}requestAnimationFrame(loop)})();log('READY full empire')
