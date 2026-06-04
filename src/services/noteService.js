import { tauriNotes } from "./tauriBridge.js";

export const noteService = {
  list:    ()       => tauriNotes.list(),
  get:     (id)     => tauriNotes.get(id),
  search:  (query)  => tauriNotes.search(query),

  create: ({ title, content = "", tags = [], folderId = null, color = null }) =>
    tauriNotes.create(title, content, tags, folderId, color),

  update: ({ id, title, content, tags, folderId, color, isPinned }) =>
    tauriNotes.update(id, title, content, tags, folderId, color, isPinned),

  delete:  (id) => tauriNotes.delete(id),
  restore: (id) => tauriNotes.restore(id),
};