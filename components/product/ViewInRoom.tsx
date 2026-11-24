import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import type { Artwork } from "@/lib/artworks";
import { FRAME_COLORS, SIZES, formatPrice, type FrameId, type PrintOptions } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { ChevronDown, CloseIcon } from "../icons";

/*
 * The room is modelled in centimetres: a 500 × 325 cm slice of wall and floor,
 * bottom-aligned in the viewport. The wall simply continues beyond it, so the
 * scene fills the whole pop-up at any aspect ratio — no letterboxing.
 */
const ROOM_W = 500;
const ROOM_H = 325;
const FLOOR_Y = 252; // where the wall meets the skirting
const SNAP = 4; // cm
const PANEL_W = 300; // floating panel width (desktop) — the room centres in the space left of it
const CLOSE_ZONE = 58; // px: the close button (14px inset + 36px) plus a little breathing room

const WALLS = [
  { id: "plaster", label: "Warm plaster", hex: "#e8e2d8" },
  { id: "white", label: "Gallery white", hex: "#f2f1ed" },
  { id: "sage", label: "Sage", hex: "#c7cfbe" },
  { id: "clay", label: "Terracotta", hex: "#c98f73" },
  { id: "ink", label: "Ink blue", hex: "#2d3540" },
];

type RoomId = "living" | "bedroom" | "study";
const ROOMS: { id: RoomId; label: string; top: number; note: string }[] = [
  { id: "living", label: "Living", top: FLOOR_Y - 86, note: "Sofa 210 cm wide" },
  { id: "bedroom", label: "Bedroom", top: FLOOR_Y - 118, note: "Bed 160 cm wide" },
  { id: "study", label: "Study", top: FLOOR_Y - 80, note: "Console 140 cm wide" },
];

const FRAME_OPTS: { id: FrameId; label: string }[] = [
  { id: "unframed", label: "None" },
  { id: "classic", label: "Classic" },
  { id: "canvas", label: "Canvas" },
];

type Props = {
  art: Artwork;
  options: PrintOptions;
  price: number;
  onOptions: (patch: Partial<PrintOptions>) => void;
  onAdd: () => void;
  onClose: () => void;
};

/** Frame build-up in cm around the printed image. */
function frameParts(o: PrintOptions) {
  if (o.frame === "classic") return { frame: 2.6, mat: o.size === "a3" ? 4 : 6 };
  if (o.frame === "canvas") return { frame: 2.2, mat: 0 };
  return { frame: 0, mat: 1.6 }; // unframed: white paper border
}

export default function ViewInRoom({ art, options, price, onOptions, onAdd, onClose }: Props) {
  const currency = useStore((s) => s.currency);
  const [mounted, setMounted] = useState(false);
  const [wall, setWall] = useState(WALLS[0]);
  const [room, setRoom] = useState(ROOMS[0]);
  const [view, setView] = useState({ w: 1200, h: 800 });
  const [dragging, setDragging] = useState(false);
  const [snapX, setSnapX] = useState(false);
  // Minimised: the panel folds into a slim bar so the whole wall is free to hang on.
  const [collapsed, setCollapsed] = useState(false);
  const [reflowing, setReflowing] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);

  // Viewport → room mapping.
  const desktop = view.w > 900;
  const usableW = view.w - (desktop && !collapsed ? PANEL_W + 24 : 0);
  const scale = Math.min(view.h / ROOM_H, usableW / (ROOM_W * 0.74));
  const originX = usableW / 2 - (ROOM_W / 2) * scale;
  const originY = view.h - ROOM_H * scale - (desktop ? 0 : 0);
  const X = (cm: number) => originX + cm * scale;
  const Y = (cm: number) => originY + cm * scale;
  const px = (cm: number) => cm * scale;
  // Visible wall in cm (the part not under the panel).
  const visMinX = -originX / scale;
  const visMaxX = (usableW - originX) / scale;
  const visMinY = -originY / scale;

  const size = SIZES.find((s) => s.id === options.size)!;
  const aspect = art.width / art.height;
  const long = size.cm[1] * 0.92;
  const imgW = aspect >= 1 ? long : long * aspect;
  const imgH = aspect >= 1 ? long / aspect : long;
  const { frame, mat } = frameParts(options);
  const outW = imgW + 2 * (frame + mat);
  const outH = imgH + 2 * (frame + mat);
  const frameHex = FRAME_COLORS.find((c) => c.id === options.frameColor)!.hex;

  // The close button sits over the wall's top-right corner unless the full panel is beside it.
  const closeOverWall = !(desktop && !collapsed);
  const clamp = useCallback(
    (p: { x: number; y: number }) => {
      const x = Math.min(visMaxX - outW / 2 - 6, Math.max(visMinX + outW / 2 + 6, p.x));
      let y = Math.max(visMinY + outH / 2 + 8, p.y);
      // Tuck the print under the close button rather than behind it, so it can always be grabbed.
      const cz = CLOSE_ZONE / scale;
      if (closeOverWall && x + outW / 2 > visMaxX - cz) y = Math.max(y, visMinY + cz + outH / 2);
      return { x, y: Math.min(FLOOR_Y - outH / 2 - 4, y) };
    },
    [outW, outH, visMinX, visMaxX, visMinY, scale, closeOverWall],
  );
  const defaultPos = useCallback(
    (r = room) => clamp({ x: ROOM_W / 2, y: r.top - 22 - outH / 2 }),
    [room, outH, clamp],
  );
  const [pos, setPos] = useState(() => ({ x: ROOM_W / 2, y: ROOMS[0].top - 22 - outH / 2 }));

  // Keep the print on the visible wall whenever its size or the viewport changes.
  useEffect(() => setPos((p) => clamp(p)), [clamp]);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useLayoutEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const measure = () => setView({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [mounted]);

  const toCm = (clientX: number, clientY: number) => {
    const r = sceneRef.current!.getBoundingClientRect();
    return { x: (clientX - r.left - originX) / scale, y: (clientY - r.top - originY) / scale };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = toCm(e.clientX, e.clientY);
    drag.current = { id: e.pointerId, dx: pos.x - p.x, dy: pos.y - p.y };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    const p = toCm(e.clientX, e.clientY);
    let next = clamp({ x: p.x + drag.current.dx, y: p.y + drag.current.dy });
    const snapped = Math.abs(next.x - ROOM_W / 2) < SNAP;
    if (snapped) next = { ...next, x: ROOM_W / 2 };
    setSnapX(snapped);
    setPos(next);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    setSnapX(false);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    setPos((p) => clamp({ x: p.x + d[0], y: p.y + d[1] }));
  };

  const toggleCollapsed = () => {
    setCollapsed((c) => !c);
    // Let the room glide to its new layout rather than jump.
    setReflowing(true);
  };
  useEffect(() => {
    if (!reflowing) return;
    const t = setTimeout(() => setReflowing(false), 480);
    return () => clearTimeout(t);
  }, [reflowing]);
  // The toggle is re-rendered in a new place; keep keyboard focus on it.
  const toggled = useRef(false);
  useEffect(() => {
    if (toggled.current) toggleRef.current?.focus();
    toggled.current = true;
  }, [collapsed]);

  const pickRoom = (r: (typeof ROOMS)[number]) => {
    setRoom(r);
    setPos(defaultPos(r));
  };

  const dark = wall.id === "ink" || wall.id === "clay";
  const heightFromFloor = Math.round(FLOOR_Y - pos.y);

  if (!mounted) return null;
  return createPortal(
    <div className="room-root" role="dialog" aria-modal="true" aria-label={`${art.title} in a room`}>
      <motion.div className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div
        className="room"
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          ref={sceneRef}
          className={`room__scene${dark ? " is-dark" : ""}${dragging ? " is-dragging" : ""}${reflowing ? " is-reflowing" : ""}`}
          style={{ ["--wall" as string]: wall.hex }}
        >
          <div className="room__wall" style={{ height: Y(FLOOR_Y) }} />
          {/* Picture light: a soft pool of light that follows the print. */}
          <div
            className="room__glow"
            style={{ left: X(pos.x), top: Y(pos.y - outH / 2 - 10), width: px(outW * 2.4), height: px(outH * 2.2) }}
          />
          <div className="room__floor" style={{ top: Y(FLOOR_Y + 3), ["--plank" as string]: `${px(19)}px`, ["--eye" as string]: `${px(150)}px` }}>
            <div className="room__floor-plane">{room.id !== "study" && <div className={`room__rug room__rug--${room.id}`} />}</div>
            <div className="room__floor-shade" />
          </div>
          <div className="room__skirting" style={{ top: Y(FLOOR_Y - 5), height: px(8) }} />

          <Furniture room={room.id} X={X} Y={Y} px={px} />

          {snapX && <div className="room__guide" style={{ left: X(ROOM_W / 2), height: Y(FLOOR_Y) }} />}

          <div
            className={`room__art room__art--${options.frame}`}
            role="slider"
            tabIndex={0}
            aria-label="Print position on the wall. Drag, or use the arrow keys to move it."
            aria-valuetext={`${heightFromFloor} cm from the floor`}
            aria-valuenow={heightFromFloor}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            onDoubleClick={() => setPos(defaultPos())}
            style={{
              left: X(pos.x - outW / 2),
              top: Y(pos.y - outH / 2),
              width: px(outW),
              height: px(outH),
              padding: px(frame),
              ["--frame" as string]: frameHex,
            }}
          >
            <div className="room__mat" style={{ padding: px(mat) }}>
              <div className="room__img" style={{ backgroundImage: `url(${art.texture})` }} />
            </div>
            <span className="room__dims mono-xxs">
              {Math.round(outW)} × {Math.round(outH)} cm · {heightFromFloor} cm up
            </span>
          </div>

          <p className="room__hint mono-xxs">
            <span className="room__hint-dot" aria-hidden="true" /> Drag the print anywhere · double-click to re-centre
          </p>
          <p className="room__note mono-xxs" style={desktop && collapsed ? { left: 16 } : { right: desktop ? PANEL_W + 40 : 14 }}>
            {room.note}
          </p>
        </div>

        <button className="room__close" onClick={onClose} aria-label="Close room view">
          <CloseIcon size={16} />
        </button>

        <aside className={`room__panel${collapsed ? " is-collapsed" : ""}`} aria-label="Print options">
          {collapsed ? (
            <div className="room__mini">
              <div className="room__mini-id">
                <p className="mono-xxs muted room__mini-title">{art.title}</p>
                <p className="display room__mini-price">{formatPrice(price, currency)}</p>
              </div>
              <button className="btn btn--black" onClick={onAdd}>
                Add to bag
              </button>
              <button ref={toggleRef} className="room__fold room__fold--open" onClick={toggleCollapsed} aria-expanded={false} aria-label="Show print options">
                <span className="mono-xxs">Options</span>
                <ChevronDown size={13} />
              </button>
            </div>
          ) : (
            <>
              <button ref={toggleRef} className="room__fold" onClick={toggleCollapsed} aria-expanded={true} aria-label="Minimise options to move the print freely" title="Minimise">
                <ChevronDown size={15} />
              </button>
              <div className="room__id">
                <p className="mono-xxs muted">View in room</p>
                <h2 className="display room__title">{art.title}</h2>
                <p className="serif room__artist">
                  {art.artist}, {art.year}
                </p>
              </div>

              <div className="room__row">
                <span className="mono-xxs muted">Room</span>
                <div className="seg">
                  {ROOMS.map((r) => (
                    <button key={r.id} className={r.id === room.id ? "is-on" : ""} onClick={() => pickRoom(r)} aria-pressed={r.id === room.id}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="room__row">
                <span className="mono-xxs muted">Size</span>
                <div className="seg">
                  {SIZES.map((s) => (
                    <button
                      key={s.id}
                      className={s.id === options.size ? "is-on" : ""}
                      onClick={() => onOptions({ size: s.id })}
                      aria-pressed={s.id === options.size}
                      title={s.label}
                    >
                      {s.id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="room__row">
                <span className="mono-xxs muted">Frame</span>
                <div className="seg">
                  {FRAME_OPTS.map((f) => (
                    <button key={f.id} className={f.id === options.frame ? "is-on" : ""} onClick={() => onOptions({ frame: f.id })} aria-pressed={f.id === options.frame}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="room__swatches">
                <div>
                  <span className="mono-xxs muted">Wall</span>
                  <div className="room__dots">
                    {WALLS.map((w) => (
                      <button
                        key={w.id}
                        className={`dot-swatch${w.id === wall.id ? " is-on" : ""}`}
                        style={{ background: w.hex }}
                        onClick={() => setWall(w)}
                        aria-label={`${w.label} wall`}
                        title={w.label}
                      />
                    ))}
                  </div>
                </div>
                <div className={options.frame === "unframed" ? "is-disabled" : undefined}>
                  <span className="mono-xxs muted">Finish</span>
                  <div className="room__dots">
                    {FRAME_COLORS.map((c) => (
                      <button
                        key={c.id}
                        className={`dot-swatch${c.id === options.frameColor && options.frame !== "unframed" ? " is-on" : ""}`}
                        style={{ background: c.hex }}
                        onClick={() => onOptions({ frameColor: c.id, frame: options.frame === "unframed" ? "classic" : options.frame })}
                        aria-label={`${c.label} frame`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="room__buy">
                <div>
                  <p className="display room__price">{formatPrice(price, currency)}</p>
                  <p className="mono-xxs muted">{size.short}</p>
                </div>
                <button className="btn btn--black" onClick={onAdd}>
                  Add to bag
                </button>
              </div>
            </>
          )}
        </aside>
      </motion.div>
    </div>,
    document.body,
  );
}

type Mapper = (cm: number) => number;

/** Furniture drawn in centimetres (1 SVG unit = 1 cm), standing on the floor line. */
function Furniture({ room, X, Y, px }: { room: RoomId; X: Mapper; Y: Mapper; px: Mapper }) {
  const place = (w: number, h: number, x: number) => ({
    left: X(x - w / 2),
    top: Y(FLOOR_Y + 4 - h),
    width: px(w),
    height: px(h),
  });

  if (room === "bedroom") {
    return (
      <>
        <svg className="room__furn" viewBox="0 0 220 122" style={place(220, 122, ROOM_W / 2)} aria-hidden="true">
          <ellipse cx="110" cy="119" rx="108" ry="3" fill="rgba(0,0,0,.22)" />
          <rect x="22" y="0" width="176" height="96" rx="6" fill="#b7a58e" />
          <rect x="28" y="6" width="164" height="84" rx="4" fill="#c4b39c" />
          <rect x="30" y="62" width="160" height="40" rx="5" fill="#f1eee8" />
          <rect x="30" y="74" width="160" height="32" rx="4" fill="#8e9b8a" />
          <rect x="40" y="48" width="62" height="22" rx="9" fill="#faf8f4" />
          <rect x="118" y="48" width="62" height="22" rx="9" fill="#faf8f4" />
          <rect x="26" y="104" width="168" height="12" rx="2" fill="#6f5c47" />
          <rect x="30" y="116" width="5" height="4" fill="#3b3128" />
          <rect x="185" y="116" width="5" height="4" fill="#3b3128" />
        </svg>
        {[-1, 1].map((side) => (
          <svg key={side} className="room__furn" viewBox="0 0 50 110" style={place(50, 110, ROOM_W / 2 + side * 145)} aria-hidden="true">
            <ellipse cx="25" cy="108" rx="24" ry="2" fill="rgba(0,0,0,.2)" />
            <rect x="2" y="56" width="46" height="50" rx="2" fill="#8a6a4d" />
            <rect x="6" y="66" width="38" height="2" fill="#6f533b" />
            <rect x="22" y="30" width="6" height="26" fill="#c9b79b" />
            <path d="M10 30 L40 30 L34 6 L16 6 Z" fill="#f3ead9" />
            <ellipse cx="25" cy="30" rx="15" ry="2" fill="rgba(0,0,0,.1)" />
          </svg>
        ))}
      </>
    );
  }

  if (room === "study") {
    return (
      <>
        <svg className="room__furn" viewBox="0 -30 140 114" style={place(140, 114, ROOM_W / 2)} aria-hidden="true">
          <ellipse cx="70" cy="82" rx="68" ry="2.5" fill="rgba(0,0,0,.2)" />
          <rect x="0" y="4" width="140" height="6" rx="1" fill="#6b4f39" />
          <rect x="6" y="10" width="4" height="72" fill="#5a412f" />
          <rect x="130" y="10" width="4" height="72" fill="#5a412f" />
          <rect x="10" y="48" width="120" height="3" fill="#5a412f" />
          <rect x="18" y="-26" width="9" height="30" rx="1" fill="#2f3b45" />
          <rect x="28" y="-22" width="8" height="26" rx="1" fill="#b2533e" />
          <rect x="37" y="-24" width="7" height="28" rx="1" fill="#d8c8a4" />
          <path d="M98 4 C96 -6 92 -14 100 -22 C108 -14 104 -6 102 4 Z" fill="#3e5e4a" />
          <rect x="94" y="-2" width="14" height="6" rx="2" fill="#e8e2d6" />
          <rect x="24" y="36" width="34" height="12" rx="1" fill="#c9b08a" />
        </svg>
        <svg className="room__furn" viewBox="0 0 60 150" style={place(60, 150, ROOM_W / 2 + 160)} aria-hidden="true">
          <ellipse cx="30" cy="148" rx="20" ry="2" fill="rgba(0,0,0,.2)" />
          <path d="M18 120 L42 120 L38 148 L22 148 Z" fill="#d9d2c6" />
          <path d="M30 120 C10 90 4 60 16 30 C24 60 28 80 30 120 Z" fill="#4f7356" />
          <path d="M30 120 C46 86 56 54 46 20 C38 52 34 82 30 120 Z" fill="#3f6448" />
          <path d="M30 120 C28 80 30 40 32 6 C38 40 36 86 30 120 Z" fill="#5d8462" />
        </svg>
      </>
    );
  }

  return (
    <>
      <svg className="room__furn" viewBox="0 0 210 90" style={place(210, 90, ROOM_W / 2)} aria-hidden="true">
        <defs>
          <linearGradient id="sofa-g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#9a948b" />
            <stop offset="1" stopColor="#77716a" />
          </linearGradient>
        </defs>
        <ellipse cx="105" cy="88" rx="104" ry="3" fill="rgba(0,0,0,.25)" />
        <rect x="10" y="6" width="190" height="48" rx="12" fill="url(#sofa-g)" />
        <rect x="0" y="30" width="26" height="50" rx="10" fill="#857f77" />
        <rect x="184" y="30" width="26" height="50" rx="10" fill="#857f77" />
        <rect x="22" y="44" width="83" height="30" rx="8" fill="#918b83" />
        <rect x="105" y="44" width="83" height="30" rx="8" fill="#8d877f" />
        <rect x="14" y="70" width="182" height="12" rx="4" fill="#6c665f" />
        <rect x="24" y="82" width="4" height="7" fill="#3b3631" />
        <rect x="182" y="82" width="4" height="7" fill="#3b3631" />
        <rect x="32" y="24" width="28" height="26" rx="7" fill="#d4c2a5" transform="rotate(-8 46 37)" />
        <rect x="150" y="24" width="28" height="26" rx="7" fill="#a8b5a3" transform="rotate(7 164 37)" />
      </svg>
      <svg className="room__furn" viewBox="0 0 46 165" style={place(46, 165, ROOM_W / 2 - 150)} aria-hidden="true">
        <ellipse cx="23" cy="163" rx="18" ry="2" fill="rgba(0,0,0,.2)" />
        <rect x="21" y="26" width="3" height="134" fill="#2b2926" />
        <rect x="9" y="158" width="28" height="4" rx="2" fill="#2b2926" />
        <path d="M4 30 L42 30 L34 2 L12 2 Z" fill="#efe6d4" />
      </svg>
      <svg className="room__furn" viewBox="0 0 70 120" style={place(70, 120, ROOM_W / 2 + 150)} aria-hidden="true">
        <ellipse cx="35" cy="118" rx="22" ry="2" fill="rgba(0,0,0,.2)" />
        <path d="M22 92 L48 92 L44 118 L26 118 Z" fill="#c7b9a3" />
        <path d="M35 92 C18 70 6 44 14 14 C26 40 32 64 35 92 Z" fill="#4f7356" />
        <path d="M35 92 C52 66 64 40 58 8 C46 38 40 64 35 92 Z" fill="#3f6448" />
        <path d="M35 92 C32 60 34 30 38 2 C44 30 42 64 35 92 Z" fill="#5d8462" />
      </svg>
    </>
  );
}
