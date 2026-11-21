"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import Footer from "@/components/Footer";

export default function AccountPage() {
  const [step, setStep] = useState<"form" | "sent">("form");
  const [email, setEmail] = useState("");
  const saved = useStore((s) => s.saved.length);
  return (
    <>
      <main className="page account">
        <div className="account__card">
          <p className="mono-xxs muted">Account</p>
          <h1 className="display page-head__title">Sign in</h1>
          {step === "form" ? (
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                setStep("sent");
              }}
            >
              <p className="serif muted">We&rsquo;ll email you a one-time link — no password needed.</p>
              <label>
                <span className="mono-xxs">Email</span>
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <button className="btn btn--black btn--block">Email me a link</button>
            </form>
          ) : (
            <div className="form-success">
              <p className="serif">
                Check <strong>{email}</strong> for your sign-in link. (Demo — no email is actually sent.)
              </p>
              <button className="btn btn--ghost" onClick={() => setStep("form")}>
                Use a different email
              </button>
            </div>
          )}
          <p className="mono-xxs muted account__saved">
            You have {saved} saved {saved === 1 ? "work" : "works"} in this browser · <Link href="/saved" className="underline-link">View</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
