import { useEffect, useState } from "react";
import useSettingsStore from "../store/settingsStore.js";

const THEMES = ["dark", "light", "auto"];

export function useTheme() {
  const settings  = useSettingsStore(s => s.settings);
  const update    = useSettingsStore(s => s.update);

  const [resolvedTheme, setResolved] = useState("dark");

  useEffect(() => {
    const preference = settings.theme || "dark";

    if (preference === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => setResolved(mq.matches ? "dark" : "light");
      apply();
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    } else {
      setResolved(preference);
    }
  }, [settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);

    if (resolvedTheme === "light") {
      root.style.setProperty("--color-bg-base",    "#f8f8fc");
      root.style.setProperty("--color-bg-surface", "#f0f0f8");
      root.style.setProperty("--color-bg-elevated","#e8e8f4");
      root.style.setProperty("--color-bg-overlay", "#e0e0ec");
      root.style.setProperty("--text-primary",     "#0c0c1a");
      root.style.setProperty("--text-secondary",   "rgba(12,12,26,0.65)");
      root.style.setProperty("--text-tertiary",    "rgba(12,12,26,0.4)");
      root.style.setProperty("--border-subtle",    "rgba(0,0,0,0.07)");
      root.style.setProperty("--border-default",   "rgba(0,0,0,0.12)");
      root.style.setProperty("--glass-bg",         "rgba(0,0,0,0.025)");
      root.style.setProperty("--glass-bg-hover",   "rgba(0,0,0,0.04)");
      root.style.setProperty("--glass-bg-active",  "rgba(0,0,0,0.06)");
      root.style.setProperty("--glass-border",     "rgba(0,0,0,0.08)");
    } else {
      // Reset to dark defaults
      root.style.removeProperty("--color-bg-base");
      root.style.removeProperty("--color-bg-surface");
      root.style.removeProperty("--color-bg-elevated");
      root.style.removeProperty("--color-bg-overlay");
      root.style.removeProperty("--text-primary");
      root.style.removeProperty("--text-secondary");
      root.style.removeProperty("--text-tertiary");
      root.style.removeProperty("--border-subtle");
      root.style.removeProperty("--border-default");
      root.style.removeProperty("--glass-bg");
      root.style.removeProperty("--glass-bg-hover");
      root.style.removeProperty("--glass-bg-active");
      root.style.removeProperty("--glass-border");
    }
  }, [resolvedTheme]);

  const setTheme = (theme) => {
    if (THEMES.includes(theme)) update({ theme });
  };

  return {
    theme:         settings.theme || "dark",
    resolvedTheme,
    setTheme,
    isDark:        resolvedTheme === "dark",
    isLight:       resolvedTheme === "light",
  };
}