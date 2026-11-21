import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { collections, getCollection, worksIn } from "@/lib/artworks";
import ArtCard from "@/components/ArtCard";
import Footer from "@/components/Footer";

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCollection(slug);
  return c ? { title: c.name, description: c.description } : {};
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) notFound();
  const works = worksIn(c.slug);
  const i = collections.findIndex((x) => x.slug === c.slug);
  const prev = collections[(i - 1 + collections.length) % collections.length];
  const next = collections[(i + 1) % collections.length];
  const hero = works[0];

  return (
    <>
      <main className="page">
        <section className="collection-hero">
          <div className="collection-hero__text">
            <p className="mono-xxs muted">Collection {c.number}</p>
            <h1 className="display collection-hero__title">{c.name}</h1>
            <p className="mono-xxs muted">{c.era}</p>
            <p className="serif collection-hero__tag italic">{c.tagline}</p>
            <p className="serif collection-hero__desc">{c.description}</p>
            <p className="mono-xxs">
              {works.length} works · <Link href="/" className="underline-link">Walk it in the rotunda →</Link>
            </p>
          </div>
          <Link href={`/artwork/${hero.slug}`} className="collection-hero__img">
            <Image src={hero.image} alt={`${hero.title} by ${hero.artist}`} width={hero.width} height={hero.height} sizes="(max-width: 900px) 90vw, 40vw" priority />
          </Link>
        </section>

        <div className="grid-cards grid-cards--shop">
          {works.map((a) => (
            <ArtCard key={a.slug} art={a} />
          ))}
        </div>

        <nav className="collection-pager">
          <Link href={`/collections/${prev.slug}`}>
            <span className="mono-xxs muted">← Previous collection</span>
            <span className="display">{prev.name}</span>
          </Link>
          <Link href={`/collections/${next.slug}`} className="is-right">
            <span className="mono-xxs muted">Next collection →</span>
            <span className="display">{next.name}</span>
          </Link>
        </nav>
      </main>
      <Footer />
    </>
  );
}
