import { create } from "zustand";
import { tauriVault, vaultEvents } from "../services/tauriBridge.js";

const useAuthStore = create((set, get) => ({
  isUnlocked:   false,
  vaultExists:  null,   // null = not checked yet
  vaultInfo:    null,
  isLoading:    false,
  error:        null,
  recoveryKey:  null,   // shown once after creation

  // ── Init (called on app startup) ────────────────────────────────────────
  init: async () => {
    set({ isLoading: true, error: null });
    try {
      const exists   = await tauriVault.exists();
      const unlocked = exists ? await tauriVault.isUnlocked() : false;
      let vaultInfo  = null;
      if (exists) {
        vaultInfo = await tauriVault.getInfo().catch(() => null);
      }
      set({ vaultExists: exists, isUnlocked: unlocked, vaultInfo, isLoading: false });
    } catch (e) {
      set({ error: e?.message || String(e), isLoading: false });
    }
  },

  // ── Create vault ────────────────────────────────────────────────────────
  createVault: async (password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const recoveryKey = await tauriVault.create(password, displayName);
      const vaultInfo   = await tauriVault.getInfo();
      set({
        isLoading: false,
        vaultExists: true,
        isUnlocked: true,
        vaultInfo,
        recoveryKey,
      });
      return { ok: true, recoveryKey };
    } catch (e) {
      const msg = e?.message || String(e);
      set({ error: msg, isLoading: false });
      return { ok: false, error: msg };
    }
  },

  // ── Unlock vault ────────────────────────────────────────────────────────
  unlock: async (password, autoLockSecs = 300) => {
    set({ isLoading: true, error: null });
    try {
      const vaultInfo = await tauriVault.unlock(password, autoLockSecs);
      set({ isLoading: false, isUnlocked: true, vaultInfo });
      return { ok: true };
    } catch (e) {
      const msg = e?.message || String(e);
      set({ error: msg, isLoading: false });
      return { ok: false, error: msg };
    }
  },

  // ── Lock vault ──────────────────────────────────────────────────────────
  lock: async () => {
    try {
      await tauriVault.lock();
    } catch (_) { /* ignore */ }
    set({ isUnlocked: false });
  },

  // ── Change password ─────────────────────────────────────────────────────
  changePassword: async (current, next) => {
    set({ isLoading: true, error: null });
    try {
      await tauriVault.changePassword(current, next);
      set({ isLoading: false });
      return { ok: true };
    } catch (e) {
      const msg = e?.message || String(e);
      set({ error: msg, isLoading: false });
      return { ok: false, error: msg };
    }
  },

  clearRecoveryKey: () => set({ recoveryKey: null }),
  clearError:       () => set({ error: null }),

  // ── Event listeners (call once on mount) ────────────────────────────────
  listenForLock: () => {
    let unlistenAuto, unlistenEmergency;
    vaultEvents.onAutoLocked(()      => set({ isUnlocked: false })).then(u => { unlistenAuto = u; });
    vaultEvents.onEmergencyLocked(() => set({ isUnlocked: false })).then(u => { unlistenEmergency = u; });
    return () => {
      unlistenAuto?.();
      unlistenEmergency?.();
    };
  },
}));

export default useAuthStore;