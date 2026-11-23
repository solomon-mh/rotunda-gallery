import * as THREE from "three";
import type { Artwork, Collection } from "@/lib/artworks";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function toTexture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Colours for the corridor in each theme. Light keeps the video's clean white gallery. */
export type Palette = {
  bg: string;
  fog: string;
  wall: [bottom: string, contact: string, main: string, top: string];
  floor: [wallEdge: string, mid: string];
  ceiling: [wallEdge: string, mid: string];
  /** Warm pool of light thrown on the wall by each picture spot. */
  pool: [color: string, opacity: number];
  /** Track & spot-can colour. */
  fixture: string;
  /** Overall brightness of the visitors (they're lit like the room). */
  figure: number;
  card: string;
  cardLine: string;
  text: string;
  textSoft: string;
  muted: string;
  placeholder: string;
  shadow: number;
  grazing: [outer: number, inner: number];
};

export const PALETTES: Record<"light" | "dark", Palette> = {
  light: {
    bg: "#f2f2f1",
    fog: "#f0f0ef",
    wall: ["#d9d9d7", "#e9e9e7", "#f1f1ef", "#ececea"],
    floor: ["#cacac9", "#dbdbda"],
    ceiling: ["#ececeb", "#f6f6f5"],
    pool: ["#fff7e8", 0.9],
    fixture: "#2b2b2a",
    figure: 1,
    card: "#fbfbfa",
    cardLine: "rgba(0,0,0,0.06)",
    text: "#151515",
    textSoft: "#3a3a39",
    muted: "#7a7a78",
    placeholder: "#e4e4e2",
    shadow: 0.26,
    grazing: [0.95, 0.93],
  },
  dark: {
    bg: "#202020",
    fog: "#232322",
    wall: ["#1c1c1b", "#2c2c2b", "#3c3c3a", "#363635"],
    floor: ["#171716", "#242423"],
    ceiling: ["#262625", "#2e2e2d"],
    pool: ["#f3e3c4", 0.2],
    fixture: "#121212",
    figure: 0.62,
    card: "#262625",
    cardLine: "rgba(255,255,255,0.06)",
    text: "#ededeb",
    textSoft: "#c9c9c5",
    muted: "#8e8e8a",
    placeholder: "#333332",
    shadow: 0.55,
    grazing: [0.86, 0.8],
  },
};

/** Wall: flat gallery paint with a thin soft contact shadow at the floor. */
export function wallTexture(p: Palette) {
  const [c, ctx] = canvas(4, 512);
  const g = ctx.createLinearGradient(0, 512, 0, 0); // bottom → top
  g.addColorStop(0, p.wall[0]);
  g.addColorStop(0.012, p.wall[1]);
  g.addColorStop(0.05, p.wall[2]);
  g.addColorStop(0.88, p.wall[2]);
  g.addColorStop(1, p.wall[3]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 512);
  return toTexture(c);
}

/** Floor of the ring corridor: lighter down the walkway, soft contact shadows at both walls. */
export function floorTexture(ri: number, p: Palette) {
  const [c, ctx] = canvas(1024, 1024);
  const g = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
  g.addColorStop(0, p.floor[0]);
  g.addColorStop(Math.max(0, ri - 0.005), p.floor[0]);
  g.addColorStop(ri + 0.02, p.floor[1]);
  g.addColorStop(0.975, p.floor[1]);
  g.addColorStop(1, p.floor[0]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 1024);
  return toTexture(c);
}

export function ceilingTexture(ri: number, p: Palette) {
  const [c, ctx] = canvas(1024, 1024);
  const g = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
  g.addColorStop(0, p.ceiling[0]);
  g.addColorStop(ri, p.ceiling[0]);
  g.addColorStop(ri + 0.05, p.ceiling[1]);
  g.addColorStop(0.95, p.ceiling[1]);
  g.addColorStop(1, p.ceiling[0]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 1024);
  return toTexture(c);
}

/**
 * The scallop of light a ceiling spot throws on the wall: an ellipse that's brightest
 * just above the work and falls off softly. Drawn white; tinted by the material.
 */
export function poolTexture() {
  const W = 256;
  const H = 512;
  const [c, ctx] = canvas(W, H);
  ctx.translate(W / 2, H * 0.42);
  ctx.scale(1, H / W);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, W / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.82)");
  g.addColorStop(0.78, "rgba(255,255,255,0.28)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-W / 2, -W / 2, W, W);
  return toTexture(c);
}

/** Soft round contact shadow under a visitor's feet. */
export function footShadowTexture() {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,0.75)");
  g.addColorStop(0.45, "rgba(0,0,0,0.35)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return toTexture(c);
}

/** Soft rectangular drop shadow (drawn via shadowBlur so it works in every browser). */
export function shadowTexture() {
  const [c, ctx] = canvas(256, 256);
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 26;
  ctx.shadowOffsetX = 1000;
  ctx.fillStyle = "#000";
  ctx.fillRect(40 - 1000, 40, 176, 176);
  return toTexture(c);
}

export type Fonts = { display: string; serif: string; mono: string };

export async function loadFonts(): Promise<Fonts> {
  const css = getComputedStyle(document.documentElement);
  const fonts = {
    display: css.getPropertyValue("--font-display").trim() || "Impact, sans-serif",
    serif: css.getPropertyValue("--font-serif").trim() || "Georgia, serif",
    mono: css.getPropertyValue("--font-mono").trim() || "monospace",
  };
  try {
    await Promise.all([
      document.fonts.load(`64px ${fonts.display}`),
      document.fonts.load(`32px ${fonts.serif}`),
      document.fonts.load(`italic 32px ${fonts.serif}`),
      document.fonts.load(`20px ${fonts.mono}`),
    ]);
  } catch {
    /* fall back to whatever is available */
  }
  return fonts;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

/** Wall caption: a small museum label hung beside the frame. */
export function labelTexture(art: Artwork, collection: Collection, f: Fonts, p: Palette) {
  const W = 720;
  const H = 300;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = p.card;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = p.text;
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 50px ${f.serif}`;
  ctx.fillText(fitText(ctx, art.artist, W - 80), 40, 84);
  ctx.font = `italic 50px ${f.serif}`;
  ctx.fillText(fitText(ctx, `${art.title}, ${art.year}`, W - 80), 40, 148);
  ctx.fillStyle = p.muted;
  ctx.font = `24px ${f.mono}`;
  ctx.fillText(fitText(ctx, art.medium.toUpperCase(), W - 80), 40, 214);
  ctx.fillText(fitText(ctx, collection.name.toUpperCase(), W - 80), 40, 254);
  return toTexture(c);
}

/** The collection title, lettered on the wall where each section of the hang begins. */
export function placardTexture(collection: Collection, count: number, f: Fonts, p: Palette) {
  const W = 740;
  const H = 1000;
  const [c, ctx] = canvas(W, H); // transparent: the lettering sits straight on the wall
  ctx.fillStyle = p.muted;
  ctx.font = `22px ${f.mono}`;
  ctx.fillText(`COLLECTION ${collection.number}`, 56, 92);

  ctx.fillStyle = p.text;
  ctx.font = `120px ${f.display}`;
  const words = collection.name.toUpperCase().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > W - 112 && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, 56, 230 + i * 112));

  ctx.fillStyle = p.textSoft;
  ctx.font = `italic 34px ${f.serif}`;
  const tag = collection.tagline;
  const tagWords = tag.split(" ");
  let tl = "";
  let ty = 230 + lines.length * 112 + 30;
  for (const w of tagWords) {
    const test = tl ? `${tl} ${w}` : w;
    if (ctx.measureText(test).width > W - 112 && tl) {
      ctx.fillText(tl, 56, ty);
      ty += 46;
      tl = w;
    } else tl = test;
  }
  ctx.fillText(tl, 56, ty);

  ctx.fillStyle = p.muted;
  ctx.font = `20px ${f.mono}`;
  ctx.fillText(collection.era.toUpperCase().split(" · ")[1] ?? "", 56, H - 120);
  ctx.fillText(`${count} WORKS  ·  ENTER →`, 56, H - 80);
  return toTexture(c);
}
