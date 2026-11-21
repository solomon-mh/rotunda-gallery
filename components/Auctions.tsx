"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getArtwork } from "@/lib/artworks";
import { formatPrice } from "@/lib/pricing";
import { useStore } from "@/lib/store";

const LOTS = [
  { slug: "starry-night", spec: "A0 Hahnemühle · Black oak frame", start: 1200, endsInH: 5.2 },
  { slug: "the-great-wave", spec: "A0 Washi-tone Giclée · Unframed", start: 900, endsInH: 9.6 },
  { slug: "girl-with-a-pearl-earring", spec: "A1 Hahnemühle · Museum walnut frame", start: 850, endsInH: 22.4 },
  { slug: "the-kiss", spec: "A0 Gold-leaf hand-finished · Framed canvas", start: 1800, endsInH: 31 },
  { slug: "mona-lisa", spec: "A1 Hahnemühle · Natural oak frame", start: 1100, endsInH: 47.5 },
  { slug: "the-scream", spec: "A1 Giclée · White frame", start: 700, endsInH: 70 },
];

type Bid = { amount: number; by: string; at: number };
const KEY = "rotunda-auctions";
const SEED_NAMES = ["M. Okafor", "L. Ferreira", "J. Tanaka", "A. Haddad", "S. Lindqvist", "C. Moreau"];

function initialState() {
  const anchor = Date.now();
  return Object.fromEntries(
    LOTS.map((l, i) => {
      const n = 2 + (i % 4);
      const bids: Bid[] = Array.from({ length: n }, (_, k) => ({
        amount: l.start + k * Math.round(l.start * 0.08),
        by: SEED_NAMES[(i + k) % SEED_NAMES.length],
        at: anchor - (n - k) * 3_600_000,
      })).reverse();
      return [l.slug, { ends: anchor + l.endsInH * 3_600_000, bids }];
    }),
  ) as Record<string, { ends: number; bids: Bid[] }>;
}

export default function Auctions() {
  const currency = useStore((s) => s.currency);
  const [state, setState] = useState<Record<string, { ends: number; bids: Bid[] }> | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let s: Record<string, { ends: number; bids: Bid[] }> | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) s = JSON.parse(raw);
    } catch {}
    if (!s || LOTS.some((l) => !s![l.slug]) || Object.values(s).every((x) => x.ends < Date.now())) s = initialState();
    setState(s);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  if (!state) return <div className="lots lots--loading" />;

  return (
    <>
      <div className="lots">
        {LOTS.map((l) => {
          const art = getArtwork(l.slug)!;
          const lot = state[l.slug];
          const high = lot.bids[0].amount;
          const step = Math.max(25, Math.round(high * 0.05 / 25) * 25);
          const ended = lot.ends <= now;
          return (
            <article key={l.slug} className="lot">
              <Link href={`/artwork/${art.slug}`} className="lot__img">
                <Image src={art.image} alt={art.title} width={art.width} height={art.height} sizes="(max-width: 700px) 90vw, 30vw" />
              </Link>
              <div className="lot__body">
                <p className="mono-xxs muted">Artist&rsquo;s proof · 1 of 1</p>
                <h2 className="display lot__title">{art.title}</h2>
                <p className="serif muted">
                  {art.artist} · {l.spec}
                </p>
                <div className="lot__nums">
                  <div>
                    <span className="mono-xxs muted">{ended ? "Sold for" : "Current bid"}</span>
                    <span className="display lot__price">{formatPrice(high, currency)}</span>
                  </div>
                  <div>
                    <span className="mono-xxs muted">{ended ? "Closed" : "Closes in"}</span>
                    <span className="display lot__time">{ended ? "—" : countdown(lot.ends - now)}</span>
                  </div>
                </div>
                <BidForm
                  disabled={ended}
                  min={high + step}
                  currency={currency}
                  onBid={(amount) =>
                    setState((s) => ({
                      ...s!,
                      [l.slug]: { ...s![l.slug], bids: [{ amount, by: "You", at: Date.now() }, ...s![l.slug].bids] },
                    }))
                  }
                />
                <ol className="lot__history mono-xxs">
                  {lot.bids.slice(0, 3).map((b, k) => (
                    <li key={k} className={b.by === "You" ? "is-you" : undefined}>
                      <span>{b.by}</span>
                      <span>{formatPrice(b.amount, currency)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          );
        })}
      </div>
      <p className="fineprint muted center">Demo auction — bids are stored only in this browser.</p>
    </>
  );
}

function BidForm({ min, onBid, disabled, currency }: { min: number; onBid: (n: number) => void; disabled: boolean; currency: Parameters<typeof formatPrice>[1] }) {
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <form
      className="bid"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Math.round(Number(value || min));
        if (!Number.isFinite(n) || n < min) {
          setMsg(`Minimum bid is ${formatPrice(min, "USD")}`);
          return;
        }
        onBid(n);
        setValue("");
        setMsg("You’re the highest bidder.");
      }}
    >
      <div className="bid__row">
        <span className="bid__cur mono-xxs">USD</span>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          step={1}
          placeholder={String(min)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          aria-label="Bid amount in US dollars"
        />
        <button className="btn btn--black" disabled={disabled}>
          Place bid
        </button>
      </div>
      <p className="mono-xxs muted" aria-live="polite">
        {msg || (currency !== "USD" ? `≈ ${formatPrice(min, currency)} minimum` : `Minimum ${formatPrice(min, "USD")}`)}
      </p>
    </form>
  );
}

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
