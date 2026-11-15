import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const code = readFileSync(new URL('../public/desk/voice.js', import.meta.url),'utf8');

function harness({denied=false, delayed=false}={}) {
  const nodes=new Map(), sockets=[], tracks=[], contexts=[];
  let release, requested=0;
  class Element {
    constructor(){this.checked=false;this.disabled=false;this.dataset={};this.events={};this.classList={toggle(){}};this.children=[];this.innerText='Synthetic desk';}
    set id(id){this._id=id;nodes.set(id,this)} get id(){return this._id}
    setAttribute(k,v){this[k]=v} append(...x){this.children.push(...x)} prepend(x){this.children.unshift(x)}
    addEventListener(k,fn){this.events[k]=fn} replaceChildren(){this.children=[]} querySelector(){return null}
    showModal(){this.open=true} close(){this.open=false;this.events.close?.()} focus(){}
  }
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id)};
  class Socket {
    static OPEN=1;
    constructor(){this.readyState=1;this.messages=[];sockets.push(this)}
    send(m){this.messages.push(m)}
    close(){this.readyState=3;this.onclose?.()}
    event(m){this.onmessage?.({data:JSON.stringify(m)})}
  }
  class Context {
    constructor(){this.sampleRate=16000;contexts.push(this)}
    async resume(){} async close(){this.closed=true}
    audioWorklet={addModule:async()=>{}};
    createMediaStreamSource(){return {connect(){},disconnect(){}}}
    createGain(){return {gain:{value:1},connect(){},disconnect(){}}}
  }
  class Worklet {constructor(){this.port={}}connect(){}disconnect(){}}
  const doc={currentScript:{src:'https://example.test/desk/voice.js'},createElement:()=>new Element(),body:new Element(),
    getElementById:get,querySelector:()=>get('composer'),addEventListener(){},hidden:false};
  const sandbox={document:doc,URL,AudioContext:Context,AudioWorkletNode:Worklet,WebSocket:Socket,AbortController,
    setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},Date,console,isSecureContext:true,
    location:{origin:'https://example.test',protocol:'https:'},
    fetch:async()=>({ok:true,json:async()=>({socketPath:'/api/voice/live'})}),
    navigator:{mediaDevices:{getUserMedia:async()=>{
      requested++; if(denied)throw Object.assign(new Error('denied'),{name:'NotAllowedError'});
      const track={enabled:true,stop(){this.stopped=true},addEventListener(){}};
      tracks.push(track);const media={getTracks:()=>[track],getAudioTracks:()=>[track]};
      if(delayed) return new Promise(resolve=>{release=()=>resolve(media)});
      return media;
    }}},
  };
  sandbox.window={AudioWorkletNode:Worklet,PP_APP:{S:{paused:false}},PP_TEST:{tourEnd(){}},addEventListener(){}};
  vm.runInNewContext(code,sandbox);
  return {get,sockets,tracks,contexts,requested:()=>requested,release:()=>release?.()};
}

test('no microphone request without explicit consent',async()=>{
  const h=harness();await h.get('voice-start').onclick();assert.equal(h.requested(),0);
});
test('permission denial releases audio context and enables retry',async()=>{
  const h=harness({denied:true});h.get('voice-consent').checked=true;await h.get('voice-start').onclick();
  assert(h.contexts[0].closed);assert.match(h.get('voice-error').textContent,/denied/);
  assert.equal(h.get('voice-start').disabled,false);assert.equal(h.sockets.length,0);
});
test('mute, unmute and close release microphone and relay',async()=>{
  const h=harness();h.get('voice-consent').checked=true;await h.get('voice-start').onclick();
  const ws=h.sockets[0];ws.event({type:'ready',maxSeconds:180});
  h.get('voice-mute').onclick();assert.equal(h.tracks[0].enabled,false);
  assert(ws.messages.includes('{"type":"mute"}'));
  h.get('voice-mute').onclick();assert.equal(h.tracks[0].enabled,true);
  h.get('voice-dialog').close();
  assert(h.tracks[0].stopped);assert(h.contexts[0].closed);assert.equal(ws.readyState,3);
  assert.equal(h.get('voice-consent').checked,false);assert.equal(h.get('voice-start').disabled,true);
});
test('stop while microphone permission is pending also releases late stream',async()=>{
  const h=harness({delayed:true});h.get('voice-consent').checked=true;
  const pending=h.get('voice-start').onclick();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.requested(),1);
  h.get('voice-stop').onclick();h.release();await pending;
  assert(h.tracks[0].stopped);assert(h.contexts[0].closed);assert.equal(h.sockets.length,0);
});
