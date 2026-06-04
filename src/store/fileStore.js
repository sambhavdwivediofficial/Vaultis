import { create } from "zustand";
import { tauriFiles } from "../services/tauriBridge.js";

const useFileStore = create((set, get) => ({
  files:         [],
  isLoading:     false,
  isUploading:   false,
  error:         null,
  uploadProgress: 0,
  searchResults: [],

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const files = await tauriFiles.list();
      set({ files, isLoading: false });
    } catch (e) {
      set({ error: e?.message || String(e), isLoading: false });
    }
  },

  upload: async (sourcePath, tags, folderId) => {
    set({ isUploading: true, uploadProgress: 0, error: null });
    try {
      const file = await tauriFiles.upload(sourcePath, tags, folderId);
      set(s => ({ files: [file, ...s.files], isUploading: false, uploadProgress: 100 }));
      return { ok: true, file };
    } catch (e) {
      const msg = e?.message || String(e);
      set({ error: msg, isUploading: false });
      return { ok: false, error: msg };
    }
  },

  delete: async (id) => {
    try {
      await tauriFiles.delete(id);
      set(s => ({ files: s.files.filter(f => f.id !== id) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },

  restore: async (id) => {
    try {
      await tauriFiles.restore(id);
      await get().fetch();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },

  exportFile: async (id, exportDir) => {
    try {
      const path = await tauriFiles.export(id, exportDir);
      return { ok: true, path };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },

  search: async (query) => {
    if (!query.trim()) { set({ searchResults: [] }); return; }
    try {
      const results = await tauriFiles.search(query);
      set({ searchResults: results });
    } catch { set({ searchResults: [] }); }
  },

  clearError: () => set({ error: null }),
}));

export default useFileStore;