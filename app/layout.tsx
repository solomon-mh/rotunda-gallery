import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Newsreader, IBM_Plex_Mono } from "next/font/google";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import SearchPalette from "@/components/SearchPalette";
import Providers from "@/components/Providers";
import { themeBootScript } from "@/lib/theme";
import "./globals.css";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Rotunda — Walk the world's greatest paintings", template: "%s — Rotunda" },
  description:
    "A walk-through 3D gallery of the world's most loved paintings — the Mona Lisa, The Starry Night, The Great Wave and more — with museum-grade prints you can take home.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3f1" },
    { media: "(prefers-color-scheme: dark)", color: "#151514" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable}`} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <Providers>
          <Header />
          {children}
          {modal}
          <CartDrawer />
          <SearchPalette />
        </Providers>
      </body>
    </html>
  );
}
