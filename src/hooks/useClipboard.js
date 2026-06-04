import { useState, useCallback } from "react";
import { copyToClipboard } from "../utils/helpers.js";
import useSettingsStore from "../store/settingsStore.js";

export function useClipboard() {
  const [copied, setCopied] = useState(null);
  const clearSecs = useSettingsStore(s => s.settings.clipboard_clear_secs);

  const copy = useCallback(async (text, label = "text") => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
      // Schedule clipboard clear
      if (clearSecs > 0) {
        setTimeout(async () => {
          await copyToClipboard("");
        }, clearSecs * 1000);
      }
    }
    return ok;
  }, [clearSecs]);

  return { copy, copied };
}