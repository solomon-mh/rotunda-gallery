"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getArtwork, getCollection, worksIn } from "@/lib/artworks";
import {
  DEFAULT_OPTIONS,
  EDITIONS,
  FRAME_COLORS,
  FRAMES,
  PAPERS,
  SIZES,
  formatPrice,
  unitPrice,
  type FrameColorId,
  type PrintOptions,
} from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { BookmarkIcon, MinusIcon, PlusIcon, RoomIcon } from "../icons";
import Accordion from "./Accordion";
import ViewInRoom from "./ViewInRoom";
import ArtCard from "../ArtCard";
import { frameStyle } from "./frameStyle";

type Props = {
  slug: string;
  mediaRef?: React.Ref<HTMLDivElement>;
  detailsRef?: React.Ref<HTMLDivElement>;
  belowRef?: React.Ref<HTMLElement>;
};

export default function ProductView({ slug, mediaRef, detailsRef, belowRef }: Props) {
  const art = getArtwork(slug)!;
  const collection = getCollection(art.collection)!;
  const currency = useStore((s) => s.currency);
  const saved = useStore((s) => s.saved.includes(slug));
  const toggleSaved = useStore((s) => s.toggleSaved);
  const addItem = useStore((s) => s.addItem);
  const setCartOpen = useStore((s) => s.setCartOpen);

  const [o, setO] = useState<PrintOptions>(DEFAULT_OPTIONS);
  const [qty, setQty] = useState(1);
  const [readMore, setReadMore] = useState(false);
  const [room, setRoom] = useState(false);
  const [added, setAdded] = useState(false);

  const price = unitPrice(art, o);
  const aspect = art.width / art.height;
  const siblings = useMemo(() => worksIn(art.collection).filter((a) => a.slug !== art.slug), [art]);
  const position = worksIn(art.collection).findIndex((a) => a.slug === art.slug) + 1;
  const set = <K extends keyof PrintOptions>(k: K, v: PrintOptions[K]) => setO((prev) => ({ ...prev, [k]: v }));

  const add = () => {
    addItem({ slug: art.slug, options: o, qty, unitPrice: price });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    setTimeout(() => setCartOpen(true), 180);
  };

  return (
    <div className="pv">
      <div className="pv__top">
        <div className="pv__media-col">
          <div className="pv__media-wrap" style={{ width: `min(100%, calc(var(--pv-media-h) * ${aspect.toFixed(4)}))` }}>
          <div
            ref={mediaRef}
            className="pv__media"
            style={{
              aspectRatio: `${art.width} / ${art.height}`,
              width: "100%",
              backgroundImage: `url(${art.texture})`,
              ...frameStyle(o),
            }}
          >
            <Image
              src={art.image}
              alt={`${art.title} by ${art.artist}, ${art.year}`}
              fill
              priority
              quality={85}
              sizes="(max-width: 900px) 92vw, 46vw"
            />
          </div>
          <div className="pv__media-bar">
            <span className="mono-xxs muted">1/1</span>
            <button className="room-btn" onClick={() => setRoom(true)}>
              <RoomIcon size={18} />
              <span className="serif">View In Room</span>
            </button>
            <button
              className={`icon-btn${saved ? " is-on" : ""}`}
              onClick={() => toggleSaved(art.slug)}
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved" : "Save this work"}
            >
              <BookmarkIcon size={15} filled={saved} />
            </button>
          </div>
          </div>
        </div>

        <div className="pv__details" ref={detailsRef}>
          <p className="mono-xxs muted pv__crumbs">
            <Link href={`/collections/${collection.slug}`} className="underline-link">
              {collection.name}
            </Link>{" "}
            · No. {String(position).padStart(2, "0")} of {worksIn(art.collection).length}
          </p>
          <h1 className="display pv__title">{art.title}</h1>
          <h2 className="display pv__artist">{art.artist}</h2>

          <div className={`pv__desc serif${readMore ? " is-open" : ""}`}>
            <p>{art.description}</p>
            <p>
              Reproduced from a high-resolution, public-domain museum capture of the original — {art.medium.toLowerCase()},{" "}
              {art.year} — now in the {art.location}. Colour-matched by hand and printed to order in our studio.
            </p>
          </div>
          <button className="serif read-more" onClick={() => setReadMore((v) => !v)} aria-expanded={readMore}>
            {readMore ? "Read less −" : "Read more +"}
          </button>

          <p className="display pv__price" aria-live="polite">
            {formatPrice(price, currency)}
          </p>
          <p className="pv__edition serif">
            <span className="dot" aria-hidden="true" /> Limited Edition of {art.edition}
          </p>
          <p className="fineprint muted">
            Shop prices exclude tax. Applicable tax is calculated from your delivery address and added at checkout.
          </p>

          <OptionGroup label="Paper" value={PAPERS.find((p) => p.id === o.paper)!.label}>
            {PAPERS.map((p) => (
              <Choice key={p.id} on={o.paper === p.id} onClick={() => set("paper", p.id)}>
                {p.label}
              </Choice>
            ))}
          </OptionGroup>

          <OptionGroup label="Size" value={SIZES.find((s) => s.id === o.size)!.short}>
            {SIZES.map((s) => (
              <Choice key={s.id} on={o.size === s.id} onClick={() => set("size", s.id)}>
                {s.label}
              </Choice>
            ))}
          </OptionGroup>

          <OptionGroup label="Edition" value={EDITIONS.find((e) => e.id === o.edition)!.label}>
            {EDITIONS.map((e) => (
              <Choice key={e.id} on={o.edition === e.id} onClick={() => set("edition", e.id)}>
                {e.label}
              </Choice>
            ))}
          </OptionGroup>

          <OptionGroup label="Frame" value={FRAMES.find((f) => f.id === o.frame)!.label}>
            <div className="frame-choices">
              {FRAMES.map((f) => (
                <button
                  key={f.id}
                  className={`frame-choice${o.frame === f.id ? " is-on" : ""}`}
                  onClick={() => set("frame", f.id)}
                  aria-pressed={o.frame === f.id}
                >
                  <span className="frame-choice__img">
                    <span
                      style={{
                        backgroundImage: `url(${art.texture})`,
                        aspectRatio: `${art.width} / ${art.height}`,
                        ...frameStyle({ ...o, frame: f.id }, 0.28),
                      }}
                    />
                  </span>
                  <span className="mono-xxs">{f.label}</span>
                </button>
              ))}
            </div>
          </OptionGroup>

          {o.frame !== "unframed" && (
            <OptionGroup label="Frame colour" value={FRAME_COLORS.find((c) => c.id === o.frameColor)!.label}>
              {FRAME_COLORS.map((c) => (
                <button
                  key={c.id}
                  className={`swatch${o.frameColor === c.id ? " is-on" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => set("frameColor", c.id as FrameColorId)}
                  aria-label={c.label}
                  aria-pressed={o.frameColor === c.id}
                />
              ))}
            </OptionGroup>
          )}

          <div className="pv__buy">
            <div className="stepper">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                <MinusIcon size={12} />
              </button>
              <span aria-live="polite">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase quantity">
                <PlusIcon size={12} />
              </button>
            </div>
            <button className="btn btn--black pv__add" onClick={add}>
              {added ? "Added ✓" : "Add to bag"}
            </button>
          </div>

          <div className="pv__accordions">
            <Accordion title="Paper & Sizes">
              {PAPERS.map((p) => (
                <p key={p.id}>
                  <strong>{p.label}.</strong> {p.note}
                </p>
              ))}
              <table className="size-table">
                <tbody>
                  {SIZES.map((s) => (
                    <tr key={s.id}>
                      <td className="mono-xxs">{s.id.toUpperCase()}</td>
                      <td>{s.short}</td>
                      <td className="muted">
                        {s.cm[0]} × {s.cm[1]} cm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="muted">The image is printed to its true proportions, centred with an even white border.</p>
            </Accordion>
            <Accordion title="Delivery Info">
              <p>Every print is made to order and leaves our studio within 3–5 working days. Framed works take 7–10 days.</p>
              <p>Unframed prints ship rolled in a rigid tube; framed works ship in custom crates with corner protection. Free tracked delivery on orders over $150.</p>
            </Accordion>
            <Accordion title="Returns Policy">
              <p>If your print arrives damaged or isn’t what you expected, tell us within 30 days and we’ll reprint or refund it — no questions asked.</p>
              <p>Numbered editions come with a signed certificate of authenticity and can be returned unopened.</p>
            </Accordion>
          </div>

          <dl className="pv__facts">
            <div>
              <dt className="mono-xxs muted">Artist</dt>
              <dd className="serif">
                {art.artist} <span className="muted">({art.artistLife})</span>
              </dd>
            </div>
            <div>
              <dt className="mono-xxs muted">Date</dt>
              <dd className="serif">{art.year}</dd>
            </div>
            <div>
              <dt className="mono-xxs muted">Original</dt>
              <dd className="serif">{art.medium}</dd>
            </div>
            <div>
              <dt className="mono-xxs muted">Where</dt>
              <dd className="serif">{art.location}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="pv__collection" ref={belowRef}>
        <div className="pv__collection-head">
          <h2 className="display">Get the collection</h2>
          <p className="serif muted">
            {siblings.length} more from <em>{collection.name}</em> — {collection.era}.
          </p>
          <Link href={`/collections/${collection.slug}`} className="mono-xxs underline-link">
            Enter the collection →
          </Link>
        </div>
        <div className="grid-cards">
          {siblings.map((a) => (
            <ArtCard key={a.slug} art={a} />
          ))}
        </div>
      </section>

      {room && (
        <ViewInRoom
          art={art}
          options={o}
          price={price}
          onOptions={(patch) => setO((prev) => ({ ...prev, ...patch }))}
          onAdd={() => {
            setRoom(false);
            add();
          }}
          onClose={() => setRoom(false)}
        />
      )}
    </div>
  );
}

function OptionGroup({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="opt">
      <p className="opt__label">
        <span className="mono-xxs">{label}:</span> <span className="serif muted">{value}</span>
      </p>
      <div className="opt__choices">{children}</div>
    </div>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={`choice mono-xxs${on ? " is-on" : ""}`} onClick={onClick} aria-pressed={on}>
      {children}
    </button>
  );
}
