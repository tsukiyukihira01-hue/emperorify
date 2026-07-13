import { Position, Province, Army, Building, TradeRoute } from '../components/index.js'
export class Renderer{
  constructor(canvas, world){
    this.canvas=canvas; this.world=world; this.ctx=canvas.getContext('2d')
    this.resize(); addEventListener('resize',()=>this.resize())
    this.offset={x:40,y:60}; this.scale=1; this.setupPanZoom()
  }
  resize(){ this.canvas.width=innerWidth; this.canvas.height=innerHeight }
  setupPanZoom(){
    let drag=false,last={x:0,y:0}
    this.canvas.addEventListener('pointerdown',e=>{drag=true; last={x:e.clientX,y:e.clientY}})
    addEventListener('pointerup',()=>drag=false)
    addEventListener('pointermove',e=>{ if(!drag) return; this.offset.x+=(e.clientX-last.x)/this.scale; this.offset.y+=(e.clientY-last.y)/this.scale; last={x:e.clientX,y:e.clientY} })
    this.canvas.addEventListener('wheel',e=>{ e.preventDefault(); const s=e.deltaY<0?1.1:0.9; this.scale=Math.max(0.2,Math.min(4,this.scale*s)) },{passive:false})
  }
  draw(){
    const {ctx,canvas,world}=this
    ctx.fillStyle='#0f1219'; ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.save(); ctx.scale(this.scale,this.scale); ctx.translate(this.offset.x,this.offset.y)
    ctx.strokeStyle='#1e293b'; ctx.lineWidth=1
    for(let i=0;i<20;i++) for(let j=0;j<12;j++) ctx.strokeRect(i*120,j*120,110,110)
    for(const [,[pos,prov]] of world.query(Position, Province)){
      ctx.fillStyle=prov.ownerId===1?'#3b82f6cc':'#ef4444aa'
      ctx.fillRect(pos.x,pos.y,90,20)
      ctx.fillStyle='#e2e8f0'; ctx.font='11px system-ui'; ctx.fillText(`P tax:${prov.tax}`,pos.x+4,pos.y+13)
      // building icons
      let bCount=0; for(const [,[b]] of world.query(Building)){ if(b.provinceId%1000===prov.ownerId*10+prov.ownerId) bCount++ }
    }
    for(const [,[pos,army]] of world.query(Position, Army)){
      ctx.beginPath(); ctx.fillStyle=army.ownerId===1?'#60a5fa':'#f87171'
      const r=Math.max(6,Math.sqrt(army.troops)/9); ctx.arc(pos.x+20,pos.y+50,r,0,Math.PI*2); ctx.fill()
      ctx.fillStyle='#fff'; ctx.font='10px system-ui'; ctx.fillText(`${army.troops}`,pos.x+32,pos.y+54)
    }
    // trade routes as faint lines
    ctx.strokeStyle='#facc1533'; ctx.lineWidth=1
    for(const [,[tr]] of world.query(TradeRoute)){ if(!tr.active) continue; ctx.beginPath(); ctx.moveTo(Math.random()*600,Math.random()*400); ctx.lineTo(Math.random()*600,Math.random()*400); ctx.stroke() }
    ctx.restore()
  }
}
