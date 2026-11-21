import type { Artwork } from "./artworks";

export type PaperId = "budget" | "giclee" | "hahnemuhle";
export type SizeId = "a3" | "a2" | "a1" | "a0";
export type EditionId = "open" | "numbered";
export type FrameId = "unframed" | "classic" | "canvas";
export type FrameColorId = "black" | "oak" | "white";

export type PrintOptions = {
  paper: PaperId;
  size: SizeId;
  edition: EditionId;
  frame: FrameId;
  frameColor: FrameColorId;
};

export const PAPERS: { id: PaperId; label: string; mult: number; note: string }[] = [
  { id: "budget", label: "Budget Art Paper", mult: 1, note: "170gsm matte poster stock. Bright, smooth and affordable." },
  { id: "giclee", label: "Giclée Fine Art Paper", mult: 1.35, note: "230gsm archival cotton-rag with 12-colour pigment inks. Rated 100+ years." },
  { id: "hahnemuhle", label: "Hahnemühle German Etching", mult: 1.6, note: "310gsm mould-made etching paper with a velvety, textured surface." },
];

export const SIZES: { id: SizeId; label: string; short: string; mult: number; cm: [number, number] }[] = [
  { id: "a3", label: "11.7 × 16.5″ (A3)", short: "11.7 × 16.5″", mult: 0.65, cm: [29.7, 42] },
  { id: "a2", label: "16.5 × 23.4″ (A2)", short: "16.5 × 23.4″", mult: 1, cm: [42, 59.4] },
  { id: "a1", label: "23.4 × 33.1″ (A1)", short: "23.4 × 33.1″", mult: 1.6, cm: [59.4, 84.1] },
  { id: "a0", label: "33.1 × 46.8″ (A0)", short: "33.1 × 46.8″", mult: 2.4, cm: [84.1, 118.9] },
];

export const EDITIONS: { id: EditionId; label: string; add: number }[] = [
  { id: "open", label: "Open Edition", add: 0 },
  { id: "numbered", label: "Numbered + Certificate", add: 35 },
];

export const FRAMES: { id: FrameId; label: string; add: Record<SizeId, number> }[] = [
  { id: "unframed", label: "Unframed", add: { a3: 0, a2: 0, a1: 0, a0: 0 } },
  { id: "classic", label: "Classic Frame", add: { a3: 55, a2: 85, a1: 130, a0: 190 } },
  { id: "canvas", label: "Framed Canvas", add: { a3: 75, a2: 115, a1: 170, a0: 240 } },
];

export const FRAME_COLORS: { id: FrameColorId; label: string; hex: string }[] = [
  { id: "black", label: "Black", hex: "#141414" },
  { id: "oak", label: "Natural Oak", hex: "#b58a5a" },
  { id: "white", label: "White", hex: "#f1f0ec" },
];

export const DEFAULT_OPTIONS: PrintOptions = {
  paper: "budget",
  size: "a2",
  edition: "open",
  frame: "unframed",
  frameColor: "black",
};

export function unitPrice(art: Pick<Artwork, "basePrice">, o: PrintOptions) {
  const paper = PAPERS.find((p) => p.id === o.paper)!;
  const size = SIZES.find((s) => s.id === o.size)!;
  const edition = EDITIONS.find((e) => e.id === o.edition)!;
  const frame = FRAMES.find((f) => f.id === o.frame)!;
  return Math.round(art.basePrice * size.mult * paper.mult) + edition.add + frame.add[o.size];
}

export const fromPrice = (art: Pick<Artwork, "basePrice">) =>
  unitPrice(art, { ...DEFAULT_OPTIONS, size: "a3" });

export function describeOptions(o: PrintOptions) {
  const paper = PAPERS.find((p) => p.id === o.paper)!;
  const size = SIZES.find((s) => s.id === o.size)!;
  const edition = EDITIONS.find((e) => e.id === o.edition)!;
  const frame = FRAMES.find((f) => f.id === o.frame)!;
  const color = FRAME_COLORS.find((c) => c.id === o.frameColor)!;
  const parts = [paper.label, size.label, edition.label, frame.label];
  if (o.frame !== "unframed") parts.push(color.label);
  return parts.join(" · ");
}

export const optionsKey = (slug: string, o: PrintOptions) =>
  [slug, o.paper, o.size, o.edition, o.frame, o.frame === "unframed" ? "-" : o.frameColor].join(":");

export type CurrencyId = "USD" | "EUR" | "GBP" | "JPY";
export const CURRENCIES: { id: CurrencyId; rate: number; symbol: string }[] = [
  { id: "USD", rate: 1, symbol: "$" },
  { id: "EUR", rate: 0.92, symbol: "€" },
  { id: "GBP", rate: 0.78, symbol: "£" },
  { id: "JPY", rate: 154, symbol: "¥" },
];

export function formatPrice(usd: number, currency: CurrencyId) {
  const c = CURRENCIES.find((x) => x.id === currency)!;
  const value = usd * c.rate;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "JPY" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(currency === "JPY" ? Math.round(value / 10) * 10 : value);
}
