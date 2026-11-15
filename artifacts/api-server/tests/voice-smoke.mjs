// Explicit opt-in integration smoke: uses one short, billed Live session.
// Never reads the API key or prints the one-use session ticket.
import assert from 'node:assert/strict';
import WebSocket from 'ws';
const base = 'http://localhost';
const endpoint = `${base}/api/voice/session`;
const headers = { Origin: base, 'Content-Type': 'application/json' };
const input = { consent: true, context: 'Synthetic test. Morning brief: nine follow-ups today.', sampleRate: 16000 };
const denied = await fetch(endpoint, { method:'POST', headers:{...headers, Origin:'https://example.invalid'}, body:JSON.stringify(input) });
assert.equal(denied.status,403);
const noConsent = await fetch(endpoint, { method:'POST', headers, body:JSON.stringify({...input,consent:false}) });
assert.equal(noConsent.status,400);
console.log('Origin and consent rejection passed.');
if (!process.argv.includes('--live')) process.exit(0);
const sample = await fetch('https://storage.googleapis.com/generativeai-downloads/data/hello_are_you_there.pcm');
assert(sample.ok);
const pcm = Buffer.from(await sample.arrayBuffer());
const ticket = await fetch(endpoint, { method:'POST', headers, body:JSON.stringify(input) });
if(ticket.status!==201) throw new Error(`Session route returned ${ticket.status}: ${(await ticket.json()).error}`);
const config = await ticket.json();
let audioBytes = 0, transcriptChunks = 0, chunkTimer;
await new Promise((resolve,reject) => {
  const ws = new WebSocket(`ws://localhost${config.socketPath}`, ['clerk-voice','ticket.'+config.ticket], { headers:{ Origin:base } });
  const timeout = setTimeout(()=>finish(new Error('No audio response within 40 seconds.')),40000);
  let done = false;
  function finish(error) {
    if(done)return; done=true; clearTimeout(timeout);clearInterval(chunkTimer);
    if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'stop'}));
    ws.close(); error?reject(error):resolve();
  }
  ws.on('error',()=>finish(new Error('WebSocket connection failed.')));
  ws.on('message',raw=>{
    const m=JSON.parse(raw);
    if(m.type==='ready'){
      console.log(`Gemini setup accepted: ${m.model}`);
      let offset=0;
      chunkTimer=setInterval(()=>{
        if(offset<pcm.length){ws.send(pcm.subarray(offset,offset+3200));offset+=3200;}
        else{clearInterval(chunkTimer);ws.send(JSON.stringify({type:'mute'}));}
      },100);
    }
    if(m.type==='transcript')transcriptChunks++;
    if(m.type==='audio')audioBytes+=Buffer.from(m.data,'base64').length;
    if(m.type==='turnComplete' && audioBytes)finish();
    if(m.type==='ended'&&!done)finish(new Error(m.message));
  });
});
assert(audioBytes>0);assert(transcriptChunks>0);
console.log(`Live PCM round trip passed: ${audioBytes} audio bytes and ${transcriptChunks} transcript chunks received.`);
// The ticket must not be reusable.
await new Promise((resolve,reject)=>{
  const ws=new WebSocket(`ws://localhost${config.socketPath}`,['clerk-voice','ticket.'+config.ticket],{headers:{Origin:base}});
  ws.on('open',()=>{ws.close();reject(new Error('Ticket replay unexpectedly accepted'));});
  ws.on('unexpected-response',(req,res)=>{assert.equal(res.statusCode,403);res.destroy();req.destroy();ws.terminate();resolve();});
  ws.on('error',reject);
});
console.log('One-use ticket replay rejected.');
