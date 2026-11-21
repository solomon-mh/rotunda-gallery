"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { artworks, collections } from "@/lib/artworks";
import ArtCard from "./ArtCard";

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price ↑" },
  { id: "price-desc", label: "Price ↓" },
  { id: "year", label: "Oldest first" },
  { id: "title", label: "A – Z" },
] as const;

const yearOf = (y: string) => parseInt(y.match(/\d{4}/)?.[0] ?? "0", 10);

export default function ShopGrid() {
  const params = useSearchParams();
  const router = useRouter();
  const col = params.get("collection") ?? "all";
  const sort = (params.get("sort") ?? "featured") as (typeof SORTS)[number]["id"];

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(params.toString());
    if (v === "all" || v === "featured") p.delete(k);
    else p.set(k, v);
    router.replace(`/shop${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  const list = useMemo(() => {
    const l = artworks.filter((a) => col === "all" || a.collection === col);
    switch (sort) {
      case "price-asc":
        return [...l].sort((a, b) => a.basePrice - b.basePrice);
      case "price-desc":
        return [...l].sort((a, b) => b.basePrice - a.basePrice);
      case "year":
        return [...l].sort((a, b) => yearOf(a.year) - yearOf(b.year));
      case "title":
        return [...l].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return l;
    }
  }, [col, sort]);

  return (
    <>
      <div className="filters">
        <div className="opt__choices" role="tablist" aria-label="Filter by collection">
          <button className={`choice mono-xxs${col === "all" ? " is-on" : ""}`} onClick={() => setParam("collection", "all")}>
            All ({artworks.length})
          </button>
          {collections.map((c) => (
            <button key={c.slug} className={`choice mono-xxs${col === c.slug ? " is-on" : ""}`} onClick={() => setParam("collection", c.slug)}>
              {c.name}
            </button>
          ))}
        </div>
        <label className="sort mono-xxs">
          Sort
          <select value={sort} onChange={(e) => setParam("sort", e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid-cards grid-cards--shop">
        {list.map((a) => (
          <ArtCard key={a.slug} art={a} />
        ))}
      </div>
    </>
  );
}
