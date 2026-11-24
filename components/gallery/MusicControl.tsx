"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useStore } from "@/lib/store";
import { MusicIcon, PauseIcon, PlayIcon, SkipBack, SkipForward, SoundIcon } from "../icons";
import { TRACKS, getMusic, type MusicSnapshot } from "./music";

const SERVER: MusicSnapshot = { index: 0, on: false, playing: false, volume: 0.6, time: 0, duration: 0 };
const noop = () => () => {};

const clock = (s: number) => {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/**
 * Music button for the walk controls. Opens a small player with track info,
 * play / pause, previous / next, a seek bar and a volume slider.
 */
export default function MusicControl({ hidden }: { hidden: boolean }) {
  const settings = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const lastVolume = useRef(settings.musicVolume || 0.6);

  const player = typeof window === "undefined" ? null : getMusic();
  const m = useSyncExternalStore(player?.subscribe ?? noop, player?.getSnapshot ?? (() => SERVER), () => SERVER);
  const track = TRACKS[m.index];

  // Restore the saved track and volume; resume if music was left on. Browsers only
  // allow audio after a user gesture, so a blocked start retries on the first click or key.
  useEffect(() => {
    const p = getMusic();
    p.cue(Math.min(settings.musicTrack, TRACKS.length - 1));
    p.setVolume(settings.musicVolume);
    let cancelled = false;
    const wake = () => {
      if (!cancelled && useStore.getState().settings.music) void p.play();
    };
    if (settings.music) {
      void p.play().then((ok) => {
        if (ok || cancelled) return;
        window.addEventListener("pointerdown", wake, { once: true });
        window.addEventListener("keydown", wake, { once: true });
      });
    }
    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      // Leaving the gallery: fade out; the saved setting brings it back next visit.
      p.pause(false);
    };
    // Only on mount — later changes go through the handlers below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the saved track in step when the playlist advances on its own.
  useEffect(() => {
    if (useStore.getState().settings.musicTrack !== m.index) setSetting("musicTrack", m.index);
  }, [m.index, setSetting]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  const togglePlay = () => {
    const p = getMusic();
    if (m.on) {
      p.pause();
      setSetting("music", false);
    } else {
      void p.play(); // inside the click, so the browser allows it
      setSetting("music", true);
    }
  };
  const skip = (d: number) => getMusic().select(m.index + d);
  const setVolume = (v: number) => {
    getMusic().setVolume(v);
    setSetting("musicVolume", v);
    if (v > 0) lastVolume.current = v;
  };
  const toggleMute = () => setVolume(m.volume > 0 ? 0 : lastVolume.current || 0.6);

  const progress = m.duration > 0 ? Math.min(1, m.time / m.duration) : 0;
  const muted = m.volume === 0;

  return (
    <div className="music" ref={root}>
      <button
        className={`circle-btn music__btn${m.on ? " is-on" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={m.on ? `Music: ${track.title}. Open player` : "Music player"}
        title="Music"
      >
        {m.playing ? (
          <span className="eq" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : (
          <MusicIcon size={15} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            className="music-panel"
            role="dialog"
            aria-label="Music player"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="music-panel__head">
              <p className="mono-xxs muted">{m.playing ? "Now playing" : "Music"}</p>
              <p className="mono-xxs muted">
                {String(m.index + 1).padStart(2, "0")} / {String(TRACKS.length).padStart(2, "0")}
              </p>
            </div>

            <p className="music-panel__title">{track.title}</p>
            <p className="mono-xxs muted music-panel__by">
              {track.composer} · {track.performer}
            </p>

            <input
              type="range"
              className="music-range music-panel__seek"
              min={0}
              max={1000}
              value={Math.round(progress * 1000)}
              onChange={(e) => getMusic().seek(Number(e.target.value) / 1000)}
              disabled={m.duration <= 0}
              aria-label="Seek"
              aria-valuetext={`${clock(m.time)} of ${clock(m.duration)}`}
              style={{ "--fill": `${progress * 100}%` } as React.CSSProperties}
            />
            <div className="music-panel__times mono-xxs muted">
              <span>{clock(m.time)}</span>
              <span>{clock(m.duration)}</span>
            </div>

            <div className="music-panel__row">
              <div className="music-panel__transport">
                <button className="music-panel__skip" onClick={() => skip(-1)} aria-label="Previous track">
                  <SkipBack size={14} />
                </button>
                <button className="circle-btn is-on music-panel__play" onClick={togglePlay} aria-label={m.on ? "Pause music" : "Play music"}>
                  {m.on ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
                </button>
                <button className="music-panel__skip" onClick={() => skip(1)} aria-label="Next track">
                  <SkipForward size={14} />
                </button>
              </div>

              <div className="music-panel__volume">
                <button className="music-panel__skip" onClick={toggleMute} aria-label={muted ? "Unmute music" : "Mute music"} aria-pressed={muted}>
                  <SoundIcon size={15} muted={muted} />
                </button>
                <input
                  type="range"
                  className="music-range"
                  min={0}
                  max={100}
                  value={Math.round(m.volume * 100)}
                  onChange={(e) => setVolume(Number(e.target.value) / 100)}
                  aria-label="Music volume"
                  aria-valuetext={`${Math.round(m.volume * 100)}%`}
                  style={{ "--fill": `${m.volume * 100}%` } as React.CSSProperties}
                />
              </div>
            </div>

            <ul className="music-panel__list" aria-label="Playlist">
              {TRACKS.map((t, i) => (
                <li key={t.src}>
                  <button
                    className={i === m.index ? "is-on" : ""}
                    aria-current={i === m.index ? "true" : undefined}
                    onClick={() => {
                      getMusic().select(i);
                      if (!m.on) {
                        void getMusic().play();
                        setSetting("music", true);
                      }
                    }}
                  >
                    <span className="music-panel__n mono-xxs">{String(i + 1).padStart(2, "0")}</span>
                    <span className="music-panel__t">{t.title}</span>
                    <span className="mono-xxs muted">{t.composer.split(" ").pop()}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mono-xxs muted music-panel__note">Public-domain recordings</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
