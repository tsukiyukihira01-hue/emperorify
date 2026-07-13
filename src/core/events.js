export class EventBus {
  constructor(){ this.queues = new Map(); this.subs = new Map() }
  emit(topic, payload){
    if(!this.queues.has(topic)) this.queues.set(topic, [])
    this.queues.get(topic).push(payload)
    const subs = this.subs.get(topic); if(subs) for(const fn of subs) fn(payload)
  }
  on(topic, fn){
    if(!this.subs.has(topic)) this.subs.set(topic, [])
    this.subs.get(topic).push(fn)
  }
  drain(topic){
    const q = this.queues.get(topic)||[]
    this.queues.set(topic, [])
    return q
  }
}
