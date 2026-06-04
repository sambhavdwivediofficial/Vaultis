import { create } from "zustand";
import { tauriNotes } from "../services/tauriBridge.js";

const useNoteStore = create((set, get) => ({
  notes:      [],
  activeNote: null,
  isLoading:  false,
  isSaving:   false,
  error:      null,
  searchQuery: "",
  searchResults: [],
  isSearching: false,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const notes = await tauriNotes.list();
      set({ notes, isLoading: false });
    } catch (e) {
      set({ error: e?.message || String(e), isLoading: false });
    }
  },

  fetchOne: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const note = await tauriNotes.get(id);
      set({ activeNote: note, isLoading: false });
      return note;
    } catch (e) {
      set({ error: e?.message || String(e), isLoading: false });
      return null;
    }
  },

  create: async ({ title, content, tags, folderId, color }) => {
    set({ isSaving: true, error: null });
    try {
      const note = await tauriNotes.create(title, content, tags, folderId, color);
      set(s => ({ notes: [note, ...s.notes], activeNote: note, isSaving: false }));
      return { ok: true, note };
    } catch (e) {
      const msg = e?.message || String(e);
      set({ error: msg, isSaving: false });
      return { ok: false, error: msg };
    }
  },

  update: async ({ id, title, content, tags, folderId, color, isPinned }) => {
    set({ isSaving: true, error: null });
    try {
      const updated = await tauriNotes.update(id, title, content, tags, folderId, color, isPinned);
      set(s => ({
        notes: s.notes.map(n => n.id === id ? updated : n),
        activeNote: s.activeNote?.id === id ? updated : s.activeNote,
        isSaving: false,
      }));
      return { ok: true, note: updated };
    } catch (e) {
      const msg = e?.message || String(e);
      set({ error: msg, isSaving: false });
      return { ok: false, error: msg };
    }
  },

  delete: async (id) => {
    try {
      await tauriNotes.delete(id);
      set(s => ({
        notes: s.notes.filter(n => n.id !== id),
        activeNote: s.activeNote?.id === id ? null : s.activeNote,
      }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },

  restore: async (id) => {
    try {
      await tauriNotes.restore(id);
      await get().fetch();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },

  search: async (query) => {
  set({ searchQuery: query, isSearching: true });

  if (!query.trim()) {
    set({ searchResults: [], isSearching: false });
    return [];
  }

  try {
    const results = await tauriNotes.search(query);

    set({
      searchResults: results,
      isSearching: false,
    });

    return results; // ← YE MISSING HAI
  } catch {
    set({
      searchResults: [],
      isSearching: false,
    });

    return []; // ← YE BHI ADD KARO
  }
},

  setActive:   (note) => set({ activeNote: note }),
  clearActive: ()     => set({ activeNote: null }),
  clearError:  ()     => set({ error: null }),
}));

export default useNoteStore;