import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { artworks, collections, getArtwork } from "@/lib/artworks";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Info",
  description: "About Rotunda — a walk-through gallery of the world's most loved paintings, and the print studio behind it.",
};

export default function InfoPage() {
  const wave = getArtwork("the-great-wave")!;
  const vermeer = getArtwork("the-milkmaid")!;
  return (
    <>
      <main className="page">
        <header className="page-head">
          <p className="mono-xxs muted">Info</p>
          <h1 className="display page-head__title">A gallery you can walk from your desk.</h1>
          <p className="serif page-head__lede">
            Rotunda is a circular, endless room hung with {artworks.length} of the most loved paintings ever made — from the Mona Lisa to the Great Wave.
            Scroll and you walk; click and you step up to the canvas. Every work can go home with you as a museum-grade print.
          </p>
        </header>

        <section className="info-split">
          <figure>
            <Image src={wave.image} alt={wave.title} width={wave.width} height={wave.height} sizes="(max-width: 900px) 90vw, 45vw" />
            <figcaption className="mono-xxs muted">{wave.artist}, {wave.title}, {wave.year}</figcaption>
          </figure>
          <div className="info-text serif">
            <h2 className="display">The room</h2>
            <p>
              Museums hang their walls in sequence; we wanted that feeling of walking past. The rotunda is a ten-metre drum, lit like a white cube,
              that turns around you as you scroll. Works are grouped into {collections.length} collections, each opened by a title card —
              just as you&rsquo;d find at the door of a gallery room.
            </p>
            <p>
              Captions follow museum convention: artist, title, date. When you click a work the camera walks you up to it, the room falls away,
              and you&rsquo;re left with the painting and everything you might want to know about it.
            </p>
          </div>
        </section>

        <section className="info-split info-split--rev">
          <figure>
            <Image src={vermeer.image} alt={vermeer.title} width={vermeer.width} height={vermeer.height} sizes="(max-width: 900px) 90vw, 45vw" />
            <figcaption className="mono-xxs muted">{vermeer.artist}, {vermeer.title}, {vermeer.year}</figcaption>
          </figure>
          <div className="info-text serif">
            <h2 className="display">The prints</h2>
            <p>
              Every image starts from a high-resolution capture released into the public domain by the museum that holds the original.
              We colour-match each file by hand against the institution&rsquo;s reference and print with 12-colour archival pigment inks.
            </p>
            <ul className="info-list">
              <li><span className="mono-xxs">01</span> Three papers, from smooth poster stock to Hahnemühle etching.</li>
              <li><span className="mono-xxs">02</span> Four sizes, A3 to A0, printed to the painting&rsquo;s true proportions.</li>
              <li><span className="mono-xxs">03</span> Hand-built frames in black, natural oak or white.</li>
              <li><span className="mono-xxs">04</span> Numbered editions with a certificate of authenticity.</li>
            </ul>
          </div>
        </section>

        <section className="stats">
          <div><span className="display">{artworks.length}</span><span className="mono-xxs muted">Works on the wall</span></div>
          <div><span className="display">{collections.length}</span><span className="mono-xxs muted">Collections</span></div>
          <div><span className="display">474</span><span className="mono-xxs muted">Years of painting</span></div>
          <div><span className="display">100+</span><span className="mono-xxs muted">Years ink longevity</span></div>
        </section>

        <section className="info-contact">
          <h2 className="display">Say hello</h2>
          <p className="serif">
            Studio questions, trade enquiries or a painting you&rsquo;d love to see on the wall — <Link href="/help" className="underline-link">get in touch</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
