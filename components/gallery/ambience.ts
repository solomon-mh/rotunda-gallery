/*
 * Gallery ambience, synthesised live with Web Audio — no sound files.
 *
 *  - Voices: a buzzy glottal source through two moving formant filters, chopped into
 *    syllables and phrases. Through a low-pass and a big room reverb that reads as
 *    people talking quietly — words you can't quite make out.
 *  - Spatial voices are attached to whoever is talking nearby (positioned with HRTF),
 *    a few distant ones make up the room's murmur bed.
 *  - Footsteps: short filtered clicks from walkers near you, echoing in the hall.
 */

type Vec = { x: number; y: number; z: number };

// Rough vowel formants (F1, F2) in Hz.
const VOWELS: [number, number][] = [
  [730, 1090],
  [530, 1840],
  [300, 2200],
  [570, 840],
  [330, 900],
  [660, 1700],
  [450, 1300],
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

class Voice {
  readonly out: GainNode;
  private osc: OscillatorNode;
  private f1: BiquadFilterNode;
  private f2: BiquadFilterNode;
  private env: GainNode;
  private nextAt = 0;
  private phraseLeft = 0;
  /** Speaking pitch (Hz). */
  f0: number;
  /** 0 = silent; 1 = normal; >1 = projecting (the guide). */
  level = 0;
  talking = false;

  constructor(private ctx: AudioContext, dest: AudioNode, pitch: number) {
    this.f0 = pitch;
    this.osc = new OscillatorNode(ctx, { type: "sawtooth", frequency: pitch });
    this.f1 = new BiquadFilterNode(ctx, { type: "bandpass", Q: 5, frequency: 600 });
    this.f2 = new BiquadFilterNode(ctx, { type: "bandpass", Q: 7, frequency: 1500 });
    const f2gain = new GainNode(ctx, { gain: 0.55 });
    this.env = new GainNode(ctx, { gain: 0 });
    const tone = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 1700, Q: 0.4 });
    this.out = new GainNode(ctx, { gain: 0 });
    this.osc.connect(this.f1).connect(this.env);
    this.osc.connect(this.f2).connect(f2gain).connect(this.env);
    this.env.connect(tone).connect(this.out).connect(dest);
    this.osc.start();
  }

  /** Schedule syllables a little ahead of the audio clock. */
  pump() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    if (this.nextAt < now) this.nextAt = now + rand(0.05, 0.4);
    while (this.talking && this.nextAt < now + 0.35) {
      const t = this.nextAt;
      if (this.phraseLeft <= 0) {
        this.phraseLeft = Math.floor(rand(3, 13));
        this.nextAt = t + rand(0.25, 1.1); // breath between phrases
        continue;
      }
      const dur = rand(0.09, 0.26);
      const [a, b] = VOWELS[Math.floor(Math.random() * VOWELS.length)];
      const k = rand(0.9, 1.12);
      // Pitch drifts down across a phrase, with a little lilt per syllable.
      const pitch = this.f0 * (1 + this.phraseLeft * 0.012) * rand(0.94, 1.08);
      this.osc.frequency.setTargetAtTime(pitch, t, 0.03);
      this.f1.frequency.setTargetAtTime(a * k, t, 0.025);
      this.f2.frequency.setTargetAtTime(b * k, t, 0.025);
      const peak = rand(0.55, 1);
      this.env.gain.setTargetAtTime(peak, t, 0.018);
      this.env.gain.setTargetAtTime(0.04, t + dur * 0.7, 0.03);
      this.nextAt = t + dur + rand(0.01, 0.07);
      this.phraseLeft--;
    }
    if (!this.talking) this.env.gain.setTargetAtTime(0, now, 0.08);
    this.out.gain.setTargetAtTime(this.level * 0.11, now, 0.25);
  }

  stop() {
    this.osc.stop();
  }
}

type SpatialVoice = { voice: Voice; panner: PannerNode; owner: number };

export class GalleryAudio {
  readonly ctx: AudioContext;
  private master: GainNode;
  private dry: GainNode;
  private wet: ConvolverNode;
  private spatial: SpatialVoice[] = [];
  private bed: Voice[] = [];
  private noise: AudioBuffer;
  private pumpTimer: number;
  private volume = 0;

  constructor() {
    const ctx = (this.ctx = new AudioContext());
    this.master = new GainNode(ctx, { gain: 0 });
    this.master.connect(ctx.destination);

    // The hall: a long, soft reverb so voices blur into murmur.
    this.wet = new ConvolverNode(ctx, { buffer: impulse(ctx, 2.6, 2.2) });
    const wetGain = new GainNode(ctx, { gain: 0.55 });
    this.wet.connect(wetGain).connect(this.master);
    this.dry = new GainNode(ctx, { gain: 0.8 });
    this.dry.connect(this.master);

    this.noise = noiseBuffer(ctx, 0.25);

    // Murmur bed: distant voices, mostly reverb.
    const bedBus = new GainNode(ctx, { gain: 0.5 });
    const bedTone = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 900 });
    bedBus.connect(bedTone);
    bedTone.connect(this.wet);
    bedTone.connect(new GainNode(ctx, { gain: 0.25 })).connect(this.master);
    for (let i = 0; i < 5; i++) {
      const v = new Voice(ctx, bedBus, i % 2 ? rand(95, 135) : rand(175, 235));
      v.level = rand(0.25, 0.45);
      this.bed.push(v);
    }

    // Close-by voices that follow particular visitors.
    for (let i = 0; i < 6; i++) {
      const panner = new PannerNode(ctx, {
        panningModel: "HRTF",
        distanceModel: "inverse",
        refDistance: 1.6,
        rolloffFactor: 1.3,
        maxDistance: 40,
      });
      panner.connect(this.dry);
      panner.connect(this.wet);
      this.spatial.push({ voice: new Voice(ctx, panner, 150), panner, owner: -1 });
    }

    this.pumpTimer = window.setInterval(() => this.pump(), 90);
  }

  private pump() {
    if (this.ctx.state !== "running") return;
    // Bed voices drift in and out of conversation.
    for (const v of this.bed) {
      if (Math.random() < 0.02) v.talking = !v.talking || Math.random() < 0.6;
      v.pump();
    }
    for (const s of this.spatial) s.voice.pump();
  }

  /** Fade the whole soundscape in or out (the context must be resumed from a user gesture). */
  setEnabled(on: boolean) {
    this.volume = on ? 1 : 0;
    if (on && this.ctx.state === "suspended") void this.ctx.resume();
    this.master.gain.setTargetAtTime(this.volume * 0.9, this.ctx.currentTime, 0.4);
  }

  /** Pause audio while the gallery isn't on screen. */
  setPaused(paused: boolean) {
    if (paused) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    else this.master.gain.setTargetAtTime(this.volume * 0.9, this.ctx.currentTime, 0.3);
  }

  setListener(pos: Vec, forward: Vec) {
    const l = this.ctx.listener;
    const t = this.ctx.currentTime;
    if (l.positionX) {
      l.positionX.setTargetAtTime(pos.x, t, 0.05);
      l.positionY.setTargetAtTime(pos.y, t, 0.05);
      l.positionZ.setTargetAtTime(pos.z, t, 0.05);
      l.forwardX.setTargetAtTime(forward.x, t, 0.05);
      l.forwardY.setTargetAtTime(forward.y, t, 0.05);
      l.forwardZ.setTargetAtTime(forward.z, t, 0.05);
      l.upX.value = 0;
      l.upY.value = 1;
      l.upZ.value = 0;
    } else {
      // Older engines (Firefox) only have the method form.
      l.setPosition(pos.x, pos.y, pos.z);
      l.setOrientation(forward.x, forward.y, forward.z, 0, 1, 0);
    }
  }

  /**
   * Give the close-by voices to the nearest talkers.
   * `talkers` are visitor ids with their mouth position, pitch and how loudly they speak.
   */
  assignTalkers(talkers: { id: number; pos: Vec; pitch: number; level: number; dist: number }[]) {
    const nearest = talkers.sort((a, b) => a.dist - b.dist).slice(0, this.spatial.length);
    const wanted = new Set(nearest.map((t) => t.id));
    // Release voices whose owner is no longer talking nearby.
    for (const s of this.spatial) {
      if (s.owner >= 0 && !wanted.has(s.owner)) {
        s.owner = -1;
        s.voice.talking = false;
        s.voice.level = 0;
      }
    }
    const t = this.ctx.currentTime;
    for (const tk of nearest) {
      let s = this.spatial.find((x) => x.owner === tk.id);
      if (!s) {
        s = this.spatial.find((x) => x.owner < 0);
        if (!s) continue;
        s.owner = tk.id;
        s.voice.f0 = tk.pitch;
        s.panner.positionX.value = tk.pos.x;
        s.panner.positionY.value = tk.pos.y;
        s.panner.positionZ.value = tk.pos.z;
      }
      s.voice.talking = tk.level > 0;
      s.voice.level = tk.level;
      s.panner.positionX.setTargetAtTime(tk.pos.x, t, 0.08);
      s.panner.positionY.setTargetAtTime(tk.pos.y, t, 0.08);
      s.panner.positionZ.setTargetAtTime(tk.pos.z, t, 0.08);
    }
  }

  /** One footfall: `pan` -1…1 left/right of the listener, `dist` sets loudness, `hard` = heels on stone. */
  footstep(pan: number, dist: number, hard: boolean) {
    if (this.ctx.state !== "running" || this.volume === 0 || dist > 9) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.005;
    const src = new AudioBufferSourceNode(ctx, { buffer: this.noise, playbackRate: rand(0.85, 1.15) });
    const band = new BiquadFilterNode(ctx, { type: "bandpass", frequency: hard ? rand(2200, 3200) : rand(500, 900), Q: hard ? 1.6 : 0.8 });
    const g = new GainNode(ctx, { gain: 0 });
    const peak = (hard ? 0.5 : 0.32) / (1 + dist * 0.45);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (hard ? 0.07 : 0.11));
    const panner = new StereoPannerNode(ctx, { pan: Math.max(-0.8, Math.min(0.8, pan)) });
    src.connect(band).connect(g).connect(panner);
    panner.connect(this.dry);
    panner.connect(this.wet);
    src.start(t);
    src.stop(t + 0.15);
    src.onended = () => panner.disconnect();
  }

  dispose() {
    window.clearInterval(this.pumpTimer);
    this.bed.forEach((v) => v.stop());
    this.spatial.forEach((s) => s.voice.stop());
    void this.ctx.close();
  }
}

let shared: GalleryAudio | null = null;

/** The one audio engine for the page. Create it from a user gesture so it can start. */
export function getGalleryAudio() {
  if (!shared) shared = new GalleryAudio();
  return shared;
}
/** The engine if it already exists — never creates one. */
export const peekGalleryAudio = () => shared;

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Stereo decaying-noise impulse response for a large, hard-walled room. */
function impulse(ctx: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // A short pre-delay, then a smooth exponential tail.
      d[i] = i < ctx.sampleRate * 0.012 ? 0 : (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * 0.6;
    }
  }
  return buf;
}
