"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cartCount, cartSubtotal, useStore } from "@/lib/store";
import { getArtwork } from "@/lib/artworks";
import { FRAME_COLORS, FRAMES, PAPERS, SIZES, EDITIONS, formatPrice } from "@/lib/pricing";
import { CloseIcon, MinusIcon, PlusIcon } from "./icons";

const ease = [0.22, 1, 0.36, 1] as const;

export default function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const items = useStore((s) => s.items);
  const setQty = useStore((s) => s.setQty);
  const removeItem = useStore((s) => s.removeItem);
  const currency = useStore((s) => s.currency);
  const count = cartCount(items);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="drawer-root">
          <motion.div
            className="drawer-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Your bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease }}
          >
            <div className="drawer__head">
              <div>
                <h2 className="display drawer__title">Your Bag</h2>
                <p className="mono-sm muted">
                  {count} {count === 1 ? "item" : "items"}
                </p>
              </div>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close bag">
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="drawer__body">
              {items.length === 0 && (
                <div className="drawer__empty">
                  <p className="serif-lg">Your bag is empty.</p>
                  <p className="muted">Walk the rotunda and click any work to see print options.</p>
                </div>
              )}
              {items.map((item) => {
                const art = getArtwork(item.slug);
                if (!art) return null;
                const o = item.options;
                const spec = [
                  PAPERS.find((p) => p.id === o.paper)?.label,
                  SIZES.find((s) => s.id === o.size)?.label,
                  EDITIONS.find((e) => e.id === o.edition)?.label,
                  FRAMES.find((f) => f.id === o.frame)?.label,
                  o.frame !== "unframed" ? FRAME_COLORS.find((c) => c.id === o.frameColor)?.label : null,
                ]
                  .filter(Boolean)
                  .join(" – ");
                return (
                  <div className="bag-item" key={item.id}>
                    <Link href={`/artwork/${art.slug}`} className="bag-item__thumb" onClick={() => setOpen(false)}>
                      <Image src={art.image} alt={art.title} width={art.width} height={art.height} sizes="72px" />
                    </Link>
                    <div className="bag-item__info">
                      <div className="bag-item__row">
                        <p className="serif">{art.title}</p>
                        <p className="serif">{formatPrice(item.unitPrice * item.qty, currency)}</p>
                      </div>
                      <p className="mono-xs muted bag-item__spec">{spec}</p>
                      <div className="bag-item__row">
                        <div className="stepper stepper--sm">
                          <button onClick={() => setQty(item.id, item.qty - 1)} aria-label="Decrease quantity">
                            <MinusIcon size={11} />
                          </button>
                          <span>{item.qty}</span>
                          <button onClick={() => setQty(item.id, item.qty + 1)} aria-label="Increase quantity">
                            <PlusIcon size={11} />
                          </button>
                        </div>
                        <button className="mono-xs link-btn" onClick={() => removeItem(item.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="drawer__foot">
              <div className="bag-item__row">
                <span className="mono-xs">Subtotal</span>
                <span className="serif-lg">{formatPrice(cartSubtotal(items), currency)}</span>
              </div>
              <p className="fineprint muted">Shipping and taxes are calculated at checkout from your delivery address.</p>
              <Link
                href="/checkout"
                className={`btn btn--black btn--block${items.length === 0 ? " is-disabled" : ""}`}
                aria-disabled={items.length === 0}
                onClick={(e) => {
                  if (items.length === 0) e.preventDefault();
                  else setOpen(false);
                }}
              >
                Go to checkout
              </Link>
              <button className="btn btn--ghost btn--block" onClick={() => setOpen(false)}>
                Keep looking
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
