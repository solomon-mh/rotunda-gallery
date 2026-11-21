import { notFound } from "next/navigation";
import { getArtwork } from "@/lib/artworks";
import ProductModal from "@/components/product/ProductModal";

export default async function InterceptedArtwork({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const art = getArtwork(slug);
  if (!art) notFound();
  return <ProductModal slug={art.slug} />;
}
