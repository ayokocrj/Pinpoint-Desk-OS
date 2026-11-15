/* Gemini Live via same-origin server relay. No API key, persistent transcript or recording. */
(() => {
  const $ = id => document.getElementById(id);
  const base = new URL('../', document.currentScript.src);
  const micIcon = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>';
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'btn sm voice-launch';
  button.id = 'voice-launch'; button.innerHTML = micIcon + ' Talk to Clerk';
  button.setAttribute('aria-haspopup', 'dialog');
  document.querySelector('.composer').prepend(button);
  const dialog = document.createElement('dialog');
  dialog.id = 'voice-dialog'; dialog.setAttribute('aria-labelledby', 'voice-title');
  dialog.innerHTML = `
    <header class="voice-head"><img src="${new URL('brand/pinpoint-mark.png', base)}" alt="" width="38" height="38">
      <div><h2 id="voice-title">Talk to Clerk</h2><span>Gemini Live · read-only voice assistant</span></div>
      <button id="voice-close" class="btn sm" aria-label="End voice session and close">Close</button></header>
    <div class="voice-main">
      <div class="voice-state"><span id="voice-dot"></span><b id="voice-status" role="status" aria-live="polite">Ready to connect</b><span id="voice-time"></span></div>
      <p class="voice-description">Ask about the current desk screen. Clerk responds aloud and you can interrupt naturally. It can explain the evidence, but cannot take actions.</p>
      <div id="voice-consent-box"><label><input id="voice-consent" type="checkbox">
        I agree to send my microphone audio and the current desk screen text to Google Gemini.</label>
        <p>Use synthetic or anonymised data only. Google processes this content under your API account terms. This demo does not save audio or transcripts. Google API usage may be billed.</p></div>
      <div class="voice-controls">
        <button id="voice-start" class="btn primary" disabled>Start conversation</button>
        <button id="voice-mute" class="btn" aria-pressed="false" disabled>Mute microphone</button>
        <button id="voice-stop" class="btn bad" disabled>End session</button>
      </div>
      <div id="voice-error" role="alert" hidden></div>
      <div id="voice-transcript" aria-label="Live transcript" role="log" aria-live="polite"><p class="voice-empty">Your conversation will appear here. Headphones are recommended.</p></div>
      <p class="voice-foot">Up to 3 minutes per session. Only the screen visible when you start is shared. Close this window to stop the microphone and audio.</p>
    </div>`;
  document.body.append(dialog);
  let epoch = 0, active = false, ready = false, muted = false;
  let socket, media, audio, input, worklet, silent, timer, watchdog, fetchController;
  let nextAudioTime = 0, deadline = 0, latestLine = null;
  const sources = new Set();
  const update = (text, state = '') => {
    $('voice-status').textContent = text;
    dialog.dataset.state = state;
    button.classList.toggle('on', active);
    button.setAttribute('aria-label', active ? 'Open active voice session' : 'Talk to Clerk');
  };
  function stopPlayback() {
    for (const source of sources) { try { source.stop(); } catch {} }
    sources.clear(); nextAudioTime = 0;
  }
  function stop(message = 'Session ended. Microphone off.', error = false) {
    epoch++; active = ready = false; muted = false;
    clearInterval(timer); clearTimeout(watchdog);
    fetchController?.abort(); fetchController = null;
    if (socket) {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({type:'stop'}));
      socket.close(); socket = null;
    }
    media?.getTracks().forEach(track => track.stop()); media = null;
    if (worklet) { worklet.port.onmessage = null; worklet.disconnect(); }
    input?.disconnect(); silent?.disconnect(); worklet = input = silent = null;
    stopPlayback(); if (audio) { void audio.close().catch(() => {}); audio = null; }
    $('voice-start').disabled = !$('voice-consent').checked;
    $('voice-mute').disabled = $('voice-stop').disabled = true;
    $('voice-mute').textContent = 'Mute microphone'; $('voice-mute').setAttribute('aria-pressed','false');
    $('voice-consent').disabled = false;
    $('voice-time').textContent = '';
    if (error) { $('voice-error').textContent = message; $('voice-error').hidden = false; }
    update(message, error ? 'error' : '');
  }
  function addTranscript(role, text) {
    if (!text) return;
    const box = $('voice-transcript');
    box.querySelector('.voice-empty')?.remove();
    if (!latestLine || latestLine.dataset.role !== role) {
      latestLine = document.createElement('div');
      latestLine.className = 'voice-line'; latestLine.dataset.role = role;
      const label = document.createElement('b'); label.textContent = role === 'user' ? 'You' : 'Clerk';
      const content = document.createElement('p');
      latestLine.append(label, content); box.append(latestLine);
    }
    latestLine.querySelector('p').append(document.createTextNode(text));
    while (box.children.length > 60) box.firstElementChild.remove();
    box.scrollTop = box.scrollHeight;
  }
  function play(data, rate) {
    if (!audio || !ready) return;
    const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    if (bytes.length % 2) return;
    const view = new DataView(bytes.buffer);
    const buffer = audio.createBuffer(1, bytes.length / 2, rate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) channel[i] = view.getInt16(i * 2, true) / 32768;
    if (nextAudioTime - audio.currentTime > 30) { stop('Audio playback fell behind. Please reconnect.', true); return; }
    const source = audio.createBufferSource(); source.buffer = buffer; source.connect(audio.destination);
    nextAudioTime = Math.max(nextAudioTime, audio.currentTime + .025);
    source.start(nextAudioTime); nextAudioTime += buffer.duration; sources.add(source);
    update(muted ? 'Clerk speaking · microphone muted' : 'Clerk speaking · you can interrupt', 'speaking');
    source.onended = () => {
      sources.delete(source);
      if (ready && !sources.size) update(muted ? 'Microphone muted' : 'Listening', muted ? 'muted' : 'listening');
    };
  }
  async function start() {
    if (active || !$('voice-consent').checked) return;
    if (window.PP_APP?.S?.paused) { stop('Clerk is paused. Resume it in Rules and log first.', true); return; }
    if (!isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) {
      stop('Voice requires HTTPS and a browser with microphone and AudioWorklet support. Try a recent Chrome, Edge or Safari.', true); return;
    }
    const run = ++epoch; active = true; ready = muted = false;
    $('voice-error').hidden = true;
    $('voice-start').disabled = true; $('voice-stop').disabled = false; $('voice-consent').disabled = true;
    $('voice-transcript').replaceChildren(); latestLine = null;
    update('Allow microphone access…', 'connecting');
    // Starting a voice session ends the scripted tour so its auto-navigation cannot change context.
    window.PP_TEST?.tourEnd();
    watchdog = setTimeout(() => { if (epoch === run) stop('Connection timed out. Please try again.', true); }, 30000);
    try {
      const context = new AudioContext({sampleRate:16000});
      audio = context; await context.resume();
      if (run !== epoch) return;
      const stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true, channelCount:1}, video:false});
      if (run !== epoch) { stream.getTracks().forEach(t => t.stop()); return; }
      media = stream;
      media.getAudioTracks()[0].addEventListener('ended', () => { if (run === epoch) stop('Microphone disconnected.', true); });
      await context.audioWorklet.addModule(new URL('desk/voice-worklet.js', base));
      if (run !== epoch) return;
      update('Connecting to Gemini Live…', 'connecting');
      fetchController = new AbortController();
      const response = await fetch(new URL('api/voice/session', base), {
        method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({consent:true, context:document.getElementById('main').innerText.slice(0,12000), sampleRate:context.sampleRate}),
        signal:fetchController.signal,
      });
      const result = await response.json();
      if (run !== epoch) return;
      if (!response.ok) throw new Error(result.error || 'Voice service unavailable.');
      const url = new URL(result.socketPath, location.origin); url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(url, ['clerk-voice', 'ticket.' + result.ticket]);
      socket.onmessage = event => {
        if (run !== epoch) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ready') {
            ready = true; clearTimeout(watchdog);
            input = context.createMediaStreamSource(stream);
            worklet = new AudioWorkletNode(context, 'clerk-microphone');
            silent = context.createGain(); silent.gain.value = 0;
            worklet.port.onmessage = e => {
              if (run !== epoch || !ready || muted || socket?.readyState !== WebSocket.OPEN) return;
              if (socket.bufferedAmount > 128000) { stop('Connection too slow for live audio. Please reconnect.', true); return; }
              socket.send(e.data);
            };
            input.connect(worklet); worklet.connect(silent); silent.connect(context.destination);
            $('voice-mute').disabled = false;
            deadline = Date.now() + msg.maxSeconds * 1000;
            timer = setInterval(() => {
              const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
              $('voice-time').textContent = `${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;
              if (!left) stop('Three-minute session ended. Microphone off.');
              else if (window.PP_APP?.S?.paused) stop('Clerk paused. Voice session stopped.');
            }, 1000);
            update('Listening · say hello', 'listening');
          } else if (msg.type === 'audio') play(msg.data, msg.sampleRate);
          else if (msg.type === 'transcript') addTranscript(msg.role, msg.text);
          else if (msg.type === 'interrupted') { stopPlayback(); latestLine = null; update(muted ? 'Microphone muted' : 'Listening', muted ? 'muted' : 'listening'); }
          else if (msg.type === 'turnComplete') latestLine = null;
          else if (msg.type === 'ended') stop(msg.message, !ready);
        } catch { stop('Unable to read the voice stream. Please reconnect.', true); }
      };
      socket.onerror = () => { if (run === epoch) stop('Voice connection failed. Check your connection and try again.', true); };
      socket.onclose = () => { if (run === epoch) stop('Voice connection closed. Microphone off. Start again to reconnect.', true); };
    } catch (err) {
      if (run !== epoch) return;
      const message = err.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow access in your browser and try again.'
        : err.name === 'NotFoundError' ? 'No microphone was found. Connect one and try again.'
        : err.name === 'NotReadableError' ? 'Your microphone is busy or unavailable. Close other audio apps and try again.'
        : err.message || 'Could not start voice.';
      stop(message, true);
    }
  }
  button.onclick = () => dialog.showModal();
  $('voice-close').onclick = () => dialog.close();
  $('voice-start').onclick = start;
  $('voice-stop').onclick = () => stop();
  $('voice-consent').onchange = () => { $('voice-start').disabled = active || !$('voice-consent').checked; };
  $('voice-mute').onclick = () => {
    if (!ready) return;
    muted = !muted; media?.getAudioTracks().forEach(t => { t.enabled = !muted; });
    if (muted && socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({type:'mute'}));
    $('voice-mute').textContent = muted ? 'Unmute microphone' : 'Mute microphone';
    $('voice-mute').setAttribute('aria-pressed',String(muted));
    update(muted ? 'Microphone muted' : 'Listening', muted ? 'muted' : 'listening');
  };
  dialog.addEventListener('close', () => {
    stop(); $('voice-transcript').replaceChildren(); latestLine = null;
    $('voice-consent').checked = false; $('voice-start').disabled = true; button.focus();
  });
  dialog.addEventListener('cancel', e => { e.preventDefault(); e.stopPropagation(); dialog.close(); });
  window.addEventListener('pagehide', () => stop());
  document.addEventListener('visibilitychange', () => { if (document.hidden && active) stop('Voice stopped because this page was hidden.'); });
})();
