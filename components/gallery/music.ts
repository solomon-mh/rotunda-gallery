/*
 * Background music for the walk: a small playlist of public-domain / CC0 piano and
 * string recordings (sources in public/music/CREDITS.md), played from one <audio>
 * element routed through Web Audio so volume and fades also work on iOS, where
 * HTMLMediaElement.volume is read-only.
 */

export type Track = {
  src: string;
  title: string;
  composer: string;
  performer: string;
};

export const TRACKS: Track[] = [
  { src: "/music/satie-gymnopedie-1.mp3", title: "Gymnopédie No. 1", composer: "Erik Satie", performer: "Michael Laucke, guitar" },
  { src: "/music/debussy-clair-de-lune.mp3", title: "Clair de lune", composer: "Claude Debussy", performer: "Laurens Goedhart, piano" },
  { src: "/music/chopin-nocturne-op9-2.mp3", title: "Nocturne in E-flat, Op. 9 No. 2", composer: "Frédéric Chopin", performer: "Musopen" },
  { src: "/music/bach-goldberg-aria.mp3", title: "Goldberg Variations: Aria", composer: "J. S. Bach", performer: "Kimiko Ishizaka, piano" },
  { src: "/music/bach-air.mp3", title: "Air on the G String", composer: "J. S. Bach", performer: "U.S. Air Force Strings" },
];

export type MusicSnapshot = {
  index: number;
  /** The user wants music on (it may still be waiting for a gesture to start). */
  on: boolean;
  /** Audio is actually coming out. */
  playing: boolean;
  volume: number;
  time: number;
  duration: number;
};

const FADE_IN = 0.6;
const FADE_OUT = 0.35;

class MusicPlayer {
  private el: HTMLAudioElement;
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private listeners = new Set<() => void>();
  private pauseTimer = 0;
  private failures = 0;
  private state: MusicSnapshot = { index: 0, on: false, playing: false, volume: 0.6, time: 0, duration: 0 };

  constructor() {
    const el = (this.el = new Audio());
    el.preload = "none";
    el.src = TRACKS[0].src;
    el.addEventListener("ended", () => this.select(this.state.index + 1));
    el.addEventListener("playing", () => {
      this.failures = 0;
      this.set({ playing: true });
    });
    el.addEventListener("pause", () => this.set({ playing: false }));
    el.addEventListener("timeupdate", () => this.set({ time: el.currentTime }));
    el.addEventListener("loadedmetadata", () => this.set({ duration: el.duration || 0 }));
    // A missing or undecodable file shouldn't stall the playlist.
    el.addEventListener("error", () => {
      if (!this.state.on) return;
      if (++this.failures >= TRACKS.length) return this.set({ on: false, playing: false });
      window.setTimeout(() => this.select(this.state.index + 1), 800);
    });
  }

  // ── subscription (for useSyncExternalStore) ──
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.state;
  private set(patch: Partial<MusicSnapshot>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  /** Build the Web Audio graph lazily, inside a user gesture. */
  private graph() {
    if (this.ctx) return;
    try {
      const ctx = new AudioContext();
      this.gain = new GainNode(ctx, { gain: 0 });
      new MediaElementAudioSourceNode(ctx, { mediaElement: this.el }).connect(this.gain).connect(ctx.destination);
      this.ctx = ctx;
    } catch {
      // No Web Audio: fall back to the element's own volume.
      this.ctx = null;
      this.gain = null;
    }
  }

  private ramp(to: number, seconds: number) {
    if (this.ctx && this.gain) {
      const t = this.ctx.currentTime;
      this.gain.gain.cancelScheduledValues(t);
      this.gain.gain.setValueAtTime(this.gain.gain.value, t);
      // Perceived loudness is closer to the square of the slider position.
      this.gain.gain.linearRampToValueAtTime(to * to, t + seconds);
    } else {
      this.el.volume = to * to;
    }
  }

  /** Start playing. Resolves false if the browser is still blocking autoplay. */
  async play(): Promise<boolean> {
    window.clearTimeout(this.pauseTimer);
    this.set({ on: true });
    this.graph();
    if (this.ctx?.state === "suspended") void this.ctx.resume();
    if (this.el.preload === "none") this.el.preload = "auto";
    try {
      await this.el.play();
    } catch {
      return false;
    }
    if (!this.state.on) {
      // Paused again while play() was pending.
      this.el.pause();
      return true;
    }
    this.ramp(this.state.volume, FADE_IN);
    return true;
  }

  /** Fade out, then pause. `remember: false` keeps `on` so a later resume() picks it back up. */
  pause(remember = true) {
    if (remember) this.set({ on: false });
    this.ramp(0, FADE_OUT);
    window.clearTimeout(this.pauseTimer);
    this.pauseTimer = window.setTimeout(() => this.el.pause(), FADE_OUT * 1000 + 30);
  }

  select(i: number) {
    const index = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    window.clearTimeout(this.pauseTimer);
    this.el.src = TRACKS[index].src;
    this.set({ index, time: 0, duration: 0 });
    if (this.state.on) {
      this.ramp(0, 0.01);
      void this.play();
    }
  }

  /** Set the initial track without loading or playing it. */
  cue(i: number) {
    if (i === this.state.index || !TRACKS[i]) return;
    this.el.src = TRACKS[i].src;
    this.set({ index: i, time: 0, duration: 0 });
  }

  setVolume(v: number) {
    const volume = Math.max(0, Math.min(1, v));
    this.set({ volume });
    if (!this.el.paused) this.ramp(volume, 0.08);
  }

  seek(fraction: number) {
    if (this.state.duration > 0) this.el.currentTime = fraction * this.state.duration;
  }
}

let shared: MusicPlayer | null = null;

/** The one music player for the page (client only). */
export function getMusic() {
  if (!shared) shared = new MusicPlayer();
  return shared;
}
