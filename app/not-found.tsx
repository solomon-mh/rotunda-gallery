import Image from "next/image";
import Link from "next/link";
import { getArtwork } from "@/lib/artworks";

export default function NotFound() {
  const art = getArtwork("wanderer-above-the-sea-of-fog")!;
  return (
    <main className="page not-found">
      <Image src={art.image} alt={art.title} width={art.width} height={art.height} sizes="280px" />
      <div>
        <p className="mono-xxs muted">404</p>
        <h1 className="display page-head__title">Lost in the fog.</h1>
        <p className="serif page-head__lede">This room doesn&rsquo;t exist — but the rotunda is just behind you.</p>
        <Link href="/" className="btn btn--black">
          Back to the gallery
        </Link>
      </div>
    </main>
  );
}
