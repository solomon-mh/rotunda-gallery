import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { artists, artistSlug, getCollection } from "@/lib/artworks";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Index of artists",
  description: "Every artist hanging in the Rotunda, A to Z.",
};

export default function ArtistsPage() {
  const letters = Array.from(new Set(artists.map((a) => indexLetter(a.name))));
  return (
    <>
      <main className="page">
        <header className="page-head">
          <p className="mono-xxs muted">Index</p>
          <h1 className="display page-head__title">Artists, A – Z</h1>
          <p className="serif page-head__lede">
            {artists.length} artists, {artists.reduce((n, a) => n + a.works.length, 0)} works, five centuries. Click any work to see it up close.
          </p>
          <nav className="letter-nav mono-xxs" aria-label="Jump to letter">
            {letters.map((l) => (
              <a key={l} href={`#letter-${l}`}>
                {l}
              </a>
            ))}
          </nav>
        </header>

        <ol className="artist-index">
          {artists.map((a, i) => {
            const letter = indexLetter(a.name);
            const first = i === 0 || indexLetter(artists[i - 1].name) !== letter;
            return (
              <li key={a.name} id={first ? `letter-${letter}` : undefined} className="artist-row">
                <span className="display artist-row__letter" aria-hidden="true">
                  {first ? letter : ""}
                </span>
                <div className="artist-row__name" id={artistSlug(a.name)}>
                  <h2 className="display">{a.name}</h2>
                  <p className="mono-xxs muted">
                    {a.life} · {a.works.length} {a.works.length === 1 ? "work" : "works"} ·{" "}
                    {Array.from(new Set(a.works.map((w) => getCollection(w.collection)!.name))).join(", ")}
                  </p>
                </div>
                <div className="artist-row__works">
                  {a.works.map((w) => (
                    <Link key={w.slug} href={`/artwork/${w.slug}`} className="artist-thumb" title={w.title}>
                      <Image src={w.image} alt={w.title} width={w.width} height={w.height} sizes="120px" />
                      <span className="serif italic">{w.title}</span>
                    </Link>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </main>
      <Footer />
    </>
  );
}

function indexLetter(name: string) {
  if (name.startsWith("J. M. W.")) return "T";
  if (name.includes("da Vinci")) return "L";
  if (name.includes("van Rijn")) return "R";
  if (name === "Michelangelo") return "M";
  const parts = name.split(" ");
  return parts[parts.length - 1][0].toUpperCase();
}
