"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CurrencyId, PrintOptions } from "./pricing";
import { optionsKey } from "./pricing";

export type CartItem = {
  id: string;
  slug: string;
  options: PrintOptions;
  qty: number;
  unitPrice: number;
};

export type TransitionRect = { x: number; y: number; w: number; h: number };

export type ThemePref = "light" | "dark" | "system";

type Settings = {
  theme: ThemePref;
  autoWalk: boolean;
  showLabels: boolean;
  highQuality: boolean;
};

type State = {
  items: CartItem[];
  saved: string[];
  currency: CurrencyId;
  settings: Settings;

  cartOpen: boolean;
  searchOpen: boolean;
  view: "gallery" | "list";

  /** Screen-space rect of the artwork the gallery camera just flew to. */
  transition: { slug: string; rect: TransitionRect; at: number } | null;
  /** Gallery walk position, kept in memory so the rotunda resumes where you left it. */
  galleryScroll: number;

  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleSaved: (slug: string) => void;
  setCurrency: (c: CurrencyId) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setView: (v: "gallery" | "list") => void;
  setTransition: (t: State["transition"]) => void;
  setGalleryScroll: (s: number) => void;
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      items: [],
      saved: [],
      currency: "USD",
      settings: { theme: "light", autoWalk: false, showLabels: true, highQuality: true },
      cartOpen: false,
      searchOpen: false,
      view: "gallery",
      transition: null,
      galleryScroll: 0,

      addItem: (item) =>
        set((s) => {
          const id = optionsKey(item.slug, item.options);
          const existing = s.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: s.items.map((i) => (i.id === id ? { ...i, qty: Math.min(99, i.qty + item.qty) } : i)),
            };
          }
          return { items: [...s.items, { ...item, id }] };
        }),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: qty <= 0 ? s.items.filter((i) => i.id !== id) : s.items.map((i) => (i.id === id ? { ...i, qty: Math.min(99, qty) } : i)),
        })),
      clearCart: () => set({ items: [] }),
      toggleSaved: (slug) =>
        set((s) => ({ saved: s.saved.includes(slug) ? s.saved.filter((x) => x !== slug) : [...s.saved, slug] })),
      setCurrency: (currency) => set({ currency }),
      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setView: (view) => set({ view }),
      setTransition: (transition) => set({ transition }),
      setGalleryScroll: (galleryScroll) => set({ galleryScroll }),
    }),
    {
      name: "rotunda-store",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ items: s.items, saved: s.saved, currency: s.currency, settings: s.settings }),
      // Older saved settings may lack newer keys — fill them from the defaults.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, settings: { ...current.settings, ...(p.settings ?? {}) } };
      },
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.qty * i.unitPrice, 0);
