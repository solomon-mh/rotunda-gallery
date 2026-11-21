"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";
import { collections } from "@/lib/artworks";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <Logo size={28} />
          <p className="display site-footer__big">Walk the world&rsquo;s greatest paintings.</p>
        </div>
        <form
          className="newsletter"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.includes("@")) setDone(true);
          }}
        >
          <label className="mono-xxs" htmlFor="nl-email">
            New hangs, first
          </label>
          {done ? (
            <p className="serif">Thank you — you’re on the list.</p>
          ) : (
            <div className="newsletter__row">
              <input
                id="nl-email"
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn btn--black">Subscribe</button>
            </div>
          )}
        </form>
      </div>
      <div className="site-footer__cols">
        <div>
          <p className="mono-xxs muted">Collections</p>
          {collections.map((c) => (
            <Link key={c.slug} href={`/collections/${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </div>
        <div>
          <p className="mono-xxs muted">Visit</p>
          <Link href="/">The Rotunda</Link>
          <Link href="/shop">Shop prints</Link>
          <Link href="/artists">Artist index</Link>
          <Link href="/auctions">Auctions</Link>
        </div>
        <div>
          <p className="mono-xxs muted">Help</p>
          <Link href="/help">FAQ</Link>
          <Link href="/help#delivery">Delivery</Link>
          <Link href="/help#returns">Returns</Link>
          <Link href="/info">About</Link>
        </div>
        <div>
          <p className="mono-xxs muted">Account</p>
          <Link href="/account">Sign in</Link>
          <Link href="/saved">Saved works</Link>
          <Link href="/checkout">Checkout</Link>
        </div>
      </div>
      <div className="site-footer__base mono-xxs muted">
        <span>© {new Date().getFullYear()} Rotunda Editions</span>
        <span>Images: public-domain museum reproductions via Wikimedia Commons</span>
      </div>
    </footer>
  );
}
