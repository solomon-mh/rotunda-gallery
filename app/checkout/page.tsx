"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cartSubtotal, useStore, type CartItem } from "@/lib/store";
import { getArtwork } from "@/lib/artworks";
import { describeOptions, formatPrice } from "@/lib/pricing";

const SHIPPING = [
  { id: "standard", label: "Tracked standard", days: "4–8 working days", price: 12 },
  { id: "express", label: "Express courier", days: "2–3 working days", price: 28 },
];

export default function CheckoutPage() {
  const items = useStore((s) => s.items);
  const currency = useStore((s) => s.currency);
  const clearCart = useStore((s) => s.clearCart);
  const [ship, setShip] = useState(SHIPPING[0].id);
  const [order, setOrder] = useState<{ id: string; items: CartItem[]; total: number; email: string } | null>(null);

  const subtotal = cartSubtotal(items);
  const shipping = subtotal >= 150 && ship === "standard" ? 0 : SHIPPING.find((s) => s.id === ship)!.price;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shipping + tax;
  const orderId = useMemo(() => `RT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, []);

  if (order) {
    return (
      <main className="page checkout-done">
        <p className="mono-xxs muted">Order {order.id}</p>
        <h1 className="display page-head__title">Thank you.</h1>
        <p className="serif page-head__lede">
          Your order is confirmed. A receipt is on its way to {order.email}, and we&rsquo;ll email tracking as soon as your prints leave the studio.
        </p>
        <div className="checkout-done__thumbs">
          {order.items.map((i) => {
            const a = getArtwork(i.slug)!;
            return <Image key={i.id} src={a.image} alt={a.title} width={a.width} height={a.height} sizes="120px" />;
          })}
        </div>
        <p className="display">{formatPrice(order.total, currency)}</p>
        <Link href="/" className="btn btn--black">
          Back to the gallery
        </Link>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="page checkout-done">
        <h1 className="display page-head__title">Your bag is empty</h1>
        <p className="serif page-head__lede">Walk the rotunda and click any painting to choose a print.</p>
        <Link href="/" className="btn btn--black">
          Walk the gallery
        </Link>
      </main>
    );
  }

  return (
    <main className="page checkout">
      <form
        className="checkout__form form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setOrder({ id: orderId, items, total, email: String(data.get("email")) });
          clearCart();
          window.scrollTo({ top: 0 });
        }}
      >
        <h1 className="display page-head__title">Checkout</h1>

        <fieldset>
          <legend className="mono-xxs">01 · Contact</legend>
          <label>
            <span className="mono-xxs">Email</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
        </fieldset>

        <fieldset>
          <legend className="mono-xxs">02 · Delivery address</legend>
          <div className="form__row">
            <label>
              <span className="mono-xxs">First name</span>
              <input name="given" required autoComplete="given-name" />
            </label>
            <label>
              <span className="mono-xxs">Last name</span>
              <input name="family" required autoComplete="family-name" />
            </label>
          </div>
          <label>
            <span className="mono-xxs">Address</span>
            <input name="address" required autoComplete="street-address" />
          </label>
          <div className="form__row">
            <label>
              <span className="mono-xxs">City</span>
              <input name="city" required autoComplete="address-level2" />
            </label>
            <label>
              <span className="mono-xxs">Postcode</span>
              <input name="postcode" required autoComplete="postal-code" />
            </label>
          </div>
          <label>
            <span className="mono-xxs">Country</span>
            <select name="country" defaultValue="US" autoComplete="country">
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="FR">France</option>
              <option value="DE">Germany</option>
              <option value="NL">Netherlands</option>
              <option value="NG">Nigeria</option>
              <option value="ET">Ethiopia</option>
              <option value="JP">Japan</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend className="mono-xxs">03 · Shipping</legend>
          {SHIPPING.map((s) => (
            <label key={s.id} className={`radio-card${ship === s.id ? " is-on" : ""}`}>
              <input type="radio" name="ship" value={s.id} checked={ship === s.id} onChange={() => setShip(s.id)} />
              <span>
                <span className="serif">{s.label}</span>
                <span className="mono-xxs muted">{s.days}</span>
              </span>
              <span className="serif">
                {s.id === "standard" && subtotal >= 150 ? "Free" : formatPrice(s.price, currency)}
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend className="mono-xxs">04 · Payment</legend>
          <p className="fineprint muted">
            This is a demo store — no payment is taken. Placing the order simply shows the confirmation screen.
          </p>
        </fieldset>

        <button className="btn btn--black btn--block">Place order · {formatPrice(total, currency)}</button>
      </form>

      <aside className="checkout__summary">
        <p className="mono-xxs muted">Order summary</p>
        {items.map((i) => {
          const a = getArtwork(i.slug)!;
          return (
            <div key={i.id} className="bag-item">
              <span className="bag-item__thumb">
                <Image src={a.image} alt={a.title} width={a.width} height={a.height} sizes="72px" />
                <span className="bag-item__qty mono-xxs">{i.qty}</span>
              </span>
              <div className="bag-item__info">
                <div className="bag-item__row">
                  <p className="serif">{a.title}</p>
                  <p className="serif">{formatPrice(i.unitPrice * i.qty, currency)}</p>
                </div>
                <p className="mono-xs muted bag-item__spec">{describeOptions(i.options)}</p>
              </div>
            </div>
          );
        })}
        <dl className="totals">
          <div>
            <dt className="serif">Subtotal</dt>
            <dd className="serif">{formatPrice(subtotal, currency)}</dd>
          </div>
          <div>
            <dt className="serif">Shipping</dt>
            <dd className="serif">{shipping === 0 ? "Free" : formatPrice(shipping, currency)}</dd>
          </div>
          <div>
            <dt className="serif">Estimated tax</dt>
            <dd className="serif">{formatPrice(tax, currency)}</dd>
          </div>
          <div className="totals__grand">
            <dt className="display">Total</dt>
            <dd className="display">{formatPrice(total, currency)}</dd>
          </div>
        </dl>
      </aside>
    </main>
  );
}
