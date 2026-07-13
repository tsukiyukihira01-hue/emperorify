import { Province, Relation, TradeRoute } from '../components/index.js'
export class TradeSystem{
  reads=new Set([Province, Relation, TradeRoute]); writes=new Set([TradeRoute]); phase='economy'
  update(world, events, dt){
    const factions=new Set(); const provsByOwner=new Map()
    for(const[,[prov]] of world.query(Province)){ factions.add(prov.ownerId); if(!provsByOwner.has(prov.ownerId)) provsByOwner.set(prov.ownerId,[]); provsByOwner.get(prov.ownerId).push(prov) }
    const ids=[...factions]; if(ids.length<2) return
    const relMap=new Map()
    for(const[,[rel]] of world.query(Relation)){ if(rel.ownerId==null) continue; relMap.set(`${rel.ownerId}->${rel.targetId}`,rel.value) }
    const routeMap=new Map()
    for(const[eid,[route]] of world.query(TradeRoute)){ routeMap.set(`${route.ownerId}:${route.fromProvinceId}->${route.toProvinceId}`,{eid,route}) }
    let created=0, blocked=0, activeCount=0, totalValue=0
    for(const a of ids){ for(const b of ids){ if(a===b) continue; const rv=relMap.get(`${a}->${b}`)??0; if(rv>-10&&Math.random()<0.03&&routeMap.size<14){ const froms=provsByOwner.get(a)||[], tos=provsByOwner.get(b)||[]; if(!froms.length||!tos.length) continue; const eid=world.createEntity(); const val=5+Math.floor(Math.random()*12)+Math.floor(rv/20); const r=new TradeRoute(Math.floor(Math.random()*100),Math.floor(Math.random()*100),val,a,true); r.fromOwner=a; r.toOwner=b; world.addComponent(eid,r); created++ } } }
    for(const {route} of routeMap.values()){
      const toOwner=route.toOwner??0; const rv=relMap.get(`${route.ownerId}->${toOwner}`)??0
      if(rv<-40){ if(route.active){ route.active=false; blocked++ } } else { if(!route.active&&rv>0) route.active=true; if(route.active){ activeCount++; totalValue+=route.value } }
    }
    if(created) events.emit('trade_created',{created})
    if(blocked) events.emit('trade_blocked',{blocked})
    if(activeCount) events.emit('trade_income',{routes:activeCount,value:totalValue})
  }
}
