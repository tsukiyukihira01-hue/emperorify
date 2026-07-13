import { World } from './core/world.js'
import { EventBus } from './core/events.js'
import { TickEngine } from './core/engine.js'
import { Position, Army, Province, Economy } from './components/index.js'
import { MovementSystem } from './systems/movement.js'
import { EconomySystem } from './systems/economy.js'
import { CombatSystem } from './systems/combat.js'
import { AISystem } from './systems/ai.js'
import { Repository } from './db/repository.js'
import { Renderer } from './ui/renderer.js'

const logEl = document.getElementById('log')
const statsEl = document.getElementById('stats')
function log(m){ console.log(m); if(logEl) logEl.textContent = String(m).slice(0,700) }

const world = new World()
const events = new EventBus()
const engine = new TickEngine(world, events)
const repo = new Repository()

// Hardened registration order - global policy will reject conflicts
try{
  engine.register(new AISystem())
  engine.register(new MovementSystem())
  engine.register(new EconomySystem())
  engine.register(new CombatSystem())
  log('Engine hardened: global write lock active')
}catch(e){
  log('REGISTRATION BLOCKED: '+e.message)
  throw e
}

const canvas = document.getElementById('map')
const renderer = new Renderer(canvas, world)

function bootstrapDemo(){
  if([...world.query(Position)].length>0) return
  for(let i=0;i<30;i++){
    const eid = world.createEntity()
    const px = (i%6)*120 + 20
    const py = Math.floor(i/6)*120 + 20
    const owner = i%2===0?1:2
    world.addComponent(eid, new Position(px, py, i%12))
    world.addComponent(eid, new Province(owner, 12+Math.floor(Math.random()*18), 100))
    if(Math.random()>0.25) world.addComponent(eid, new Army(900+Math.floor(Math.random()*2800), 0.9, owner))
  }
  const e1 = world.createEntity(); world.addComponent(e1, new Economy(500,0))
}

function updateStats(){
  const a=[...world.query(Army)].length
  const p=[...world.query(Province)].length
  if(statsEl) statsEl.textContent=`Armies:${a} Prov:${p} Tick:${engine.tickCount} | ${engine.policy.dump()}`
}

events.on('ai_orders', d=>log(`AI brain issued ${d.count} orders (safe, zero writes) woof`))
events.on('armies_moving', d=>log(`${d.count} armies marching to target`))
events.on('battle_started', d=>log(`Battle in province ${d.provinceId}`))
events.on('validation_failed', d=>log(`VALIDATOR caught ${d.errors.length} bad values after ${d.phase}, auto-fixed`))
events.on('system_error', d=>log(`ISOLATED CRASH: ${d.system} in ${d.phase}: ${d.message} - game continues`))
events.on('economy_tick', ()=>{})

document.getElementById('tick').onclick=()=>{ engine.tick(1); updateStats() }
document.getElementById('run').onclick=async()=>{ for(let i=0;i<60;i++){ engine.tick(1); await new Promise(r=>setTimeout(r,16)) } updateStats() }
document.getElementById('save').onclick=async()=>{ try{ await repo.bulkSave(world); log('Saved v2 with migration stamps') }catch(e){ log('Save error '+e.message) } }
document.getElementById('clear')?.addEventListener('click', async()=>{ await repo.clear(); location.reload() })

try{ await repo.loadAll(world); log('Save v2 loaded and migrated') }catch(e){ log('No save, demo mode') }

bootstrapDemo()
updateStats()
;(function loop(){ try{ renderer.draw() }catch(e){ log('Render error '+e.message) } requestAnimationFrame(loop) })()
log('HARDENED ECS READY: global locks + validator + migrations active')
