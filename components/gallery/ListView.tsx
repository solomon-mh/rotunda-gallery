"use client";

import Link from "next/link";
import { collections, worksIn } from "@/lib/artworks";
import ArtCard from "../ArtCard";

export default function ListView() {
  return (
    <div className="list-view">
      {collections.map((c) => (
        <section key={c.slug} className="list-view__section">
          <header className="list-view__head">
            <p className="mono-xxs muted">Collection {c.number}</p>
            <h2 className="display list-view__title">{c.name}</h2>
            <p className="mono-xxs muted">{c.era}</p>
            <Link href={`/collections/${c.slug}`} className="mono-xxs underline-link">
              Enter the collection →
            </Link>
          </header>
          <div className="list-view__row">
            {worksIn(c.slug).map((a) => (
              <ArtCard key={a.slug} art={a} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
