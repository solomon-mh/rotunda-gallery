import * as THREE from "three";
import { RI, RO, WALL_H, ART_Y, type Slot } from "./layout";

/*
 * The scene has no real lights — everything is shaded by hand so it stays cheap and
 * matches the flat-lit gallery look. `litMaterial` is the shared "solid object" shader
 * used for frames, light fixtures and visitors: a soft sky/ground fill, one key light
 * fixed in the object's own space, an optional metallic highlight, and a dithered fade.
 */

type LitOptions = {
  color?: THREE.ColorRepresentation;
  vertexColors?: boolean;
  /** 0 = matte paint/wood, 1 = gilded. */
  metal?: number;
  shininess?: number;
  exposure?: number;
  /** Key light direction in the object's local space. */
  key?: [number, number, number];
};

export type LitMaterial = THREE.ShaderMaterial & {
  uniforms: { fade: { value: number }; exposure: { value: number } };
};

export function litMaterial(o: LitOptions = {}): LitMaterial {
  const mat = new THREE.ShaderMaterial({
    fog: true,
    vertexColors: o.vertexColors ?? false,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uColor: { value: new THREE.Color() },
        metal: { value: 0 },
        shininess: { value: 24 },
        exposure: { value: 1 },
        fade: { value: 1 },
        keyDir: { value: new THREE.Vector3() },
      },
    ]),
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      uniform vec3 keyDir;
      varying vec3 vColor;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      varying vec3 vKey;
      void main() {
        #ifdef USE_COLOR
          vColor = color;
        #else
          vColor = vec3(1.0);
        #endif
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vKey = normalize(mat3(modelMatrix) * keyDir);
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float metal;
      uniform float shininess;
      uniform float exposure;
      uniform float fade;
      #include <common>
      #include <fog_pars_fragment>
      varying vec3 vColor;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      varying vec3 vKey;
      void main() {
        if (fade < 0.999) {
          // Screen-door fade: no transparency sorting between body parts.
          float noise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
          if (fade <= noise) discard;
        }
        vec3 n = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
        vec3 v = normalize(cameraPosition - vWorld);
        vec3 L = normalize(vKey);
        vec3 base = vColor * uColor;
        float sky = n.y * 0.5 + 0.5;
        float diff = max(dot(n, L), 0.0);
        float facing = clamp(dot(n, v), 0.0, 1.0);
        vec3 col = base * (mix(0.42, 0.62, sky) + 0.55 * diff) * mix(0.86, 1.0, facing);
        float nh = max(dot(n, normalize(L + v)), 0.0);
        float spec = pow(nh, shininess);
        // Gilding: a broad sheen plus a tight glint, tinted by the metal.
        float sheen = metal * (pow(nh, 4.0) * 0.45 + pow(nh, 60.0) * 1.2);
        col = mix(col, col * 0.7, metal * (1.0 - facing) * 0.6);
        col += vec3(0.07) * spec * (1.0 - metal) + base * 1.8 * sheen;
        gl_FragColor = vec4(col * exposure, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  }) as LitMaterial;
  // Set after merge — UniformsUtils.merge clones values.
  mat.uniforms.uColor.value = new THREE.Color(o.color ?? "#ffffff");
  mat.uniforms.metal.value = o.metal ?? 0;
  mat.uniforms.shininess.value = o.shininess ?? 24;
  mat.uniforms.exposure.value = o.exposure ?? 1;
  mat.uniforms.keyDir.value = new THREE.Vector3(...(o.key ?? [0, 0.75, 0.66])).normalize();
  return mat;
}

/* ------------------------------------------------------------------ frames */

/** One step of a moulding, listed from the picture outwards. */
type Ring = { w: number; d: number; color: string; metal?: number; mat?: boolean };

/** Frames chosen to suit each room of the hang. */
const GILT: Ring[] = [
  { w: 0.026, d: 0.05, color: "#e1c27a", metal: 1 },
  { w: 0.03, d: 0.075, color: "#6e5222", metal: 1 },
  { w: 0.1, d: 0.095, color: "#a8833f", metal: 1 },
  { w: 0.026, d: 0.07, color: "#d6b467", metal: 1 },
];
const FRAME_STYLES: Record<string, Ring[]> = {
  rebirth: GILT,
  "storm-and-gold": GILT,
  "quiet-light": [
    { w: 0.024, d: 0.05, color: "#b8954e", metal: 1 },
    { w: 0.125, d: 0.075, color: "#17140f" },
  ],
  "starry-nights": [
    { w: 0.07, d: 0.018, color: "#e2dacb" },
    { w: 0.075, d: 0.068, color: "#9a7046" },
  ],
  impressions: [
    { w: 0.026, d: 0.05, color: "#e2cb92", metal: 1 },
    { w: 0.1, d: 0.078, color: "#b39354", metal: 1 },
  ],
  "floating-world": [
    { w: 0.17, d: 0.006, color: "#f1ede3", mat: true },
    { w: 0.036, d: 0.048, color: "#1c1c1b" },
  ],
};
const DEFAULT_STYLE: Ring[] = [{ w: 0.06, d: 0.05, color: "#1c1c1b" }];

/** Total frame width around the picture for a slot (0 for collection wall text). */
export function frameWidth(s: Slot) {
  if (s.kind !== "art") return 0;
  return (FRAME_STYLES[s.collection.slug] ?? DEFAULT_STYLE).reduce((t, r) => t + r.w, 0);
}

/** A rectangular ring with a rounded (bevelled) profile, back face at z = 0. */
function ringGeometry(iw: number, ih: number, w: number, d: number, bevel: boolean) {
  const b = bevel ? Math.min(0.018, w * 0.35, d * 0.35) : 0;
  const ow = iw + 2 * w;
  const oh = ih + 2 * w;
  const rect = (hw: number, hh: number, path: THREE.Path) => {
    path.moveTo(-hw, -hh);
    path.lineTo(hw, -hh);
    path.lineTo(hw, hh);
    path.lineTo(-hw, hh);
    path.lineTo(-hw, -hh);
    return path;
  };
  // Bevels grow the solid by `b` on every contour, so start that much smaller.
  const shape = rect(ow / 2 - b, oh / 2 - b, new THREE.Shape()) as THREE.Shape;
  shape.holes.push(rect(iw / 2 + b, ih / 2 + b, new THREE.Path()));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, d - 2 * b),
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 3,
    curveSegments: 1,
  });
  geo.translate(0, 0, b);
  return geo;
}

export type FramePart = { geometry: THREE.BufferGeometry; material: THREE.Material; z: number };

/** Material cache so works sharing a moulding share its materials. */
export function frameMaterials(exposure: number) {
  const cache = new Map<string, THREE.Material>();
  return {
    get(r: Ring) {
      const k = `${r.color}|${r.metal ?? 0}`;
      let m = cache.get(k);
      if (!m) {
        m = litMaterial({ color: r.color, metal: r.metal ?? 0, shininess: 40, exposure: r.mat ? 1 : exposure });
        cache.set(k, m);
      }
      return m;
    },
    dispose: () => cache.forEach((m) => m.dispose()),
  };
}

/** Build the moulding around a work. The picture plane is at z = 0; the frame sits just behind it and stands proud. */
export function buildFrame(s: Slot, mats: ReturnType<typeof frameMaterials>): FramePart[] {
  if (s.kind !== "art") return [];
  const rings = FRAME_STYLES[s.collection.slug] ?? DEFAULT_STYLE;
  const parts: FramePart[] = [];
  let iw = s.w;
  let ih = s.h;
  for (const r of rings) {
    parts.push({ geometry: ringGeometry(iw, ih, r.w, r.d, !r.mat), material: mats.get(r), z: r.mat ? 0 : -0.025 });
    iw += 2 * r.w;
    ih += 2 * r.w;
  }
  return parts;
}

/* ------------------------------------------------------------------ lighting */

/** Radius of the ceiling track that lights each wall. */
export const TRACK_R = { outer: RO - 1.85, inner: RI + 1.5 } as const;
const TRACK_Y = WALL_H - 0.04;

/** Shared geometry for a track spot: a short stem and a can that points along +z. */
export function fixtureGeometry() {
  const stem = new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8);
  stem.translate(0, -0.1, 0);
  const can = new THREE.CylinderGeometry(0.055, 0.065, 0.22, 16);
  can.rotateX(Math.PI / 2);
  const track = (r: number) => new THREE.TorusGeometry(r, 0.022, 6, 240).rotateX(Math.PI / 2).translate(0, TRACK_Y, 0);
  return { stem, can, tracks: [track(TRACK_R.outer), track(TRACK_R.inner)] };
}

/** Where the spot for a slot hangs (in the slot's local frame: +z out of the wall, y up from the hang line). */
export function fixturePose(s: Slot, distFromWall: number) {
  const top = TRACK_Y - ART_Y;
  const stem = new THREE.Vector3(0, top, distFromWall);
  const canPos = new THREE.Vector3(0, top - 0.22, distFromWall);
  const aim = new THREE.Vector3(0, s.kind === "art" ? 0.1 : 0.4, 0).sub(canPos).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), aim);
  return { stem, canPos, q };
}

/**
 * The wall wash behind a work, as a strip of the wall's own curve (a flat plane would
 * sink into the concave wall or float off the convex one).
 */
export function poolGeometry(s: Slot) {
  const fw = frameWidth(s);
  const outer = s.wall === "outer";
  const R = outer ? RO - 0.01 : RI + 0.01;
  const width = s.w + 2 * fw + (s.kind === "art" ? 1.9 : 1.2);
  const height = s.h + 2 * fw + 2.4;
  const span = width / R;
  const g = new THREE.CylinderGeometry(R, R, height, 24, 1, true, -span / 2, span);
  g.translate(0, ART_Y + 0.45, 0);
  return g;
}
