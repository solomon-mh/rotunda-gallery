"use client";

import Image from "next/image";
import Link from "next/link";
import type { Artwork } from "@/lib/artworks";
import { fromPrice, formatPrice } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export default function ArtCard({ art, sizes = "(max-width: 700px) 50vw, 25vw" }: { art: Artwork; sizes?: string }) {
  const currency = useStore((s) => s.currency);
  return (
    <Link href={`/artwork/${art.slug}`} className="art-card">
      <span className="art-card__frame">
        <Image src={art.image} alt={`${art.title} by ${art.artist}`} width={art.width} height={art.height} sizes={sizes} />
      </span>
      <span className="art-card__meta">
        <span className="serif">{art.artist}</span>
        <span className="serif italic">{art.title}</span>
        <span className="mono-xxs muted">From {formatPrice(fromPrice(art), currency)}</span>
      </span>
    </Link>
  );
}
