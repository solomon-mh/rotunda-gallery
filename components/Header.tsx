"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { BagIcon, BookmarkIcon, ChevronDown, GearIcon, MenuIcon, SearchIcon, UserIcon, CloseIcon, SunIcon, MoonIcon } from "./icons";
import { useResolvedTheme } from "@/lib/theme";
import { cartCount, useStore } from "@/lib/store";
import { CURRENCIES, type CurrencyId } from "@/lib/pricing";

const NAV = [
  { href: "/artists", label: "Index" },
  { href: "/shop", label: "Shop" },
  { href: "/info", label: "Info" },
  { href: "/auctions", label: "Auctions" },
  { href: "/help", label: "Help" },
];

export default function Header() {
  const pathname = usePathname();
  const items = useStore((s) => s.items);
  const saved = useStore((s) => s.saved);
  const currency = useStore((s) => s.currency);
  const setCurrency = useStore((s) => s.setCurrency);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const count = cartCount(items);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="site-header">
      <div className="site-header__left">
        <Link href="/" className="site-header__logo" aria-label="Rotunda — back to the gallery">
          <Logo />
        </Link>
        <nav className="site-nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={pathname.startsWith(n.href) ? "is-active" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="site-header__right">
        <button className="search-pill" onClick={() => setSearchOpen(true)} aria-label="Search the collection">
          <SearchIcon size={13} />
          <span>Search</span>
          <kbd>{isMac ? "⌘K" : "Ctrl K"}</kbd>
        </button>

        <label className="currency-pill">
          <span className="sr-only">Currency</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyId)}>
            {CURRENCIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}
              </option>
            ))}
          </select>
          <ChevronDown size={11} />
        </label>

        <ThemeToggle />
        <SettingsMenu />

        <Link href="/saved" className="icon-btn" aria-label={`Saved works (${saved.length})`}>
          <BookmarkIcon size={16} filled={saved.length > 0} />
        </Link>
        <Link href="/account" className="icon-btn hide-sm" aria-label="Account">
          <UserIcon size={16} />
        </Link>
        <button className="icon-btn bag-btn" onClick={() => setCartOpen(true)} aria-label={`Open bag, ${count} items`}>
          <BagIcon size={16} />
          <span className="bag-btn__count">{count}</span>
        </button>
        <button className="icon-btn menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu" aria-expanded={menuOpen}>
          {menuOpen ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile">
          <Link href="/">Gallery</Link>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
          <Link href="/saved">Saved</Link>
          <Link href="/account">Account</Link>
        </nav>
      )}
    </header>
  );
}

function ThemeToggle() {
  const theme = useResolvedTheme();
  const setSetting = useStore((s) => s.setSetting);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button className="icon-btn theme-btn" onClick={() => setSetting("theme", next)} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      {theme === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
    </button>
  );
}

function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const settings = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const rows: { key: "autoWalk" | "showLabels" | "showVisitors" | "sound" | "highQuality"; label: string; hint: string }[] = [
    { key: "autoWalk", label: "Auto-walk", hint: "Drift slowly through the rotunda" },
    { key: "showLabels", label: "Wall labels", hint: "Show a caption beside each work" },
    { key: "showVisitors", label: "Visitors", hint: "Other people wandering the gallery" },
    { key: "sound", label: "Room sound", hint: "Murmured conversation, footsteps, the guide" },
    { key: "highQuality", label: "High quality", hint: "Sharper rendering, more GPU" },
  ];

  return (
    <div className="settings" ref={ref}>
      <button className="icon-btn" aria-label="Gallery settings" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <GearIcon size={15} />
      </button>
      {open && (
        <div className="settings__panel" role="dialog" aria-label="Gallery settings">
          <p className="eyebrow">Gallery settings</p>
          <div className="settings__row settings__row--stack">
            <span className="settings__label">Appearance</span>
            <div className="seg" role="radiogroup" aria-label="Appearance">
              {(["light", "dark", "system"] as const).map((t) => (
                <button key={t} role="radio" aria-checked={settings.theme === t} className={settings.theme === t ? "is-on" : ""} onClick={() => setSetting("theme", t)}>
                  {t === "system" ? "Auto" : t}
                </button>
              ))}
            </div>
          </div>
          {rows.map((r) => (
            <label key={r.key} className="settings__row">
              <span>
                <span className="settings__label">{r.label}</span>
                <span className="settings__hint">{r.hint}</span>
              </span>
              <input
                type="checkbox"
                className="switch"
                checked={settings[r.key]}
                onChange={(e) => setSetting(r.key, e.target.checked)}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
