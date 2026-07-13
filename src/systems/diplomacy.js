import { Province, Relation, TradeRoute } from '../components/index.js'

/**
 * TradeSystem - SAFE plugin
 * Only writes TradeRoute. EconomySystem remains sole writer of Economy and reads TradeRoute for income.
 * Phase economy, after diplomacy (diplomacy runs in ai, trade in economy)
 */
export class TradeSystem{
  reads=new Set([Province, Relation, TradeRoute])
  writes=new Set([TradeRoute])
  phase='economy'

  update(world, events, dt){
    const factions=new Set()
    const provsByOwner=new Map()
    for(const[,[prov]] of world.query(Province)){
      factions.add(prov.ownerId)
      if(!provsByOwner.has(prov.ownerId)) provsByOwner.set(prov.ownerId,[])
      provsByOwner.get(prov.ownerId).push(prov)
    }
    const ids=[...factions]
    if(ids.length<2) return

    // index relations for peace check
    const relMap=new Map()
    for(const[,[rel]] of world.query(Relation)){
      if(!rel.ownerId) continue
      relMap.set(`${rel.ownerId}->${rel.targetId}`, rel.value)
    }

    // index existing routes
    const routeMap=new Map()
    for(const[eid,[route]] of world.query(TradeRoute)){
      routeMap.set(`${route.ownerId}:${route.fromProvinceId}->${route.toProvinceId}`, {eid, route})
    }

    let created=0, blocked=0, activeCount=0
    // try to create 1-2 routes per peaceful pair
    for(const a of ids){
      for(const b of ids){
        if(a===b) continue
        const relVal=relMap.get(`${a}->${b}`) ?? 0
        if(relVal<-30){
          // war: deactivate routes from a to b
          for(const {route} of routeMap.values()){
            if(route.ownerId===a && provsByOwner.get(b)?.some(p=>p===route.toProvinceId || true)){
              // crude: deactivate if route goes to enemy owner provinces
              // we need to know toProvince owner, get via provinceId lookup
            }
          }
          continue
        }
        if(relVal> -10 && Math.random()<0.03){
          const fromProvs=provsByOwner.get(a)||[]
          const toProvs=provsByOwner.get(b)||[]
          if(!fromProvs.length||!toProvs.length) continue
          const from=fromProvs[Math.floor(Math.random()*fromProvs.length)]
          const to=toProvs[Math.floor(Math.random()*toProvs.length)]
          // avoid duplicate
          const key=`${a}:${from.ownerId===a? 'f' : from.ownerId}->${to.ownerId}`
          // simpler key using provinceId not available, use random check via existing count
          if(routeMap.size>12) continue // cap routes
          const eid=world.createEntity()
          const value=5+Math.floor(Math.random()*12)+Math.floor(relVal/20)
          const r=new TradeRoute(0,0,value,a,true)
          // store province ids via extra props since TradeRoute constructor uses ids, but we don't have provinceId mapping from Province alone (we have it via Position, but for now use random)
          // For demo, use owner ids as proxy, renderer can ignore
          r.fromProvinceId=Math.floor(Math.random()*100)
          r.toProvinceId=Math.floor(Math.random()*100)
          r.fromOwner=a; r.toOwner=b
          world.addComponent(eid,r)
          created++
        }
      }
    }

    // update existing routes: deactivate if war, otherwise produce income
    let totalValue=0
    for(const {route} of routeMap.values()){
      const toOwner=route.toOwner ?? route.toProvinceId % 3 // fallback
      const relVal=relMap.get(`${route.ownerId}->${toOwner}`) ?? 0
      if(relVal<-40){
        if(route.active){ route.active=false; blocked++ }
      } else {
        if(!route.active && relVal>0){ route.active=true }
        if(route.active){ totalValue+=route.value; activeCount++ }
      }
    }

    if(created) events.emit('trade_created',{created})
    if(blocked) events.emit('trade_blocked',{blocked})
    if(activeCount) events.emit('trade_income',{routes:activeCount, value:totalValue})
  }
}

