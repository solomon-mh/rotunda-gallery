import type { Metadata } from "next";
import Auctions from "@/components/Auctions";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Auctions",
  description: "Weekly auctions of one-off artist's proofs from the Rotunda print studio.",
};

export default function AuctionsPage() {
  return (
    <>
      <main className="page">
        <header className="page-head">
          <p className="mono-xxs muted">Auctions</p>
          <h1 className="display page-head__title">Proofs, one of one.</h1>
          <p className="serif page-head__lede">
            Each week we release the studio&rsquo;s best artist&rsquo;s proofs — oversized, hand-finished and never reprinted. Bidding closes on the clock;
            the highest bid wins.
          </p>
        </header>
        <Auctions />
      </main>
      <Footer />
    </>
  );
}
