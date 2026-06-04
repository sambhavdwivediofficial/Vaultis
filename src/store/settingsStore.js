import { create } from "zustand";
import { tauriSettings } from "../services/tauriBridge.js";

const useSettingsStore = create((set) => ({
  settings: {
    auto_lock_secs:          300,
    theme:                   "dark",
    language:                "en",
    show_password_strength:  true,
    clipboard_clear_secs:    30,
    launch_at_startup:       false,
    minimize_to_tray:        true,
    compact_mode:            false,
    font_size:               "medium",
  },
  isLoading: false,
  isSaving:  false,
  error:     null,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const settings = await tauriSettings.get();
      set({ settings, isLoading: false });
    } catch (e) {
      set({ error: e?.message || String(e), isLoading: false });
    }
  },

  update: async (partial) => {
    set(s => {
      const merged = { ...s.settings, ...partial };
      tauriSettings.update(merged).catch(() => {});
      return { settings: merged };
    });
  },

  reset: async () => {
    set({ isSaving: true });
    try {
      const settings = await tauriSettings.reset();
      set({ settings, isSaving: false });
      return { ok: true };
    } catch (e) {
      set({ error: e?.message || String(e), isSaving: false });
      return { ok: false };
    }
  },
}));

export default useSettingsStore;