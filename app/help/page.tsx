import type { Metadata } from "next";
import Accordion from "@/components/product/Accordion";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Help",
  description: "Orders, delivery, returns and printing questions.",
};

const FAQ: { id: string; title: string; items: { q: string; a: string }[] }[] = [
  {
    id: "gallery",
    title: "The gallery",
    items: [
      { q: "How do I move around the rotunda?", a: "Scroll with your mouse or trackpad, drag with your finger or cursor, or use the ← → arrow keys and the round buttons at the bottom right. Click any painting to walk up to it." },
      { q: "Can I turn off the wall labels or make it walk by itself?", a: "Yes — open the gear icon in the header. You can toggle wall labels, auto-walk and rendering quality." },
      { q: "Is there a version without 3D?", a: "Switch the toggle at the top right from GALLERY to LIST for a simple grid of every collection." },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    items: [
      { q: "How long does delivery take?", a: "Unframed prints leave the studio in 3–5 working days, framed works in 7–10. Tracked delivery then takes 2–6 days depending on destination." },
      { q: "Do you ship worldwide?", a: "We ship to over 60 countries. Duties and taxes are calculated at checkout so there are no surprises on the doorstep." },
      { q: "How are prints packed?", a: "Unframed prints are rolled in acid-free tissue inside a rigid tube. Framed works travel in custom crates with corner protection." },
    ],
  },
  {
    id: "returns",
    title: "Returns",
    items: [
      { q: "What if my print arrives damaged?", a: "Send us a photo within 30 days and we'll reprint it or refund you in full — you don't need to send it back." },
      { q: "Can I return a print I don't love?", a: "Unframed open-edition prints can be returned within 30 days. Numbered editions can be returned unopened." },
    ],
  },
  {
    id: "printing",
    title: "Printing",
    items: [
      { q: "Where do the images come from?", a: "All works are in the public domain. We start from high-resolution captures released by the holding museums and colour-match them by hand." },
      { q: "What's the difference between the papers?", a: "Budget Art Paper is a smooth 170gsm matte stock. Giclée Fine Art is 230gsm archival cotton-rag. Hahnemühle German Etching is a 310gsm mould-made paper with a soft texture — our best." },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <main className="page">
        <header className="page-head">
          <p className="mono-xxs muted">Help</p>
          <h1 className="display page-head__title">How can we help?</h1>
          <nav className="letter-nav mono-xxs" aria-label="Topics">
            {FAQ.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.title}
              </a>
            ))}
            <a href="#contact">Contact</a>
          </nav>
        </header>

        <div className="help-grid">
          <div>
            {FAQ.map((s) => (
              <section key={s.id} id={s.id} className="help-section">
                <h2 className="display">{s.title}</h2>
                {s.items.map((it) => (
                  <Accordion key={it.q} title={it.q}>
                    <p>{it.a}</p>
                  </Accordion>
                ))}
              </section>
            ))}
          </div>
          <aside id="contact" className="help-contact">
            <h2 className="display">Contact the studio</h2>
            <p className="serif muted">We reply within one working day.</p>
            <ContactForm />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
