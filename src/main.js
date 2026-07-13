import { World } from './core/world.js'
import { EventBus } from './core/events.js'
import { TickEngine } from './core/engine.js'
import { Position, Army, Province, Economy, Relation } from './components/index.js'
import { MovementSystem } from './systems/movement.js'
import { EconomySystem } from './systems/economy.js'
import { CombatSystem } from './systems/combat.js'
import { AISystem } from './systems/ai.js'
import { DiplomacySystem } from './systems/diplomacy.js'
import { Repository } from './db/repository.js'
import { Renderer } from './ui/renderer.js'

const logEl=document.getElementById('log')
const statsEl=document.getElementById('stats')
const log=m=>{ console.log(m); if(logEl) logEl.textContent=String(m).slice(0,700) }

const world=new World()
const events=new EventBus()
const engine=new TickEngine(world,events)
const repo=new Repository()

try{
  engine.register(new AISystem())
  engine.register(new DiplomacySystem())
  engine.register(new MovementSystem())
  engine.register(new EconomySystem())
  engine.register(new CombatSystem())
  log('Hardened OK: '+engine.policy.dump())
}catch(e){
  log('BLOCKED '+e.message)
  throw e
}

const canvas=document.getElementById('map')
const renderer=new Renderer(canvas,world)

function boot(){
  if([...world.query(Position)].length) return
  for(let i=0;i<30;i++){
    const eid=world.createEntity()
    const px=(i%6)*120+20
    const py=Math.floor(i/6)*120+20
    const own=i%2===0?1:2
    world.addComponent(eid,new Position(px,py,i%12))
    world.addComponent(eid,new Province(own,12+Math.floor(Math.random()*18),100))
    if(Math.random()>0.25) world.addComponent(eid,new Army(900+Math.floor(Math.random()*2800),0.9,own))
  }
  const e1=world.createEntity()
  world.addComponent(e1,new Economy(500,0))
}

function updateStats(){
  const a=[...world.query(Army)].length
  const p=[...world.query(Province)].length
  const r=[...world.query(Relation)].length
  if(statsEl) statsEl.textContent=`Armies:${a} Prov:${p} Rel:${r} Tick:${engine.tickCount} | ${engine.policy.dump()}`
}

events.on('ai_orders',d=>log(`AI ${d.count} move orders`))
events.on('armies_moving',d=>log(`${d.count} marching`))
events.on('diplomacy_init',d=>log(`Diplomacy created ${d.created} relations`))
events.on('war_declared',d=>log(`WAR declared ${d.from} -> ${d.to}`))
events.on('peace_made',d=>log(`Peace ${d.from} <-> ${d.to}`))
events.on('relation_changed',d=>log(`${d.changed} relations shifted`))
events.on('validation_failed',d=>log(`Validator fixed ${d.errors.length} after ${d.phase}`))
events.on('system_error',d=>log(`Isolated crash ${d.system}: ${d.message}`))
events.on('battle_started',d=>log(`Battle province ${d.provinceId}`))

document.getElementById('tick').onclick=()=>{ engine.tick(1); updateStats() }
document.getElementById('run').onclick=async()=>{ for(let i=0;i<60;i++){ engine.tick(1); await new Promise(r=>setTimeout(r,16)) } updateStats() }
document.getElementById('save').onclick=async()=>{ try{ await repo.bulkSave(world); log('Saved v2 with diplomacy') }catch(e){ log('Save err '+e.message) } }

try{ await repo.loadAll(world); log('Save loaded') }catch{ log('No save demo') }

boot()
updateStats()

;(function loop(){
  try{ renderer.draw() }catch(e){ log('Render '+e.message) }
  requestAnimationFrame(loop)
})()

log('READY with diplomacy - safe, only writes Relation')
