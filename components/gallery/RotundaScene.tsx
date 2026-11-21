import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { TransitionRect } from "@/lib/store";
import { ART_Y, FOCUS, RI, RO, VISIBLE, WALL_H, basePose, scrollFor, wrap, type Slot } from "./layout";
import {
  PALETTES,
  archTexture,
  ceilingTexture,
  floorTexture,
  labelTexture,
  loadFonts,
  placardTexture,
  shadowTexture,
  wallTexture,
} from "./textures";

export type SceneHandle = {
  next: () => void;
  prev: () => void;
  unfocus: () => void;
};

type Props = {
  ref?: React.Ref<SceneHandle>;
  slots: Slot[];
  period: number;
  paused: boolean;
  initialScroll: number;
  autoWalk: boolean;
  showLabels: boolean;
  highQuality: boolean;
  dark: boolean;
  onCurrent: (slotIndex: number) => void;
  onHover: (kind: "art" | "placard" | null) => void;
  onFocused: (slug: string, rect: TransitionRect) => void;
  onPlacard: (collectionSlug: string) => void;
  onProgress: (loaded: number, total: number) => void;
  onScrollChange: (scroll: number) => void;
};

type Mode = "idle" | "focusing" | "focused" | "returning";

type Ctl = {
  scroll: number;
  target: number;
  mode: Mode;
  hover: number;
  pointer: { x: number; y: number };
  lastInput: number;
  dragging: boolean;
  unfocusRequest: boolean;
};

const LABEL_W = 1.15;
const LABEL_H = (LABEL_W * 260) / 720;
const SHADOW_INNER = 176 / 256;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (a: number, b: number, lambda: number, dt: number) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
/** Angle of a slot relative to the visitor (+ = ahead) for a given walk position. */
const angleOf = (s: Slot, scroll: number, period: number) => wrap(s.a - scroll / RO, period);

export default function RotundaScene(props: Props) {
  const ctl = useRef<Ctl>({
    scroll: props.initialScroll - 6,
    target: props.initialScroll,
    mode: "idle",
    hover: -1,
    pointer: { x: 0, y: 0 },
    lastInput: 0,
    dragging: false,
    unfocusRequest: false,
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const { slots, period } = props;

  // The work nearest its wall's focus point — used by prev/next.
  const nearestArt = () => {
    let best = -1;
    let bestD = Infinity;
    slots.forEach((s, i) => {
      if (s.kind !== "art") return;
      const d = Math.abs(angleOf(s, ctl.current.target, period) - FOCUS[s.wall]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  const step = (dir: 1 | -1) => {
    const c = ctl.current;
    if (c.mode !== "idle") return;
    let i = nearestArt();
    for (let k = 0; k < slots.length; k++) {
      i = (i + dir + slots.length) % slots.length;
      if (slots[i].kind === "art") break;
    }
    const desired = scrollFor(slots[i]);
    const P = period * RO;
    c.target = c.target + wrap(desired - c.target, P);
    c.lastInput = performance.now();
  };

  useImperativeHandle(props.ref, () => ({
    next: () => step(1),
    prev: () => step(-1),
    unfocus: () => {
      ctl.current.unfocusRequest = true;
    },
  }));

  // Wheel, drag, keyboard — the visitor's walk.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const c = ctl.current;
    let startX = 0;
    let lastX = 0;
    let downId: number | null = null;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (c.mode !== "idle") return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const unit = e.deltaMode === 1 ? 33 : 1;
      c.target += THREE.MathUtils.clamp(delta * unit * 0.009, -2.8, 2.8);
      c.lastInput = performance.now();
    };
    const onDown = (e: PointerEvent) => {
      if (c.mode !== "idle" || e.button !== 0) return;
      downId = e.pointerId;
      startX = lastX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      c.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      c.pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      if (downId !== e.pointerId) return;
      if (!c.dragging && Math.abs(e.clientX - startX) > 6) {
        c.dragging = true;
        el.classList.add("is-dragging");
      }
      if (c.dragging) {
        const k = e.pointerType === "touch" ? 0.024 : 0.016;
        c.target += (e.clientX - lastX) * k;
        c.lastInput = performance.now();
      }
      lastX = e.clientX;
    };
    const onUp = (e: PointerEvent) => {
      if (downId !== e.pointerId) return;
      downId = null;
      // Let the click handler see the drag flag first.
      requestAnimationFrame(() => {
        c.dragging = false;
        el.classList.remove("is-dragging");
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (props.paused) return;
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") step(1);
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") step(-1);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.paused]);

  useEffect(() => {
    const c = ctl.current;
    return () => props.onScrollChange(c.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} className="rotunda-canvas">
      <Canvas
        flat
        dpr={props.highQuality ? [1, 2] : [1, 1.2]}
        frameloop={props.paused ? "never" : "always"}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 62, near: 0.05, far: 80, position: [0, 2, 10.15] }}
      >
        <Corridor {...props} ctl={ctl} />
      </Canvas>
    </div>
  );
}

/**
 * Gallery-wall material: the plaster texture, shaded only by how squarely the wall
 * faces you — surfaces turned toward the visitor read pure white, and the curve
 * greys softly as it bends away (the look of the walls in the video). No scene lights needed.
 */
function wallMaterial(map: THREE.Texture, side: THREE.Side, grazing: number) {
  const mat = new THREE.ShaderMaterial({
    side,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: null }, grazing: { value: grazing } }]),
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform float grazing;
      #include <common>
      #include <fog_pars_fragment>
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
        float facing = clamp(dot(n, normalize(vView)), 0.0, 1.0);
        vec3 col = texture2D(map, vUv).rgb * mix(grazing, 1.0, pow(facing, 0.55));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  mat.uniforms.map.value = map; // set after merge — UniformsUtils.merge clones values
  return mat;
}

/** Polar interpolation around the ring keeps camera moves inside the corridor (never through the inner wall). */
function lerpRing(out: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const angA = Math.atan2(a.x, a.z);
  const angB = Math.atan2(b.x, b.z);
  let dAng = angB - angA;
  if (dAng > Math.PI) dAng -= Math.PI * 2;
  if (dAng < -Math.PI) dAng += Math.PI * 2;
  const rA = Math.hypot(a.x, a.z);
  const rB = Math.hypot(b.x, b.z);
  const ang = angA + dAng * t;
  const r = THREE.MathUtils.lerp(rA, rB, t);
  return out.set(Math.sin(ang) * r, THREE.MathUtils.lerp(a.y, b.y, t), Math.cos(ang) * r);
}

function Corridor({
  slots,
  period,
  ctl,
  autoWalk,
  showLabels,
  dark,
  onCurrent,
  onHover,
  onFocused,
  onPlacard,
  onProgress,
}: Props & { ctl: React.RefObject<Ctl> }) {
  const pal = PALETTES[dark ? "dark" : "light"];
  const { gl, camera } = useThree();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const lifts = useRef<number[]>(slots.map(() => 0));
  const brightness = useRef<number[]>(slots.map(() => 0));
  const loaded = useRef<boolean[]>(slots.map(() => false));
  const currentRef = useRef(-1);
  const camPos = useRef(new THREE.Vector3(0, 2, 8.75));
  const camLook = useRef(new THREE.Vector3(10, 2, 8.75));
  const parallax = useRef({ x: 0, y: 0 });
  const tween = useRef<{
    fromPos: THREE.Vector3;
    fromLook: THREE.Vector3;
    toPos: THREE.Vector3;
    toLook: THREE.Vector3;
    t0: number;
    dur: number;
    done: () => void;
  } | null>(null);

  const tex = useMemo(
    () => ({
      wall: wallTexture(pal),
      floor: floorTexture(RI / RO, pal),
      ceiling: ceilingTexture(RI / RO, pal),
      shadow: shadowTexture(),
      arch: archTexture(pal),
    }),
    [pal],
  );
  const plane = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const wallMats = useMemo(
    () => ({ outer: wallMaterial(tex.wall, THREE.BackSide, pal.grazing[0]), inner: wallMaterial(tex.wall, THREE.FrontSide, pal.grazing[1]) }),
    [tex.wall, pal],
  );
  const shadowMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: tex.shadow, transparent: true, opacity: pal.shadow, depthWrite: false, toneMapped: false }),
    [tex.shadow, pal],
  );
  const archMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: tex.arch, transparent: true, depthWrite: false, toneMapped: false }),
    [tex.arch],
  );
  const artMats = useMemo(
    () => slots.map((s) => new THREE.MeshBasicMaterial({ color: s.kind === "art" ? "#dcdcda" : "#f6f6f5", toneMapped: false })),
    [slots],
  );
  const labelMats = useMemo(
    () => slots.map(() => new THREE.MeshBasicMaterial({ color: "#f8f8f7", toneMapped: false, transparent: true, opacity: 0 })),
    [slots],
  );

  // Paintings: load textures progressively.
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    const total = slots.filter((s) => s.kind === "art").length;
    let count = 0;
    let cancelled = false;
    const textures: THREE.Texture[] = [];
    onProgress(0, total);
    slots.forEach((s, i) => {
      if (s.kind !== "art") return;
      loader.load(
        s.art.texture,
        (t) => {
          if (cancelled) return t.dispose();
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = maxAniso;
          textures.push(t);
          artMats[i].map = t;
          artMats[i].needsUpdate = true;
          loaded.current[i] = true;
          onProgress(++count, total);
        },
        undefined,
        () => onProgress(++count, total),
      );
    });
    return () => {
      cancelled = true;
      textures.forEach((t) => t.dispose());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, artMats, gl]);

  // Captions & placards are drawn on canvas once the web fonts are ready.
  useEffect(() => {
    let cancelled = false;
    const made: THREE.Texture[] = [];
    loadFonts().then((fonts) => {
      if (cancelled) return;
      slots.forEach((s, i) => {
        if (s.kind === "art") {
          const t = labelTexture(s.art, s.collection, fonts, pal);
          made.push(t);
          labelMats[i].map = t;
          labelMats[i].color.set("#ffffff");
          labelMats[i].opacity = 1;
          labelMats[i].needsUpdate = true;
        } else {
          const t = placardTexture(s.collection, s.count, fonts, pal);
          made.push(t);
          artMats[i].map = t;
          artMats[i].color.set("#ffffff");
          artMats[i].needsUpdate = true;
        }
      });
    });
    return () => {
      cancelled = true;
      made.forEach((t) => t.dispose());
    };
  }, [slots, labelMats, artMats, pal]);

  useEffect(
    () => () => {
      Object.values(tex).forEach((t) => t.dispose());
      plane.dispose();
      shadowMat.dispose();
      archMat.dispose();
      wallMats.outer.dispose();
      wallMats.inner.dispose();
      artMats.forEach((m) => m.dispose());
      labelMats.forEach((m) => m.dispose());
    },
    [tex, plane, shadowMat, archMat, wallMats, artMats, labelMats],
  );

  const startTween = (toPos: THREE.Vector3, toLook: THREE.Vector3, dur: number, done: () => void) => {
    tween.current = { fromPos: camPos.current.clone(), fromLook: camLook.current.clone(), toPos, toLook, t0: performance.now(), dur, done };
  };

  const focus = (i: number) => {
    const c = ctl.current!;
    const slot = slots[i];
    const g = groups.current[i];
    if (!g || slot.kind !== "art" || c.mode !== "idle") return;
    c.mode = "focusing";
    c.target = c.scroll; // stop walking
    c.hover = -1;
    onHover(null);

    const cam = camera as THREE.PerspectiveCamera;
    g.updateWorldMatrix(true, false);
    const P = new THREE.Vector3();
    g.getWorldPosition(P);
    // The painting's facing direction (into the corridor).
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(g.matrixWorld).setY(0).normalize();
    const aspect = gl.domElement.clientWidth / Math.max(1, gl.domElement.clientHeight);
    const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const narrow = aspect < 0.9;
    const hFrac = narrow ? 0.42 : 0.6;
    const wFrac = narrow ? 0.8 : 0.4;
    const ideal = Math.max(slot.h / (hFrac * 2 * tan), slot.w / (wFrac * 2 * tan * aspect));
    const d = Math.min(ideal, RO - RI - 0.5); // stay inside the corridor
    const toPos = P.clone().addScaledVector(normal, d);
    toPos.y = ART_Y;
    startTween(toPos, P.clone(), 1150, () => {
      c.mode = "focused";
      // Project the painting's corners to get its exact on-screen rectangle.
      const rect = gl.domElement.getBoundingClientRect();
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (const sx of [-0.5, 0.5])
        for (const sy of [-0.5, 0.5]) {
          const v = g.localToWorld(new THREE.Vector3(sx * slot.w, sy * slot.h, 0)).project(cam);
          const px = rect.left + ((v.x + 1) / 2) * rect.width;
          const py = rect.top + ((1 - v.y) / 2) * rect.height;
          x0 = Math.min(x0, px);
          x1 = Math.max(x1, px);
          y0 = Math.min(y0, py);
          y1 = Math.max(y1, py);
        }
      onFocused(slot.art.slug, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    });
  };

  const unfocus = () => {
    const c = ctl.current!;
    if (c.mode === "idle" || c.mode === "returning") return;
    c.mode = "returning";
    const aspect = gl.domElement.clientWidth / Math.max(1, gl.domElement.clientHeight);
    const bp = basePose(aspect);
    startTween(new THREE.Vector3(bp.pos.x, bp.pos.y, bp.pos.z), new THREE.Vector3(bp.look.x, bp.look.y, bp.look.z), 1000, () => {
      c.mode = "idle";
    });
  };

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const c = ctl.current!;
    const now = performance.now();
    const cam = state.camera as THREE.PerspectiveCamera;

    if (c.unfocusRequest) {
      c.unfocusRequest = false;
      unfocus();
    }

    // Walk.
    if (c.mode === "idle") {
      if (autoWalk && !c.dragging && now - c.lastInput > 2500) c.target += dt * 0.5;
      c.scroll = damp(c.scroll, c.target, c.dragging ? 12 : 4.2, dt);
    }

    // Camera.
    const aspect = state.size.width / Math.max(1, state.size.height);
    const bp = basePose(aspect);
    if (Math.abs(cam.fov - bp.fov) > 0.01) {
      cam.fov = bp.fov;
      cam.updateProjectionMatrix();
    }
    if (tween.current) {
      const tw = tween.current;
      const p = Math.min(1, (now - tw.t0) / tw.dur);
      const e = easeInOut(p);
      lerpRing(camPos.current, tw.fromPos, tw.toPos, e);
      camLook.current.lerpVectors(tw.fromLook, tw.toLook, e);
      if (p >= 1) {
        tween.current = null;
        tw.done();
      }
    } else if (c.mode === "idle") {
      // A gentle head-turn toward the cursor.
      parallax.current.x = damp(parallax.current.x, c.pointer.x, 2.2, dt);
      parallax.current.y = damp(parallax.current.y, c.pointer.y, 2.2, dt);
      camPos.current.set(bp.pos.x, bp.pos.y, bp.pos.z);
      camLook.current.set(bp.look.x, bp.look.y + parallax.current.y * 0.3, bp.look.z + parallax.current.x * 0.7);
    }
    cam.position.copy(camPos.current);
    cam.lookAt(camLook.current);

    // Hang the works on both walls.
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < slots.length; i++) {
      const g = groups.current[i];
      if (!g) continue;
      const s = slots[i];
      const theta = angleOf(s, c.scroll, period);
      const [lo, hi] = VISIBLE[s.wall];
      const visible = theta > lo && theta < hi;
      g.visible = visible;
      if (s.kind === "art") {
        const d = Math.abs(theta - FOCUS[s.wall]) + (s.wall === "inner" ? 0.15 : 0);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
        if (loaded.current[i] && brightness.current[i] < 1) {
          brightness.current[i] = Math.min(1, brightness.current[i] + dt * 1.6);
          const v = THREE.MathUtils.lerp(0.86, 1, brightness.current[i]);
          artMats[i].color.setRGB(v, v, v);
        }
      }
      if (!visible) continue;
      const lift = (lifts.current[i] = damp(lifts.current[i], c.hover === i ? 0.16 : 0, 9, dt));
      if (s.wall === "outer") {
        // Concave wall: pull flat panels in so their edges don't sink into the curve.
        const r = RO - 0.12 - (s.w * s.w) / (8 * RO) - lift;
        g.position.set(r * Math.sin(theta), ART_Y, r * Math.cos(theta));
        g.rotation.y = theta + Math.PI;
      } else {
        const r = RI + 0.06 + lift;
        g.position.set(r * Math.sin(theta), ART_Y, r * Math.cos(theta));
        g.rotation.y = theta;
      }
    }
    if (best !== currentRef.current && best >= 0) {
      currentRef.current = best;
      onCurrent(best);
    }
  });

  const over = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const c = ctl.current!;
    if (c.mode !== "idle" || c.dragging) return;
    c.hover = i;
    onHover(slots[i].kind);
  };
  const out = (i: number) => () => {
    const c = ctl.current!;
    if (c.hover === i) {
      c.hover = -1;
      onHover(null);
    }
  };
  const click = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const c = ctl.current!;
    if (c.dragging || e.delta > 6 || c.mode !== "idle") return;
    const s = slots[i];
    if (s.kind === "art") focus(i);
    else onPlacard(s.collection.slug);
  };

  return (
    <>
      <color attach="background" args={[pal.bg]} />
      <fog attach="fog" args={[pal.fog, 10, 38]} />

      {/* Outer wall (seen from inside) and inner wall (seen from outside). */}
      <mesh position={[0, WALL_H / 2, 0]} material={wallMats.outer}>
        <cylinderGeometry args={[RO, RO, WALL_H, 240, 1, true]} />
      </mesh>
      <mesh position={[0, WALL_H / 2, 0]} material={wallMats.inner}>
        <cylinderGeometry args={[RI, RI, WALL_H, 200, 1, true]} />
      </mesh>
      {/* Floor & ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[RO + 0.01, 200]} />
        <meshBasicMaterial map={tex.floor} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_H, 0]}>
        <circleGeometry args={[RO + 0.01, 200]} />
        <meshBasicMaterial map={tex.ceiling} toneMapped={false} />
      </mesh>

      {slots.map((s, i) => (
        <group key={s.key} ref={(el) => void (groups.current[i] = el)} visible={false}>
          {s.wall === "outer" && (
            <mesh
              geometry={plane}
              material={archMat}
              position={[0, (s.h / 2 + 0.75 - ART_Y) / 2, -0.06]}
              scale={[s.w + 0.8, s.h / 2 + 0.75 + ART_Y, 1]}
              renderOrder={-1}
            />
          )}
          <mesh
            geometry={plane}
            material={shadowMat}
            position={[0.07, -0.1, -0.015]}
            scale={[s.w / SHADOW_INNER, s.h / SHADOW_INNER, 1]}
          />
          <mesh geometry={plane} material={artMats[i]} scale={[s.w, s.h, 1]} onPointerOver={over(i)} onPointerOut={out(i)} onClick={click(i)} />
          {s.kind === "art" && (
            <mesh
              geometry={plane}
              material={labelMats[i]}
              visible={showLabels}
              position={[-s.w / 2 + LABEL_W / 2, -s.h / 2 - 0.2 - LABEL_H / 2, 0.002]}
              scale={[LABEL_W, LABEL_H, 1]}
            />
          )}
        </group>
      ))}
    </>
  );
}
