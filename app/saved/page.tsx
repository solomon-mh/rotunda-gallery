"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { getArtwork } from "@/lib/artworks";
import ArtCard from "@/components/ArtCard";
import Footer from "@/components/Footer";

export default function SavedPage() {
  const saved = useStore((s) => s.saved);
  const works = saved.map(getArtwork).filter((a): a is NonNullable<typeof a> => Boolean(a));
  return (
    <>
      <main className="page">
        <header className="page-head">
          <p className="mono-xxs muted">Saved</p>
          <h1 className="display page-head__title">Your wall</h1>
          <p className="serif page-head__lede">
            {works.length
              ? `${works.length} ${works.length === 1 ? "work" : "works"} you've bookmarked. They're kept in this browser.`
              : "Bookmark works from their page and they'll hang here."}
          </p>
        </header>
        {works.length ? (
          <div className="grid-cards grid-cards--shop">
            {works.map((a) => (
              <ArtCard key={a.slug} art={a} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <Link href="/" className="btn btn--black">
              Walk the gallery
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
