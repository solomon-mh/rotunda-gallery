import { artworks, collections, type Artwork, type Collection } from "@/lib/artworks";

/**
 * The gallery is a ring-shaped corridor (an annulus), like the video:
 * an outer wall curving away on the right, an inner wall close on the left,
 * and the visitor walking along between them. Walking = rotating the ring.
 */
export const RO = 13; // outer wall radius
export const RI = 8.4; // inner wall radius
export const RC = 10.15; // visitor's distance from the centre
export const WALL_H = 6.6;
export const ART_Y = 2.3; // centre line of the hang
export const EYE_Y = 2.0;

/** Angle (radians, + = ahead) where the "current" work sits on each wall. */
export const FOCUS = { outer: 0.34, inner: 0.16 } as const;
/** Angular window outside which works are behind the visitor and hidden. */
export const VISIBLE = { outer: [-0.8, 1.9], inner: [-0.8, 0.85] } as const;

export type Wall = "outer" | "inner";

type Base = { key: string; a: number; w: number; h: number; wall: Wall; collection: Collection };
export type Slot =
  | (Base & { kind: "art"; art: Artwork; index: number })
  | (Base & { kind: "placard"; count: number });

const GAP = 1.35;
const COLLECTION_GAP = 1.0;
const INNER_GAP = 1.6;

function artSize(a: Artwork) {
  const aspect = a.width / a.height;
  const area = 3.3;
  let h = Math.sqrt(area / aspect);
  let w = h * aspect;
  if (h > 2.4) {
    h = 2.4;
    w = h * aspect;
  }
  if (w > 3.0) {
    w = 3.0;
    h = w / aspect;
  }
  return { w, h };
}

/**
 * Lay the works out along the corridor. Most hang on the outer wall in sequence;
 * every third work of a collection is hung opposite, on the inner wall.
 * Every slot gets an angle `a` on one shared ring, so both walls move together.
 */
export function buildSlots() {
  const slots: Slot[] = [];
  let cursor = 0; // arc length along the outer wall
  let innerEnd = -Infinity; // angle where the last inner work ends
  let index = 0;
  for (const c of collections) {
    const works = artworks.filter((a) => a.collection === c.slug);
    const pw = 1.8;
    const ph = 2.45;
    slots.push({ kind: "placard", key: `placard-${c.slug}`, a: (cursor + pw / 2) / RO, w: pw, h: ph, wall: "outer", collection: c, count: works.length });
    cursor += pw + GAP;
    works.forEach((art, k) => {
      const { w, h } = artSize(art);
      if (k % 3 === 2) {
        // Opposite wall: across from where it would have hung, never overlapping its neighbour.
        const half = w / 2 / RI;
        const a = Math.max(cursor / RO, innerEnd + INNER_GAP / RI + half);
        innerEnd = a + half;
        slots.push({ kind: "art", key: art.slug, a, w, h, wall: "inner", art, index: index++, collection: c });
        cursor += 0.6;
      } else {
        slots.push({ kind: "art", key: art.slug, a: (cursor + w / 2) / RO, w, h, wall: "outer", art, index: index++, collection: c });
        cursor += w + GAP;
      }
    });
    cursor += COLLECTION_GAP;
  }
  const period = Math.max(cursor / RO, innerEnd + INNER_GAP / RI);
  return { slots, period };
}

/** Wrap an angle difference into [-P/2, P/2). */
export function wrap(d: number, P: number) {
  return ((((d + P / 2) % P) + P) % P) - P / 2;
}

/** Scroll value (outer-wall arc units) that puts slot `s` at its wall's focus angle. */
export const scrollFor = (s: Slot) => (s.a - FOCUS[s.wall]) * RO;

/** Camera base pose for a viewport aspect: looking along the corridor so both walls are in frame. */
export function basePose(aspect: number) {
  // Negative yaw turns toward the inner wall so its curved edge stays in frame on the left.
  if (aspect < 0.8) return poseFrom(80, RC, -0.24, 0.35);
  if (aspect < 1.25) return poseFrom(72, RC, -0.16, 0.4);
  return poseFrom(62, RC, -0.12, 0.45);
}

function poseFrom(fov: number, r: number, yaw: number, lookY: number) {
  return {
    fov,
    pos: { x: 0, y: EYE_Y, z: r },
    look: { x: Math.cos(yaw) * 10, y: EYE_Y + lookY, z: r + Math.sin(yaw) * 10 },
  };
}
