import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RC, RI, RO, wrap, type Slot } from "./layout";
import { litMaterial, type LitMaterial } from "./hang";
import { footShadowTexture, type Palette } from "./textures";
import type { GalleryAudio } from "./ambience";

/*
 * Other people walking the rotunda. Each visitor lives in the same ring space as the
 * works (an angle `phi` on the shared period plus a radius), so they stay put while
 * the gallery turns around the camera. They wander from work to work, pause to look,
 * glance around, and step out of your way.
 */

type VisitorsCtl = {
  scroll: number;
  mode: "idle" | "focusing" | "focused" | "returning";
  focused: number;
};

type Props = {
  slots: Slot[];
  period: number;
  ctl: React.RefObject<VisitorsCtl>;
  groups: React.RefObject<(THREE.Group | null)[]>;
  pal: Palette;
  density: number;
  /** Ambient sound engine, when sound is on. */
  audio: GalleryAudio | null;
};

// Muted, gallery-goer wardrobe.
const SKIN = ["#f2d5c0", "#e6bc9a", "#cf9b74", "#ad7550", "#7e4f33", "#5b3a26"];
const HAIR = ["#1c1917", "#2f2520", "#4b3527", "#7b5a3b", "#a98656", "#8f8d89", "#d9d3c6"];
const TOPS = ["#1f1f1f", "#2c3542", "#5a6152", "#b8a487", "#8a4a33", "#e7e2d8", "#6b7d92", "#a23c30", "#3c4a3a", "#cdc4b3", "#2a2a44", "#d6b25e"];
const COATS = ["#1c1c1c", "#3a3631", "#7d6a52", "#a58d6c", "#2b3646", "#4d4f3f", "#7a2f2a"];
const BOTTOMS = ["#1a1a1a", "#272c35", "#3a3e45", "#6b5c4a", "#2e3c52", "#c8bdab", "#4a4947"];
const SHOES = ["#151515", "#2a201a", "#ebe9e4", "#5a4030"];

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const damp = (a: number, b: number, lambda: number, dt: number) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/** Bake a flat colour into a part so a whole figure can share one material. */
function tint(geo: THREE.BufferGeometry, hex: string, m?: THREE.Matrix4) {
  const g = geo;
  if (m) g.applyMatrix4(m);
  g.deleteAttribute("uv");
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(arr, i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return g;
}
const M = (x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, rz)), new THREE.Vector3(sx, sy, sz));
const merge = (parts: THREE.BufferGeometry[]) => {
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return g;
};

type Rig = {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  legs: [THREE.Group, THREE.Group];
  arms: [THREE.Group, THREE.Group];
  material: LitMaterial;
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  geometries: THREE.BufferGeometry[];
};

/** A simple, readable figure (≈1.8 units tall before scaling), facing +z. */
function buildRig(shadowTex: THREE.Texture, exposure: number, guide = false) {
  const skin = pick(SKIN);
  const coat = !guide && Math.random() < 0.3;
  // The guide wears the gallery's navy blazer.
  const top = guide ? "#1f2a44" : coat ? pick(COATS) : pick(TOPS);
  const bottom = guide ? "#23262c" : pick(BOTTOMS);
  const shoes = guide ? "#151515" : pick(SHOES);
  const hair = pick(HAIR);
  const hairStyle = Math.floor(Math.random() * 4); // short, bun, long, cropped
  const shortSleeves = !guide && !coat && Math.random() < 0.25;
  const bag = !guide && Math.random() < 0.22;
  const sw = rand(0.92, 1.12); // build

  const geometries: THREE.BufferGeometry[] = [];
  const keep = <G extends THREE.BufferGeometry>(g: G) => (geometries.push(g), g);
  const material = litMaterial({ vertexColors: true, exposure, key: [0.25, 0.85, 0.55], shininess: 12 });
  const mesh = (g: THREE.BufferGeometry) => new THREE.Mesh(keep(g), material);

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Legs (pivot at the hip).
  const legGeo = () =>
    merge([
      tint(new THREE.CylinderGeometry(0.088, 0.066, 0.46, 12), bottom, M(0, -0.21, 0)), // thigh
      tint(new THREE.SphereGeometry(0.088, 12, 8), bottom, M(0, 0, 0)), // hip joint
      tint(new THREE.CapsuleGeometry(0.06, 0.34, 4, 10), bottom, M(0, -0.6, 0)), // shin
      tint(new THREE.CapsuleGeometry(0.05, 0.15, 4, 10), shoes, M(0, -0.875, 0.05, 1.1, 0.8, 1, Math.PI / 2)),
    ]);
  const legs = [-1, 1].map((side) => {
    const g = new THREE.Group();
    g.position.set(side * 0.092, 0.92, 0);
    g.add(mesh(legGeo()));
    body.add(g);
    return g;
  }) as [THREE.Group, THREE.Group];

  // Torso, hips, neck (and maybe a long coat or a tote).
  const torsoParts = [
    tint(new THREE.CylinderGeometry(0.17, 0.175, 0.18, 14), bottom, M(0, 0.95, 0, sw, 1, 0.7)),
    tint(new THREE.CylinderGeometry(0.2, 0.165, 0.42, 16), top, M(0, 1.22, 0, sw, 1, 0.62)), // chest
    tint(new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), top, M(0, 1.43, 0, sw, 0.42, 0.62)), // shoulders
    tint(new THREE.CylinderGeometry(0.048, 0.055, 0.12, 10), skin, M(0, 1.55, 0)),
  ];
  if (guide) {
    // Lanyard and name badge.
    torsoParts.push(tint(new THREE.TorusGeometry(0.13, 0.008, 4, 20, Math.PI), "#b8322a", M(0, 1.46, 0.02, 0.9, 1.5, 0.7, 0, Math.PI)));
    torsoParts.push(tint(new THREE.BoxGeometry(0.075, 0.1, 0.012), "#f4f1ea", M(0, 1.25, 0.13)));
  }
  if (coat) torsoParts.push(tint(new THREE.CylinderGeometry(0.2, 0.235, 0.86, 16, 1, true), top, M(0, 1.0, 0, sw, 1, 0.74)));
  if (bag) {
    const bagColor = pick(["#d8cdb8", "#1d1d1d", "#8b6b4a"]);
    torsoParts.push(tint(new THREE.BoxGeometry(0.06, 0.34, 0.3), bagColor, M(-(0.23 * sw + 0.06), 0.98, -0.02)));
    torsoParts.push(tint(new THREE.TorusGeometry(0.2, 0.008, 4, 16, Math.PI), bagColor, M(-(0.19 * sw + 0.02), 1.14, -0.02, 1, 1.35, 1, 0, Math.PI / 2 + 0.25)));
  }
  body.add(mesh(merge(torsoParts)));

  // Arms (pivot at the shoulder).
  const armGeo = () =>
    merge(
      shortSleeves
        ? [
            tint(new THREE.CapsuleGeometry(0.064, 0.18, 4, 10), top, M(0, -0.12, 0)),
            tint(new THREE.CapsuleGeometry(0.048, 0.36, 4, 10), skin, M(0, -0.38, 0)),
            tint(new THREE.SphereGeometry(0.048, 10, 8), skin, M(0, -0.62, 0.01)),
          ]
        : [
            tint(new THREE.CylinderGeometry(0.062, 0.048, 0.56, 10), top, M(0, -0.3, 0)),
            tint(new THREE.SphereGeometry(0.062, 10, 8), top, M(0, 0, 0)),
            tint(new THREE.SphereGeometry(0.047, 10, 8), skin, M(0, -0.62, 0.01)),
          ],
    );
  const arms = [-1, 1].map((side) => {
    const g = new THREE.Group();
    g.position.set(side * (0.2 * sw + 0.045), 1.42, 0);
    g.add(mesh(armGeo()));
    body.add(g);
    return g;
  }) as [THREE.Group, THREE.Group];
  if (guide) {
    // A tour paddle held in the right hand — up high while leading, so the group can follow it.
    const paddle = merge([
      tint(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), "#2a2a2a", M(0, -0.85, 0.02)),
      tint(new THREE.CylinderGeometry(0.13, 0.13, 0.014, 24), "#c8372d", M(0, -1.18, 0.02, 1, 1, 1, Math.PI / 2)),
      tint(new THREE.CylinderGeometry(0.07, 0.07, 0.016, 20), "#f4f1ea", M(0, -1.18, 0.02, 1, 1, 1, Math.PI / 2)),
    ]);
    arms[1].add(mesh(paddle));
  }

  // Head & hair (pivot at the top of the neck).
  const head = new THREE.Group();
  head.position.set(0, 1.59, 0);
  const headParts = [
    tint(new THREE.SphereGeometry(0.112, 18, 14), skin, M(0, 0.11, 0, 0.9, 1.07, 0.98)),
    tint(new THREE.SphereGeometry(0.02, 6, 6), skin, M(0, 0.1, 0.1)), // nose
  ];
  if (hairStyle === 3) {
    headParts.push(tint(new THREE.SphereGeometry(0.116, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), hair, M(0, 0.12, -0.008, 0.92, 1.05, 1, -0.35)));
  } else {
    headParts.push(tint(new THREE.SphereGeometry(0.121, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, M(0, 0.12, -0.012, 0.93, 1.06, 1, -0.42)));
  }
  if (hairStyle === 1) headParts.push(tint(new THREE.SphereGeometry(0.055, 10, 8), hair, M(0, 0.2, -0.09)));
  if (hairStyle === 2) headParts.push(tint(new THREE.SphereGeometry(0.105, 14, 10), hair, M(0, 0.02, -0.035, 1.06, 1.5, 0.95)));
  head.add(mesh(merge(headParts)));
  body.add(head);

  const shadow = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(1, 1)),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.006;
  shadow.scale.set(0.78 * sw, 0.58, 1);
  shadow.renderOrder = 1;
  root.add(shadow);

  const hardShoes = shoes === "#151515" || shoes === "#2a201a";
  return { root, body, head, legs, arms, material, shadow, geometries, coat, hardShoes } satisfies Rig & { coat: boolean; hardShoes: boolean };
}

type Role = "solo" | "lead" | "follow" | "guide" | "tourist";

type Party = {
  kind: "solo" | "pair" | "tour";
  members: Visitor[];
  /** Who's talking in a pair (-1 = a comfortable silence). */
  speaker: number;
  turnTimer: number;
};

type Visitor = {
  id: number;
  rig: ReturnType<typeof buildRig>;
  role: Role;
  party: Party;
  /** Position within the party (followers). */
  rank: number;
  phi: number; // ring angle, same space as slot.a
  r: number; // distance from the rotunda centre
  h: number; // heading relative to "facing the outer wall"
  speed: number;
  pace: number;
  dir: 1 | -1;
  state: "walk" | "look";
  target: { phi: number; r: number; slot: number };
  /** Bumped every time a leader picks somewhere new — followers react to it. */
  version: number;
  seen: number;
  delay: number;
  timer: number;
  phase: number;
  step: number;
  pose: 0 | 1; // idle arms: by the side / hands behind the back
  headYaw: number;
  headPitch: number;
  headTarget: number;
  headTimer: number;
  scale: number;
  fade: number;
  seed: number;
  speaking: boolean;
  /** Smoothed 0…1 amounts for talking gestures and the guide's pointing. */
  gesture: number;
  point: number;
  guideMode: "address" | "point";
  modeTimer: number;
  pitch: number;
};

/** Distance a visitor keeps from the wall they're looking at. */
const viewRadius = (s: Slot) => (s.wall === "outer" ? RO - rand(1.45, 1.95) : RI + rand(0.82, 0.95));
/** Lanes for strolling, either side of the path the camera walks. */
const laneRadius = () => (Math.random() < 0.5 ? rand(RI + 0.75, RI + 1.0) : rand(RC + 1.0, RC + 1.5));
/** Visitors are only drawn inside this angular window (+ = ahead of the camera). */
const WINDOW: [number, number] = [-0.75, 1.75];
const GROUP_R = RO - 1.75; // where a tour group stands

export default function Visitors({ slots, period, ctl, groups, pal, density, audio }: Props) {
  const shadowTex = useMemo(() => footShadowTexture(), []);
  const artIdx = useMemo(() => slots.flatMap((s, i) => (s.kind === "art" ? [i] : [])), [slots]);
  const outerArt = useMemo(() => artIdx.filter((i) => slots[i].wall === "outer"), [artIdx, slots]);

  const crowd = useMemo(() => {
    const total = Math.round(THREE.MathUtils.clamp(((period * RC) / 6.5) * density, 5, 30));
    const visitors: Visitor[] = [];
    const make = (role: Role, party: Party, rank = 0): Visitor => {
      const guide = role === "guide";
      const rig = buildRig(shadowTex, pal.figure, guide);
      const scale = rand(1.58, 1.9) / 1.8;
      rig.root.scale.setScalar(scale);
      const low = Math.random() < 0.5;
      const v: Visitor = {
        id: visitors.length,
        rig,
        role,
        party,
        rank,
        phi: 0,
        r: RC,
        h: 0,
        speed: 0,
        pace: guide ? 0.6 : rand(0.62, 0.98),
        dir: Math.random() < 0.62 ? 1 : -1,
        state: "look",
        target: { phi: 0, r: RC, slot: -1 },
        version: 0,
        seen: 0,
        delay: 0,
        timer: 0,
        phase: Math.random() * Math.PI * 2,
        step: 0,
        pose: !guide && Math.random() < 0.35 ? 1 : 0,
        headYaw: 0,
        headPitch: 0,
        headTarget: 0,
        headTimer: 0,
        scale,
        fade: 1,
        seed: Math.random() * 100,
        speaking: false,
        gesture: 0,
        point: 0,
        guideMode: "address",
        modeTimer: rand(3, 6),
        pitch: low ? rand(95, 135) : rand(170, 235),
      };
      party.members.push(v);
      visitors.push(v);
      return v;
    };
    const party = (kind: Party["kind"]): Party => ({ kind, members: [], speaker: -1, turnTimer: rand(1, 3) });

    // One guided tour of the outer wall…
    if (total >= 8) {
      const tour = party("tour");
      const guide = make("guide", tour);
      guide.dir = 1;
      const size = Math.min(5, Math.max(3, Math.round(total / 5)));
      for (let k = 0; k < size; k++) make("tourist", tour, k);
    }
    // …then couples and friends, and people on their own.
    while (visitors.length < total) {
      if (Math.random() < 0.45 && total - visitors.length >= 2) {
        const p = party("pair");
        make("lead", p);
        make("follow", p, 0).pace = p.members[0].pace;
      } else make("solo", party("solo"));
    }
    return visitors;
    // A new crowd only when the hang or the quality setting changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, period, density, shadowTex]);

  /* ------------------------------------------------------------ choosing where to go */

  const busy = (i: number, self: Visitor) => crowd.filter((o) => o !== self && o.role !== "follow" && o.role !== "tourist" && o.target.slot === i).length;

  const nextWorks = (v: Visitor, pool: number[]) =>
    pool
      .map((i) => ({ i, d: ((((slots[i].a - v.phi) * v.dir) % period) + period) % period }))
      .filter((o) => o.d > 0.06)
      .sort((a, b) => a.d - b.d);

  /** Leaders and solo visitors: pick the next work (or a stretch of corridor) to head for. */
  const chooseNext = (v: Visitor) => {
    v.version++;
    if (v.role === "guide") {
      // The tour works its way along the outer wall, a stop every work or two.
      const ahead = nextWorks(v, outerArt);
      const choice = ahead[Math.random() < 0.6 ? 0 : Math.min(1, ahead.length - 1)];
      const s = slots[choice.i];
      const r = RO - 0.85;
      v.target = { phi: s.a + (s.w / 2 + 0.55) / r, r, slot: choice.i };
      return;
    }
    if (Math.random() < 0.12) v.dir = (v.dir * -1) as 1 | -1;
    if (Math.random() < 0.25) {
      const r = laneRadius();
      v.target = { phi: v.phi + (v.dir * rand(5, 11)) / r, r, slot: -1 };
      return;
    }
    // One of the next few works in the direction of travel, preferring uncrowded ones.
    const ahead = nextWorks(v, artIdx).slice(0, 4);
    const free = ahead.filter((o) => busy(o.i, v) < 2);
    const opts = free.length ? free : ahead;
    const choice = opts[Math.floor(Math.random() * Math.min(3, opts.length))];
    const s = slots[choice.i];
    const r = viewRadius(s);
    const side = busy(choice.i, v) ? (Math.random() < 0.5 ? -1 : 1) * rand(0.45, 0.65) : rand(-0.25, 0.25);
    v.target = { phi: s.a + (side * Math.max(1, s.w / 2)) / r, r, slot: choice.i };
  };

  /** Followers: where to stand relative to their leader's choice. */
  const followSpot = (f: Visitor) => {
    const lead = f.party.members[0];
    const t = lead.target;
    if (f.role === "tourist") {
      const n = f.party.members.length - 1;
      if (t.slot >= 0) {
        const r = GROUP_R - (f.rank % 2) * 0.38 + rand(-0.06, 0.06);
        const along = (f.rank - (n - 1) / 2) * 0.66 + rand(-0.08, 0.08);
        f.target = { phi: slots[t.slot].a + along / r, r, slot: t.slot };
      } else {
        const r = GROUP_R + ((f.rank % 2) - 0.5) * 0.6;
        f.target = { phi: t.phi - (lead.dir * (1.1 + f.rank * 0.55)) / r, r, slot: -1 };
      }
      return;
    }
    // A companion: shoulder to shoulder.
    if (t.slot >= 0) {
      f.target = { phi: t.phi + 0.62 / t.r, r: t.r + rand(-0.08, 0.08), slot: t.slot };
    } else {
      const r = t.r + (t.r < RC ? -0.1 : 0.45);
      f.target = { phi: t.phi - (lead.dir * 0.25) / r, r: THREE.MathUtils.clamp(r, RI + 0.6, RO - 0.6), slot: -1 };
    }
  };

  // Place everyone: mid-visit at a work, or walking somewhere.
  useMemo(() => {
    for (const v of crowd) {
      if (v.role === "follow" || v.role === "tourist") continue;
      if (v.role === "guide") {
        v.phi = Math.random() * period;
        chooseNext(v);
      } else {
        const si = artIdx[Math.floor(Math.random() * artIdx.length)];
        const s = slots[si];
        v.r = viewRadius(s);
        v.phi = s.a + rand(-0.35, 0.35) / v.r;
        v.target = { phi: v.phi, r: v.r, slot: si };
        if (Math.random() < 0.35) {
          v.r = laneRadius();
          v.phi = Math.random() * period;
          v.target = { phi: v.phi + (v.dir * rand(4, 10)) / v.r, r: v.r, slot: -1 };
        }
      }
      v.phi = v.target.slot >= 0 ? v.target.phi : v.phi;
      v.r = v.target.slot >= 0 ? v.target.r : v.r;
      v.state = v.target.slot >= 0 ? "look" : "walk";
      v.timer = v.role === "guide" ? rand(8, 20) : rand(1, 14);
      v.h = v.state === "walk" ? (v.dir * Math.PI) / 2 : slots[v.target.slot].wall === "outer" ? 0 : Math.PI;
      for (const f of v.party.members.slice(1)) {
        f.dir = v.dir;
        followSpot(f);
        f.phi = f.target.phi;
        f.r = f.target.r;
        f.state = v.state;
        f.h = v.h;
        f.seen = v.version;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crowd]);

  // Theme changes just relight the existing crowd.
  useEffect(() => {
    crowd.forEach((v) => (v.rig.material.uniforms.exposure.value = pal.figure));
  }, [crowd, pal]);

  useEffect(
    () => () => {
      crowd.forEach((v) => {
        v.rig.geometries.forEach((g) => g.dispose());
        v.rig.material.dispose();
        v.rig.shadow.material.dispose();
      });
    },
    [crowd],
  );
  useEffect(() => () => shadowTex.dispose(), [shadowTex]);
  // Nobody talks once the visitors are hidden.
  useEffect(() => () => audio?.assignTalkers([]), [audio]);

  const tmp = useMemo(
    () => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), q: new THREE.Vector3(), right: new THREE.Vector3(), fwd: new THREE.Vector3(), talkClock: 0 }),
    [],
  );

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const c = ctl.current!;
    const t = state.clock.elapsedTime;
    const camPhi = c.scroll / RO; // the camera stands at ring angle scroll / RO
    const cam = state.camera.position;
    const focusedGroup = c.mode !== "idle" && c.focused >= 0 ? groups.current![c.focused] : null;
    tmp.right.setFromMatrixColumn(state.camera.matrixWorld, 0);
    tmp.fwd.setFromMatrixColumn(state.camera.matrixWorld, 2).negate();

    // Conversations: pairs take turns, with the odd silence.
    for (const v of crowd) {
      if (v.role !== "lead") continue;
      const p = v.party;
      p.turnTimer -= dt;
      if (p.turnTimer <= 0) {
        const r = Math.random();
        p.speaker = r < 0.25 ? -1 : r < 0.7 ? 1 - Math.max(0, p.speaker) : Math.max(0, p.speaker);
        p.turnTimer = p.speaker < 0 ? rand(2, 6) : rand(1.6, 4.5);
      }
    }

    for (const v of crowd) {
      const lead = v.party.members[0];
      const isFollower = v.role === "follow" || v.role === "tourist";

      // ---- Followers react (after a beat) when their leader moves on.
      if (isFollower && v.seen !== lead.version) {
        v.delay -= dt;
        if (v.delay <= 0) {
          v.seen = lead.version;
          v.dir = lead.dir;
          followSpot(v);
          v.state = "walk";
          v.delay = v.role === "tourist" ? rand(0.6, 2.8) : rand(0.2, 0.9);
        }
      }

      // ---- Decide & move (in ring space).
      const arc = wrap(v.target.phi - v.phi, period) * v.r;
      const dr = v.target.r - v.r;
      const dist = Math.hypot(arc, dr);
      let wantH = v.h;
      let wantSpeed = 0;

      if (v.state === "walk") {
        if (dist < 0.08) {
          if (v.target.slot >= 0) {
            v.state = "look";
            v.timer = v.role === "guide" ? rand(16, 26) : v.role === "lead" ? rand(8, 20) : rand(5, 16);
          } else if (!isFollower) chooseNext(v);
        } else {
          wantH = Math.atan2(arc, dr);
          const align = Math.max(0, Math.cos(angleDiff(v.h, wantH)));
          // Followers who've fallen behind hurry a little.
          const pace = isFollower && dist > 2.5 ? v.pace * 1.25 : v.pace;
          wantSpeed = Math.min(pace, dist * 1.4) * align * align;
        }
      } else {
        const s = slots[v.target.slot];
        const wallR = s.wall === "outer" ? RO : RI;
        const toWork = Math.atan2(wrap(s.a - v.phi, period) * wallR, wallR - v.r);
        wantH = toWork;
        if (v.role === "guide") {
          // Alternate between talking to the group and turning to point at the work.
          v.modeTimer -= dt;
          if (v.modeTimer <= 0) {
            v.guideMode = v.guideMode === "address" ? "point" : "address";
            v.modeTimer = v.guideMode === "point" ? rand(2.2, 3.8) : rand(4, 8);
          }
          if (v.guideMode === "address") wantH = Math.atan2(wrap(s.a - v.phi, period) * GROUP_R, GROUP_R - v.r);
        }
        if (!isFollower) {
          v.timer -= dt;
          if (v.timer <= 0) {
            v.state = "walk";
            chooseNext(v);
          }
        }
      }

      // Pairs turn toward each other while talking.
      const partner = v.party.kind === "pair" ? v.party.members[v === lead ? 1 : 0] : null;
      let toPartner = 0;
      if (partner) {
        toPartner = Math.atan2(wrap(partner.phi - v.phi, period) * v.r, partner.r - v.r);
        if (v.state === "look" && v.party.speaker >= 0 && dist < 0.3) wantH += angleDiff(wantH, toPartner) * (v.speaking ? 0.5 : 0.3);
      }

      v.speed = damp(v.speed, wantSpeed, 4, dt);
      v.h += angleDiff(v.h, wantH) * (1 - Math.exp(-(v.state === "walk" ? 5 : 2.5) * dt));
      if (v.speed > 0.001 && dist > 0.001) {
        const step = Math.min(dist, v.speed * dt);
        v.phi += ((arc / dist) * step) / v.r;
        v.r += (dr / dist) * step;
      }

      // Step aside for the camera walking down the middle, and for each other.
      if (v.state === "walk") {
        const camArc = wrap(v.phi - camPhi, period) * RC;
        const gap = v.r - RC;
        if (c.mode === "idle" && Math.abs(camArc) < 2.4 && Math.abs(gap) < 0.85) {
          v.r += Math.sign(gap || 1) * (0.85 - Math.abs(gap)) * Math.min(1, dt * 3);
        }
        for (const o of crowd) {
          if (o === v) continue;
          const da = wrap(v.phi - o.phi, period) * v.r;
          const dd = v.r - o.r;
          if (Math.abs(da) < 0.6 && Math.abs(dd) < 0.5) v.r += Math.sign(dd || 0.5) * (0.5 - Math.abs(dd)) * Math.min(1, dt * 2.5);
        }
      }
      v.r = THREE.MathUtils.clamp(v.r, RI + 0.6, RO - 0.6);
      v.phi = ((v.phi % period) + period) % period;

      // ---- Who's talking.
      if (v.party.kind === "pair") v.speaking = v.party.speaker === (v === lead ? 0 : 1);
      else if (v.role === "guide") v.speaking = v.state === "look" && Math.sin(t * 0.7 + v.seed) > -0.75;
      else v.speaking = false;

      // ---- Place in the world (the ring turns around the camera).
      const theta = wrap(v.phi - camPhi, period);
      const root = v.rig.root;
      const inWindow = theta > WINDOW[0] && theta < WINDOW[1];
      if (inWindow) {
        root.position.set(v.r * Math.sin(theta), 0, v.r * Math.cos(theta));
        root.rotation.y = theta + v.h;
      }

      // ---- Animate.
      const gait = THREE.MathUtils.clamp(v.speed / v.pace, 0, 1);
      v.phase += dt * v.speed * ((Math.PI * 2) / (1.3 * v.scale));
      const sw = Math.sin(v.phase);
      const legAmp = v.rig.coat ? 0.32 : 0.42;
      v.rig.legs[0].rotation.x = sw * legAmp * gait;
      v.rig.legs[1].rotation.x = -sw * legAmp * gait;

      v.gesture = damp(v.gesture, v.speaking ? 1 : 0, 3, dt);
      v.point = damp(v.point, v.role === "guide" && v.state === "look" && v.guideMode === "point" ? 1 : 0, 3.5, dt);
      const idleArmX = v.pose === 1 ? 0.42 : 0.04;
      const idleArmZ = v.pose === 1 ? 0.2 : -0.06;
      for (let k = 0; k < 2; k++) {
        const side = k === 0 ? -1 : 1;
        const arm = v.rig.arms[k];
        let x = THREE.MathUtils.lerp(idleArmX, (k === 0 ? -sw : sw) * 0.32, gait);
        let z = side * THREE.MathUtils.lerp(-idleArmZ, 0.07, gait);
        // Talking with the hands: the right hand mostly, the left now and then.
        const beat = Math.sin(t * (k ? 3.1 : 2.3) + v.seed * (k + 1));
        const g = v.gesture * (k ? 1 : 0.55 * Math.max(0, Math.sin(t * 0.8 + v.seed)));
        x = THREE.MathUtils.lerp(x, -0.62 + beat * 0.22, g);
        z = THREE.MathUtils.lerp(z, side * 0.16, g);
        if (v.role === "guide") {
          // Paddle up while leading the way.
          if (k === 1) x = THREE.MathUtils.lerp(x, -2.75, (1 - v.point) * gait);
          // Point at the work with the left hand.
          if (k === 0) {
            x = THREE.MathUtils.lerp(x, -1.45, v.point);
            z = THREE.MathUtils.lerp(z, -0.12, v.point);
          }
        }
        arm.rotation.x = x;
        arm.rotation.z = z;
      }
      const breathe = Math.sin(t * 1.6 + v.seed) * 0.004;
      v.rig.body.position.y = Math.cos(v.phase * 2) * 0.014 * gait + breathe;
      v.rig.body.rotation.y = sw * 0.06 * gait;
      v.rig.body.rotation.z = Math.sin(t * 0.45 + v.seed) * 0.018 * (1 - gait);

      // Heads: glance around; look up at the work; turn to whoever's speaking, and nod along.
      v.headTimer -= dt;
      if (v.headTimer <= 0) {
        v.headTimer = rand(1.8, 5);
        v.headTarget = v.state === "look" ? (Math.random() < 0.7 ? rand(-0.15, 0.15) : rand(-0.5, 0.5)) : rand(-0.3, 0.3);
      }
      let headGoal = v.headTarget;
      let nod = 0;
      if (partner && v.party.speaker >= 0) {
        headGoal = THREE.MathUtils.clamp(angleDiff(v.h, toPartner), -1.0, 1.0) * (v.speaking ? 0.9 : 0.75);
        if (!v.speaking) nod = Math.max(0, Math.sin(t * 0.9 + v.seed)) * Math.sin(t * 7) * 0.07;
      }
      if (v.role === "tourist" && v.state === "look" && Math.sin(t * 0.33 + v.seed) > 0.2) {
        // Glance over at the guide.
        const toGuide = Math.atan2(wrap(lead.phi - v.phi, period) * v.r, lead.r - v.r);
        headGoal = THREE.MathUtils.clamp(angleDiff(v.h, toGuide), -1.0, 1.0);
      }
      if (v.speaking) nod += Math.sin(t * 5.3 + v.seed) * 0.035;
      v.headYaw = damp(v.headYaw, headGoal, 3, dt);
      v.rig.head.rotation.y = v.headYaw;
      v.headPitch = damp(v.headPitch, v.state === "look" && !v.speaking ? -0.13 : 0.02, 2, dt);
      v.rig.head.rotation.x = v.headPitch + nod;

      // ---- Fade out of the way: right next to the camera, or between it and a work being viewed.
      const camDist = Math.hypot(root.position.x - cam.x, root.position.z - cam.z);
      let want = THREE.MathUtils.smoothstep(camDist, 1.05, 2.1);
      if (focusedGroup && inWindow) {
        focusedGroup.getWorldPosition(tmp.b);
        for (const y of [1.0, 1.6]) {
          tmp.q.set(root.position.x, y * v.scale, root.position.z);
          const seg = tmp.a.subVectors(tmp.b, cam);
          const k = THREE.MathUtils.clamp(tmp.q.clone().sub(cam).dot(seg) / seg.lengthSq(), 0, 1);
          if (tmp.q.distanceTo(seg.multiplyScalar(k).add(cam)) < 0.75) want = 0;
        }
      }
      v.fade = damp(v.fade, want, 7, dt);
      v.rig.material.uniforms.fade.value = v.fade;
      v.rig.shadow.material.opacity = Math.min(1, pal.shadow * 1.9) * v.fade;
      root.visible = inWindow && v.fade > 0.02;

      // ---- Footsteps.
      const step = Math.floor(v.phase / Math.PI);
      if (step !== v.step) {
        v.step = step;
        if (audio && root.visible && v.speed > 0.2) {
          tmp.q.copy(root.position).sub(cam);
          audio.footstep(tmp.q.normalize().dot(tmp.right), camDist, v.rig.hardShoes);
        }
      }
    }

    // ---- Voices follow the nearest talkers.
    if (audio) {
      audio.setListener(cam, tmp.fwd);
      tmp.talkClock -= dt;
      if (tmp.talkClock <= 0) {
        tmp.talkClock = 0.2;
        const talkers = [];
        for (const v of crowd) {
          if (!v.speaking || !v.rig.root.visible) continue;
          const p = v.rig.root.position;
          talkers.push({
            id: v.id,
            pos: { x: p.x, y: 1.6 * v.scale, z: p.z },
            pitch: v.pitch,
            level: v.role === "guide" ? 1.5 : 1,
            dist: Math.hypot(p.x - cam.x, p.z - cam.z),
          });
        }
        audio.assignTalkers(talkers);
      }
    }
  });

  return (
    <>
      {crowd.map((v) => (
        <primitive key={v.id} object={v.rig.root} />
      ))}
    </>
  );
}
