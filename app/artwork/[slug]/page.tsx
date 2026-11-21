import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { artworks, getArtwork } from "@/lib/artworks";
import ProductView from "@/components/product/ProductView";
import Footer from "@/components/Footer";

export function generateStaticParams() {
  return artworks.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const art = getArtwork(slug);
  if (!art) return {};
  return {
    title: `${art.title} — ${art.artist}`,
    description: art.description,
    openGraph: { images: [art.image] },
  };
}

export default async function ArtworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const art = getArtwork(slug);
  if (!art) notFound();
  return (
    <>
      <main className="page page--product">
        <ProductView slug={art.slug} />
      </main>
      <Footer />
    </>
  );
}
