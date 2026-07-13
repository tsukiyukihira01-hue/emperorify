export class Renderer {
  constructor(canvas, world){
    this.canvas=canvas; this.world=world
    this.ctx=canvas.getContext('2d')
    this.resize(); addEventListener('resize',()=>this.resize())
    this.offset={x:0,y:0}; this.scale=1
    this.setupPanZoom()
  }
  resize(){ this.canvas.width=innerWidth; this.canvas.height=innerHeight }
  setupPanZoom(){
    let drag=false, last={x:0,y:0}
    this.canvas.addEventListener('pointerdown',e=>{drag=true; last={x:e.clientX,y:e.clientY}})
    addEventListener('pointerup',()=>drag=false)
    addEventListener('pointermove',e=>{
      if(!drag) return
      this.offset.x+= (e.clientX-last.x)/this.scale
      this.offset.y+= (e.clientY-last.y)/this.scale
      last={x:e.clientX,y:e.clientY}
    })
    this.canvas.addEventListener('wheel',e=>{
      e.preventDefault()
      const s = e.deltaY<0?1.1:0.9
      this.scale=Math.max(0.2,Math.min(4,this.scale*s))
    },{passive:false})
  }
  draw(){
    const {ctx, canvas, world} = this
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.save()
    ctx.scale(this.scale,this.scale)
    ctx.translate(this.offset.x, this.offset.y)

    // draw provinces as grid for demo
    ctx.strokeStyle='#1e293b'; ctx.lineWidth=1
    for(let i=0;i<20;i++) for(let j=0;j<12;j++){
      ctx.strokeRect(i*120, j*120, 110,110)
    }

    // lazy import to avoid circular
    import('../components/index.js').then(({Position, Province})=>{
      // provinces are also positions, draw owner color
      for(const [, [pos, prov]] of world.query(Position, Province)){
        ctx.fillStyle = prov.ownerId===1?'#3b82f6aa':'#ef4444aa'
        ctx.fillRect(pos.x-4, pos.y-4, 88,18)
        ctx.fillStyle='#e2e8f0'; ctx.font='11px system-ui'
        ctx.fillText(`P tax:${prov.tax}`, pos.x, pos.y+2)
      }
    })

    import('../components/index.js').then(({Position, Army})=>{
      for(const [, [pos, army]] of world.query(Position, Army)){
        ctx.beginPath()
        ctx.fillStyle = army.ownerId===1?'#60a5fa':'#f87171'
        ctx.arc(pos.x+20, pos.y+50, Math.max(4, Math.sqrt(army.troops)/12),0,Math.PI*2)
        ctx.fill()
        ctx.fillStyle='#fff'; ctx.font='10px system-ui'
        ctx.fillText(`${army.troops}`, pos.x+28, pos.y+54)
      }
    })

    ctx.restore()
  }
}
