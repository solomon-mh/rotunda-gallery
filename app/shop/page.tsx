import type { Metadata } from "next";
import { Suspense } from "react";
import ShopGrid from "@/components/ShopGrid";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Shop prints",
  description: "Museum-grade prints of the world's most loved paintings, on three papers, four sizes, framed or unframed.",
};

export default function ShopPage() {
  return (
    <>
      <main className="page">
        <header className="page-head">
          <p className="mono-xxs muted">Shop</p>
          <h1 className="display page-head__title">Prints of the masters</h1>
          <p className="serif page-head__lede">
            Every work in the rotunda, reproduced from public-domain museum captures and printed to order on fine-art paper.
            Choose your paper, size and frame on each work.
          </p>
        </header>
        <Suspense>
          <ShopGrid />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
