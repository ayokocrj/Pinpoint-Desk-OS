# Clerk Live voice

Gemini Live is a separate read-only conversational mode, not a replacement for the deterministic text workflows.

- Server uses `GEMINI_API_KEY` from Secrets. The long-lived key is never returned to the browser.
- Model defaults to `gemini-3.8-live`; optional non-secret `GEMINI_LIVE_MODEL` overrides it. It must support the Live API and audio output.
- A same-origin consent POST issues a 60-second, single-use opaque ticket. `/api/voice/live` consumes it via a WebSocket subprotocol and relays PCM audio. This avoids third-party cookies in embedded previews and keeps tickets out of URL logs. Server-owned model configuration has no action tools.
- Browser sends only microphone audio and one explicit snapshot of the current desk screen at session start. Pasted content visible on that screen can be included: synthetic/anonymised examples only.
- Google receives this content. The application does not persist or log audio, transcripts, screen context or credentials. Google API account terms apply separately.
- Stop, close, hidden page, disconnection, timeout and microphone removal release local capture/playback. Server connections expire after 180 seconds and are closed on client disconnection.
- Demo abuse controls: 2 concurrent sessions, 20 ticket requests/hour, 40 KB WebSocket messages, audio throughput cap and heartbeat. These controls are **per process**, reset on restart, and multiply across replicas. The demo has no user authentication. They are not a billing cap. Set Google project quotas and use private publishing/access control before broad distribution.
- Origin checking and single-use tickets prevent ordinary cross-site initiation/replay, not intentional use by someone who can access the app.

Checks:

```
node artifacts/pinpoint-desk-os/tests/voice-lifecycle.test.mjs
node artifacts/api-server/tests/voice-smoke.mjs
node artifacts/api-server/tests/voice-smoke.mjs --live
```

The last command sends Google's public sample `hello_are_you_there.pcm`, incurs a short API session, verifies returned audio/transcript and ticket replay rejection. It never reads or prints the key. It does not test a physical browser microphone.
