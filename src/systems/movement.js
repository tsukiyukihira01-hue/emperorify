import { Position, Army, Province } from '../components/index.js'
export class MovementSystem{
  reads=new Set([Position,Army,Province]); writes=new Set([Position]); phase='movement'
  update(world,events,dt){
    const fiefPos=new Map(); for(const[,[p]] of world.query(Position,Province)) fiefPos.set(p.provinceId,p)
    for(const o of events.drain('order_move')){ const pos=world.getComponent(o.entityId,Position); if(!pos) continue; const t=fiefPos.get(o.targetProvinceId); if(!t) continue; pos._tx=t.x+18; pos._ty=t.y+54; pos._speed=o.speed||1.0; pos.provinceId=o.targetProvinceId }
    for(const[,[pos,host]] of world.query(Position,Army)){ if(host.troops<=0) continue; if(pos._tx!==undefined){ const dx=pos._tx-pos.x, dy=pos._ty-pos.y, d=Math.hypot(dx,dy); if(d<3){ delete pos._tx; delete pos._ty; delete pos._speed; events.emit('host_arrived',{provinceId:pos.provinceId,owner:host.ownerId}) } else { const s=(pos._speed||1)*2.5*dt; pos.x+=dx/d*s; pos.y+=dy/d*s } } }
  }
}
