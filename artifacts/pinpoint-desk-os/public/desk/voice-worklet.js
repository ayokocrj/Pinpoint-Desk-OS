// Mono PCM capture, no storage. Microphone is disconnected when the session stops.
class ClerkMicrophone extends AudioWorkletProcessor {
  constructor() { super(); this.chunk = new Int16Array(2048); this.offset = 0; }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    for (const value of input) {
      const sample = Math.max(-1, Math.min(1, value));
      this.chunk[this.offset++] = Math.round(sample * (sample < 0 ? 32768 : 32767));
      if (this.offset === this.chunk.length) {
        this.port.postMessage(this.chunk.buffer, [this.chunk.buffer]);
        this.chunk = new Int16Array(2048); this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor('clerk-microphone', ClerkMicrophone);
