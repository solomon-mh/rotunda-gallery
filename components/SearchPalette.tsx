"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useStore } from "@/lib/store";
import { artworks, collections, getCollection } from "@/lib/artworks";
import { SearchIcon } from "./icons";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

type Result = { kind: "art" | "collection"; slug: string; title: string; sub: string; image?: string; w?: number; h?: number };

export default function SearchPalette() {
  const open = useStore((s) => s.searchOpen);
  const setOpen = useStore((s) => s.setSearchOpen);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<Result[]>(() => {
    const query = norm(q.trim());
    const cols: Result[] = collections
      .filter((c) => !query || norm(c.name + " " + c.era).includes(query))
      .map((c) => ({ kind: "collection", slug: c.slug, title: c.name, sub: c.era }));
    const arts: Result[] = artworks
      .filter((a) => !query || norm([a.title, a.artist, a.year, a.location, getCollection(a.collection)?.name].join(" ")).includes(query))
      .map((a) => ({ kind: "art", slug: a.slug, title: a.title, sub: `${a.artist}, ${a.year}`, image: a.image, w: a.width, h: a.height }));
    return query ? [...arts, ...cols].slice(0, 12) : [...arts.slice(0, 8), ...cols.slice(0, 3)];
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActive(0), [q]);

  const go = (r: Result) => {
    setOpen(false);
    router.push(r.kind === "art" ? `/artwork/${r.slug}` : `/collections/${r.slug}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    }
    if (e.key === "Enter" && results[active]) go(results[active]);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="palette-root" onKeyDown={onKeyDown}>
          <motion.div
            className="drawer-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="palette__input">
              <SearchIcon size={16} />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search works, artists, collections…"
                aria-label="Search"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-results"
                aria-activedescendant={results[active] ? `res-${active}` : undefined}
              />
              <kbd>Esc</kbd>
            </div>
            <ul className="palette__results" id="palette-results" role="listbox">
              {results.length === 0 && <li className="palette__empty muted">Nothing on the walls matches “{q}”.</li>}
              {results.map((r, i) => (
                <li
                  key={r.kind + r.slug}
                  id={`res-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? "is-active" : undefined}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                >
                  <span className="palette__thumb">
                    {r.image ? (
                      <Image src={r.image} alt="" width={r.w!} height={r.h!} sizes="44px" />
                    ) : (
                      <span className="palette__thumb-col display">{r.title.slice(0, 2)}</span>
                    )}
                  </span>
                  <span className="palette__text">
                    <span className="serif">{r.title}</span>
                    <span className="mono-xs muted">{r.sub}</span>
                  </span>
                  <span className="mono-xs muted">{r.kind === "art" ? "Work" : "Collection"}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
