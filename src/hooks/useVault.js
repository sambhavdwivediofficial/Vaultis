import { useMemo } from "react";
import useNoteStore      from "../store/noteStore.js";
import usePasswordStore  from "../store/passwordStore.js";
import useFileStore      from "../store/fileStore.js";
import useAuthStore      from "../store/authStore.js";

/**
 * High-level vault stats and combined data access.
 */
export function useVault() {
  const notes      = useNoteStore(s => s.notes);
  const passwords  = usePasswordStore(s => s.passwords);
  const files      = useFileStore(s => s.files);
  const vaultInfo  = useAuthStore(s => s.vaultInfo);
  const isUnlocked = useAuthStore(s => s.isUnlocked);

  const stats = useMemo(() => {
    const deletedNotes     = notes.filter(n => n.deleted_at);
    const deletedPasswords = passwords.filter(p => p.deleted_at);
    const deletedFiles     = files.filter(f => f.deleted_at);
    const trashCount       = deletedNotes.length + deletedPasswords.length + deletedFiles.length;

    const favoritePasswords = passwords.filter(p => p.is_favorite && !p.deleted_at);
    const pinnedNotes       = notes.filter(n => n.is_pinned && !n.deleted_at);

    const totalFileSize = files
      .filter(f => !f.deleted_at)
      .reduce((acc, f) => acc + (f.original_size || 0), 0);

    const weakPasswords = passwords
      .filter(p => !p.deleted_at && (p.password_strength ?? 0) <= 1);

    const allTags = new Set();
    [...notes, ...passwords, ...files].forEach(item => {
      item.tags?.forEach(t => allTags.add(t));
    });

    return {
      noteCount:         notes.filter(n => !n.deleted_at).length,
      passwordCount:     passwords.filter(p => !p.deleted_at).length,
      fileCount:         files.filter(f => !f.deleted_at).length,
      trashCount,
      favoritePasswords: favoritePasswords.length,
      pinnedNotes:       pinnedNotes.length,
      totalFileSize,
      weakPasswordCount: weakPasswords.length,
      tagCount:          allTags.size,
    };
  }, [notes, passwords, files]);

  return {
    stats,
    vaultInfo,
    isUnlocked,
    notes:     notes.filter(n => !n.deleted_at),
    passwords: passwords.filter(p => !p.deleted_at),
    files:     files.filter(f => !f.deleted_at),
  };
}