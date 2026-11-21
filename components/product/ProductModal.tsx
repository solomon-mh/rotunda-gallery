"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { getArtwork } from "@/lib/artworks";
import ProductView from "./ProductView";
import { ArrowLeft } from "../icons";

const EASE = "cubic-bezier(0.65, 0, 0.25, 1)";
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * The product page shown over the rotunda. When opened from the 3D gallery it starts
 * as an exact overlay of the painting on screen, then the wall fades to white and the
 * painting glides into its place on the page — the hand-off from the video.
 */
export default function ProductModal({ slug }: { slug: string }) {
  return <ModalInner key={slug} slug={slug} />;
}

function ModalInner({ slug }: { slug: string }) {
  const router = useRouter();
  const art = getArtwork(slug)!;
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const belowRef = useRef<HTMLElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  // Read the gallery hand-off once, at mount.
  const [handoff] = useState(() => {
    const t = useStore.getState().transition;
    return t && t.slug === slug && Date.now() - t.at < 5000 ? t.rect : null;
  });

  useLayoutEffect(() => {
    const root = rootRef.current!;
    root.scrollTop = 0;
    const media = mediaRef.current!;
    const fadeUp = (el: Element | null, delay: number) =>
      el?.animate(
        [
          { opacity: 0, transform: "translateY(16px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 650, delay, easing: EASE_OUT, fill: "both" },
      );

    if (handoff) {
      useStore.getState().setTransition(null);
      const end = media.getBoundingClientRect();
      const dx = handoff.x - end.left;
      const dy = handoff.y - end.top;
      const sx = handoff.w / end.width;
      const sy = handoff.h / end.height;
      bgRef.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: "ease-out", fill: "both" });
      media.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, boxShadow: "none" },
          { transform: "none" },
        ],
        { duration: 900, delay: 380, easing: EASE, fill: "both" },
      );
      media.nextElementSibling?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 1050, fill: "both" });
      fadeUp(detailsRef.current, 860);
      fadeUp(belowRef.current, 1000);
      fadeUp(backRef.current, 900);
    } else {
      bgRef.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out", fill: "both" });
      fadeUp(media.parentElement, 80);
      fadeUp(detailsRef.current, 180);
      fadeUp(belowRef.current, 260);
      fadeUp(backRef.current, 180);
    }
  }, [handoff]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.title = `${art.title} — ${art.artist} — Rotunda`;
    return () => {
      document.body.style.overflow = prev;
    };
  }, [art]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const root = rootRef.current;
    const media = mediaRef.current;
    const canReverse = handoff && root && media && root.scrollTop < 40;
    if (!canReverse) {
      bgRef.current?.parentElement?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" }).finished.then(() => router.back());
      return;
    }
    const end = media.getBoundingClientRect();
    const dx = handoff.x - end.left;
    const dy = handoff.y - end.top;
    for (const el of [detailsRef.current, belowRef.current, backRef.current, media.nextElementSibling]) {
      el?.getAnimations().forEach((a) => a.cancel());
      el?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" });
    }
    media.getAnimations().forEach((a) => a.cancel());
    media
      .animate(
        [{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(${handoff.w / end.width}, ${handoff.h / end.height})`, boxShadow: "none" }],
        { duration: 700, delay: 120, easing: EASE, fill: "forwards" },
      )
      .finished.then(() => {
        bgRef.current?.getAnimations().forEach((a) => a.cancel());
        return bgRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, fill: "forwards" }).finished;
      })
      .then(() => router.back());
  }, [handoff, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const s = useStore.getState();
      if (s.cartOpen || s.searchOpen || document.querySelector(".room-root")) return;
      close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="product-modal" ref={rootRef} role="dialog" aria-modal="true" aria-label={`${art.title} by ${art.artist}`}>
      <div className="product-modal__bg" ref={bgRef} />
      <button className="modal-back mono-xxs" onClick={close} ref={backRef}>
        <ArrowLeft size={13} /> Back to gallery
      </button>
      <div className="product-modal__content">
        <ProductView slug={slug} mediaRef={mediaRef} detailsRef={detailsRef} belowRef={belowRef} />
      </div>
    </div>
  );
}
