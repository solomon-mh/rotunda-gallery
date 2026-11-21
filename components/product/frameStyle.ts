import type { CSSProperties } from "react";
import { FRAME_COLORS, type PrintOptions } from "@/lib/pricing";

/**
 * Frames are drawn with box-shadows so they never change the image's layout box —
 * that keeps the gallery → product page image hand-off pixel-exact.
 */
export function frameStyle(o: Pick<PrintOptions, "frame" | "frameColor">, scale = 1): CSSProperties {
  const color = FRAME_COLORS.find((c) => c.id === o.frameColor)!.hex;
  const px = (n: number) => `${Math.max(1, Math.round(n * scale))}px`;
  if (o.frame === "classic") {
    return {
      boxShadow: [
        `0 0 0 ${px(12)} #fbfbf9`,
        `0 0 0 ${px(24)} ${color}`,
        `0 0 0 ${px(25)} rgba(0,0,0,.18)`,
        `${px(4)} ${px(14)} ${px(30)} ${px(22)} rgba(0,0,0,.22)`,
      ].join(", "),
    };
  }
  if (o.frame === "canvas") {
    return {
      boxShadow: [
        `0 0 0 ${px(3)} rgba(0,0,0,.25)`,
        `0 0 0 ${px(13)} ${color}`,
        `${px(4)} ${px(12)} ${px(26)} ${px(12)} rgba(0,0,0,.24)`,
      ].join(", "),
    };
  }
  return { boxShadow: `${px(2)} ${px(10)} ${px(28)} rgba(0,0,0,.16)` };
}
