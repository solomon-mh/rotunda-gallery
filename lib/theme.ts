"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";

/** The theme actually in effect: the saved preference, or the OS setting when set to "system". */
export function useResolvedTheme(): "light" | "dark" {
  const pref = useStore((s) => s.settings.theme);
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return pref === "system" ? (systemDark ? "dark" : "light") : pref;
}

/** Runs before paint (inlined in <head>) so a returning dark-mode visitor never sees a white flash. */
export const themeBootScript = `(function(){try{var s=JSON.parse(localStorage.getItem("rotunda-store")||"{}");var t=(s.state&&s.state.settings&&s.state.settings.theme)||"light";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;
