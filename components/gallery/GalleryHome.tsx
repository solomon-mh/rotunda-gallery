"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useStore } from "@/lib/store";
import { useResolvedTheme } from "@/lib/theme";
import { buildSlots, scrollFor } from "./layout";
import type { SceneHandle } from "./RotundaScene";
import ListView from "./ListView";
import { ArrowLeft, ArrowRight, SoundIcon } from "../icons";
import { getGalleryAudio, peekGalleryAudio } from "./ambience";
import MusicControl from "./MusicControl";

const RotundaScene = dynamic(() => import("./RotundaScene"), { ssr: false });

export default function GalleryHome() {
  const router = useRouter();
  const pathname = usePathname();
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const settings = useStore((s) => s.settings);
  const theme = useResolvedTheme();
  const setTransition = useStore((s) => s.setTransition);
  const setGalleryScroll = useStore((s) => s.setGalleryScroll);
  const setSetting = useStore((s) => s.setSetting);
  const { slots, period } = useMemo(() => buildSlots(), []);
  // First visit: start with the Mona Lisa in front of you; afterwards resume where you left off.
  const [initialScroll] = useState(() => useStore.getState().galleryScroll || scrollFor(slots[1]));
  const scene = useRef<SceneHandle>(null);
  const pill = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(1);
  const [hover, setHover] = useState<"art" | "placard" | null>(null);
  const [progress, setProgress] = useState({ loaded: 0, total: 1 });
  const [ready, setReady] = useState(false);
  const focusedRef = useRef(false);

  const modalOpen = pathname.startsWith("/artwork/");
  const paused = modalOpen || view === "list";

  // Coming back from a product page: fly the camera back out to the walk.
  useEffect(() => {
    if (!modalOpen && focusedRef.current) {
      focusedRef.current = false;
      scene.current?.unfocus();
    }
  }, [modalOpen]);

  useEffect(() => {
    if (progress.loaded >= progress.total && progress.total > 1) {
      const t = setTimeout(() => setReady(true), 250);
      return () => clearTimeout(t);
    }
  }, [progress]);

  useEffect(() => {
    // Never keep visitors waiting on a slow network: reveal after a few seconds regardless.
    const t = setTimeout(() => setReady(true), 6000);
    return () => clearTimeout(t);
  }, []);

  // Ambient sound. Browsers only let audio start from a user gesture, so a saved
  // "sound on" waits for the first click or key press on the page.
  const soundOn = settings.sound && settings.showVisitors;
  useEffect(() => {
    if (!soundOn) {
      peekGalleryAudio()?.setEnabled(false);
      return;
    }
    const audio = getGalleryAudio();
    audio.setEnabled(true);
    if (audio.ctx.state === "running") return;
    const wake = () => audio.setEnabled(true);
    window.addEventListener("pointerdown", wake, { once: true });
    window.addEventListener("keydown", wake, { once: true });
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [soundOn]);
  useEffect(() => {
    peekGalleryAudio()?.setPaused(paused);
  }, [paused]);
  useEffect(() => () => peekGalleryAudio()?.setPaused(true), []);
  const toggleSound = () => {
    const next = !soundOn;
    if (next) getGalleryAudio().setEnabled(true); // inside the click, so the browser allows it
    if (next && !settings.showVisitors) setSetting("showVisitors", true);
    setSetting("sound", next);
  };

  // The "View" pill follows the cursor without re-rendering.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (pill.current) pill.current.style.transform = `translate3d(${e.clientX + 16}px, ${e.clientY + 14}px, 0)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const onFocused = useCallback(
    (slug: string, rect: { x: number; y: number; w: number; h: number }) => {
      focusedRef.current = true;
      setTransition({ slug, rect, at: Date.now() });
      router.push(`/artwork/${slug}`, { scroll: false });
    },
    [router, setTransition],
  );

  const slot = slots[current];
  const collection = slot.collection;
  const artNumber = slot.kind === "art" ? slot.index + 1 : null;
  const totalArt = slots.filter((s) => s.kind === "art").length;

  return (
    <main className={`gallery-home${view === "list" ? " is-list" : ""}`}>
      <div className="view-toggle" role="tablist" aria-label="View">
        <button role="tab" aria-selected={view === "gallery"} className={view === "gallery" ? "is-on" : ""} onClick={() => setView("gallery")}>
          Gallery
        </button>
        <button role="tab" aria-selected={view === "list"} className={view === "list" ? "is-on" : ""} onClick={() => setView("list")}>
          List
        </button>
      </div>

      <section className="rotunda" aria-label="3D gallery" hidden={view === "list"}>
        <RotundaScene
          ref={scene}
          slots={slots}
          period={period}
          paused={paused}
          initialScroll={initialScroll}
          autoWalk={settings.autoWalk}
          showLabels={settings.showLabels}
          showVisitors={settings.showVisitors}
          sound={soundOn}
          highQuality={settings.highQuality}
          dark={theme === "dark"}
          onCurrent={setCurrent}
          onHover={setHover}
          onFocused={onFocused}
          onPlacard={(slug) => router.push(`/collections/${slug}`)}
          onProgress={(loaded, total) => setProgress({ loaded, total })}
          onScrollChange={setGalleryScroll}
        />

        <div className={`walk-caption${modalOpen ? " is-hidden" : ""}`}>
          <p className="mono-xxs muted">You are walking past</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={collection.slug}
              className="display walk-caption__title"
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {collection.name}
            </motion.h1>
          </AnimatePresence>
          <Link href={`/collections/${collection.slug}`} className="mono-xxs walk-caption__link">
            Enter the collection →
          </Link>
        </div>

        <div className={`walk-meta${modalOpen ? " is-hidden" : ""}`}>
          <p className="mono-xxs muted">
            {artNumber ? String(artNumber).padStart(2, "0") : "—"} / {totalArt}
          </p>
          <p className="mono-xxs muted hide-sm">Scroll or drag to walk · Click a work to view</p>
        </div>

        <div className={`walk-controls${modalOpen ? " is-hidden" : ""}`}>
          <MusicControl hidden={modalOpen} />
          <button
            className={`circle-btn${soundOn ? " is-on" : ""}`}
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute gallery sound" : "Play gallery sound"}
            title={soundOn ? "Mute the room" : "Hear the room"}
          >
            <SoundIcon size={15} muted={!soundOn} />
          </button>
          <button className="circle-btn" onClick={() => scene.current?.prev()} aria-label="Previous work">
            <ArrowLeft size={13} />
          </button>
          <button className="circle-btn" onClick={() => scene.current?.next()} aria-label="Next work">
            <ArrowRight size={13} />
          </button>
        </div>

        <div ref={pill} className={`cursor-pill${hover && !modalOpen ? " is-on" : ""}`} aria-hidden="true">
          {hover === "placard" ? "Enter" : "View"}
        </div>

        <AnimatePresence>
          {!ready && (
            <motion.div className="loader" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
              <p className="mono-xxs muted">Hanging the works</p>
              <div className="loader__bar">
                <span style={{ transform: `scaleX(${progress.loaded / Math.max(1, progress.total)})` }} />
              </div>
              <p className="mono-xxs muted">
                {progress.loaded} / {progress.total}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {view === "list" && <ListView />}
    </main>
  );
}
