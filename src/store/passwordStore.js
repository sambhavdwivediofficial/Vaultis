import { create } from "zustand";
import { tauriPasswords } from "../services/tauriBridge.js";

const usePasswordStore = create((set, get) => ({
  passwords:     [],
  activeEntry:   null,
  isLoading:     false,
  isSaving:      false,
  error:         null,
  searchQuery:   "",
  searchResults: [],

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const passwords = await tauriPasswords.list();
      set({ passwords, isLoading: false });
    } catch (e) {
      set({ error: e?.message || String(e), isLoading: false });
    }
  },

  fetchOne: async (id) => {
    set({ isLoading: true });
    try {
      const entry = await tauriPasswords.get(id);
      set({ activeEntry: entry, isLoading: false });
      return entry;
    } catch (e) {
      set({ error: e?.message || String(e), isLoading: false });
      return null;
    }
  },

  create: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const entry = await tauriPasswords.create(
        data.name, data.username, data.password,
        data.url, data.notes, data.totpSecret,
        data.tags, data.folderId, data.isFavorite
      );
      set(s => ({ passwords: [entry, ...s.passwords], isSaving: false }));
      return { ok: true, entry };
    } catch (e) {
      const msg = e?.message || String(e);
      set({ error: msg, isSaving: false });
      return { ok: false, error: msg };
    }
  },

  update: async (id, data) => {
    set({ isSaving: true, error: null });
    try {
      const updated = await tauriPasswords.update(
        id, data.name, data.username, data.password,
        data.url, data.notes, data.totpSecret,
        data.tags, data.folderId, data.isFavorite
      );
      set(s => ({
        passwords: s.passwords.map(p => p.id === id ? updated : p),
        activeEntry: s.activeEntry?.id === id ? updated : s.activeEntry,
        isSaving: false,
      }));
      return { ok: true, entry: updated };
    } catch (e) {
      const msg = e?.message || String(e);
      set({ error: msg, isSaving: false });
      return { ok: false, error: msg };
    }
  },

  delete: async (id) => {
    try {
      await tauriPasswords.delete(id);
      set(s => ({
        passwords: s.passwords.filter(p => p.id !== id),
        activeEntry: s.activeEntry?.id === id ? null : s.activeEntry,
      }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },

  restore: async (id) => {
    try {
      await tauriPasswords.restore(id);
      await get().fetch();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },

  generate: async (opts) => {
    try {
      const pwd = await tauriPasswords.generate(
        opts.length, opts.uppercase, opts.lowercase,
        opts.digits, opts.symbols, opts.excludeAmbiguous
      );
      return { ok: true, password: pwd };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },

  search: async (query) => {
    set({ searchQuery: query });
    if (!query.trim()) { set({ searchResults: [] }); return; }
    try {
      const results = await tauriPasswords.search(query);
      set({ searchResults: results });
    } catch { set({ searchResults: [] }); }
  },

  setActive:   (entry) => set({ activeEntry: entry }),
  clearActive: ()      => set({ activeEntry: null }),
  clearError:  ()      => set({ error: null }),
}));

export default usePasswordStore;