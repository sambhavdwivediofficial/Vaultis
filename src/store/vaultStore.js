import { create } from "zustand";
import { tauriVault } from "../services/tauriBridge.js";

const useVaultStore = create((set, get) => ({
  vaultInfo:   null,
  isLoading:   false,
  error:       null,

  fetchInfo: async () => {
    set({ isLoading: true });
    try {
      const info = await tauriVault.getInfo();
      set({ vaultInfo: info, isLoading: false });
      return info;
    } catch (e) {
      set({ error: e?.message || String(e), isLoading: false });
      return null;
    }
  },

  clearInfo: () => set({ vaultInfo: null }),
  clearError: () => set({ error: null }),
}));

export default useVaultStore;