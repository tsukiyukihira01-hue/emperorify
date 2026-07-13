import { World } from './core/world.js'
import { EventBus } from './core/events.js'
import { TickEngine } from './core/engine.js'
import { Position, Army, Province, Economy } from './components/index.js'
import { MovementSystem } from './systems/movement.js'
import { EconomySystem } from './systems/economy.js'
import { CombatSystem } from './systems/combat.js'
import { Renderer } from './ui/renderer.js'

const logEl = document.getElementById('log')
function log(msg){ console.log(msg); if(logEl) logEl.textContent = String(msg).slice(0,500) }

window.addEventListener('error', e=>{ log('JS ERROR: '+e.message+' at '+(e.filename||'')+':'+e.lineno) })
window.addEventListener('unhandledrejection', e=>{ log('PROMISE ERROR: '+(e.reason&&e.reason.message||e.reason)) })

try{
  log('booting ECS...')
  const world = new World()
  const events = new EventBus()
  const engine = new TickEngine(world, events)

  engine.register(new MovementSystem())
  engine.register(new EconomySystem())
  engine.register(new CombatSystem())

  const canvas = document.getElementById('map')
  if(!canvas) throw new Error('canvas #map not found')
  const renderer = new Renderer(canvas, world)

  const statsEl = document.getElementById('stats')

  function bootstrapDemo(){
    log('creating demo entities...')
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
    log('demo created: '+[...world.query(Position)].length+' positions')
  }

  function updateStats(){
    const armies = [...world.query(Army)].length
    const provs = [...world.query(Province)].length
    if(statsEl) statsEl.textContent = `Armies:${armies} Provinces:${provs}`
  }

  function loop(){
    try{ renderer.draw() }catch(err){ log('draw error: '+err.message) }
    requestAnimationFrame(loop)
  }

  events.on('battle_started', p=>{ log(`Battle in province ${p.provinceId}`) })
  events.on('economy_tick', d=>{ /* silent */ })

  const tickBtn = document.getElementById('tick')
  const runBtn = document.getElementById('run')
  const saveBtn = document.getElementById('save')
  if(tickBtn) tickBtn.onclick=()=>{ try{ engine.tick(1); updateStats(); log('ticked') }catch(e){ log('tick error '+e.message) } }
  if(runBtn) runBtn.onclick=async()=>{ for(let i=0;i<60;i++){ engine.tick(1); await new Promise(r=>setTimeout(r,16)) } updateStats() }
  if(saveBtn) saveBtn.onclick=()=>{ log('save disabled in debug build, rendering only') }

  bootstrapDemo()
  updateStats()
  loop()
  log('ECS running. If you see grid and dots, fix worked.')

}catch(err){
  log('FATAL BOOT ERROR: '+err.message+'\n'+err.stack)
  console.error(err)
}
