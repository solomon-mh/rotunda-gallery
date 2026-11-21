"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useResolvedTheme } from "@/lib/theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  const theme = useResolvedTheme();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  // Apply the theme once saved settings are loaded (the boot script handled first paint).
  useEffect(() => {
    if (hydrated) document.documentElement.dataset.theme = theme;
  }, [theme, hydrated]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useStore.getState().setSearchOpen(!useStore.getState().searchOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <>{children}</>;
}
