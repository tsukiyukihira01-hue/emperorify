import { World } from './core/world.js'
import { EventBus } from './core/events.js'
import { TickEngine } from './core/engine.js'
import { Position, Army, Province, Economy } from './components/index.js'
import { MovementSystem } from './systems/movement.js'
import { EconomySystem } from './systems/economy.js'
import { CombatSystem } from './systems/combat.js'
import { Repository } from './db/repository.js'
import { Renderer } from './ui/renderer.js'

const world = new World()
const events = new EventBus()
const engine = new TickEngine(world, events)
const repo = new Repository()

engine.register(new MovementSystem())
engine.register(new EconomySystem())
engine.register(new CombatSystem())

const canvas = document.getElementById('map')
const renderer = new Renderer(canvas, world)
const statsEl = document.getElementById('stats')
const logEl = document.getElementById('log')

function bootstrapDemo(){
  if([...world.query(Position)].length>0) return
  for(let i=0;i<30;i++){
    const eid = world.createEntity()
    const px = (i%6)*120 + 20
    const py = Math.floor(i/6)*120 + 20
    const owner = i%2===0?1:2
    world.addComponent(eid, new Position(px, py, (i%12)))
    world.addComponent(eid, new Province(owner, 10+Math.floor(Math.random()*20), 100))
    if(Math.random()>0.4){
      world.addComponent(eid, new Army(500+Math.floor(Math.random()*3000), 1, owner))
    }
  }
  const eco1 = world.createEntity(); world.addComponent(eco1, new Economy(500,0))
  const eco2 = world.createEntity(); world.addComponent(eco2, new Economy(500,0))
}

function loop(){
  renderer.draw()
  requestAnimationFrame(loop)
}

function updateStats(){
  const armies = [...world.query(Army)].length
  const provs = [...world.query(Province)].length
  statsEl.textContent = `Armies:${armies} Provinces:${provs}`
}

events.on('battle_started', p=>{ logEl.textContent = `Battle in province ${p.provinceId} armies ${p.armies.join(',')}` })
events.on('economy_tick', d=>{ logEl.textContent = `Income ${JSON.stringify(d)}` })

document.getElementById('tick').onclick=()=>{ engine.tick(1); updateStats() }
document.getElementById('run').onclick=async()=>{ for(let i=0;i<60;i++){ engine.tick(1); await new Promise(r=>setTimeout(r,16)) } updateStats() }
document.getElementById('save').onclick=async()=>{ await repo.bulkSave(world); logEl.textContent='Saved bulk to IndexedDB' }

await repo.loadAll(world)
bootstrapDemo()
updateStats()
loop()
