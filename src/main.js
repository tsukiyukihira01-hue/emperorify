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
function log(m){ console.log(m); if(logEl) logEl.textContent = String(m).slice(0,600) }

const world = new World()
const events = new EventBus()
const engine = new TickEngine(world, events)
const repo = new Repository()

// PHASE ORDER: ai -> movement -> economy -> combat
// AI writes NOTHING, so it can never conflict. It only emits order_move.
engine.register(new AISystem())
engine.register(new MovementSystem())
engine.register(new EconomySystem())
engine.register(new CombatSystem())

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
    world.addComponent(eid, new Province(owner, 10+Math.floor(Math.random()*20), 100))
    if(Math.random()>0.3) world.addComponent(eid, new Army(800+Math.floor(Math.random()*3000), 0.8+Math.random()*0.2, owner))
  }
  const e1 = world.createEntity(); world.addComponent(e1, new Economy(500,0))
}

function updateStats(){
  const a=[...world.query(Army)].length
  const p=[...world.query(Province)].length
  if(statsEl) statsEl.textContent=`Armies:${a} Provinces:${p}`
}

events.on('ai_orders', d=>log(`AI issued ${d.count} orders woof!`))
events.on('battle_started', d=>log(`Battle province ${d.provinceId}`))
events.on('armies_moving', d=>log(`${d.count} armies marching`))

document.getElementById('tick').onclick=()=>{ engine.tick(1); updateStats() }
document.getElementById('run').onclick=async()=>{ for(let i=0;i<60;i++){ engine.tick(1); await new Promise(r=>setTimeout(r,16)) } updateStats() }
document.getElementById('save').onclick=async()=>{ try{ await repo.bulkSave(world); log('Saved bulk to IndexedDB') }catch(e){ log('Save error '+e.message) } }

try{ await repo.loadAll(world); log('Save loaded') }catch(e){ log('No save, demo') }
bootstrapDemo()
updateStats()
;(function loop(){ renderer.draw(); requestAnimationFrame(loop) })()
log('ECS with AI brain ready!')
