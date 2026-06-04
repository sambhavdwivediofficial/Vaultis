import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// ── Vault ─────────────────────────────────────────────────────────────────

export const tauriVault = {
  exists:         ()                         => invoke("vault_exists"),
  create:         (password, displayName)    => invoke("create_vault",          { password, displayName }),
  unlock:         (password, autoLockSecs)   => invoke("unlock_vault",          { password, autoLockSecs }),
  lock:           ()                         => invoke("lock_vault"),
  isUnlocked:     ()                         => invoke("vault_is_unlocked"),
  getInfo:        ()                         => invoke("get_vault_info"),
  changePassword: (currentPassword, newPassword) =>
    invoke("change_master_password", { currentPassword, newPassword }),
};

// ── Notes ─────────────────────────────────────────────────────────────────

export const tauriNotes = {
  create:  (title, content, tags, folderId, color) =>
    invoke("create_note", { title, content, tags, folderId, color }),
  get:     (id)       => invoke("get_note",     { id }),
  list:    ()         => invoke("list_notes"),
  listTrashed: ()     => invoke("list_trashed_notes"),
  update:  (id, title, content, tags, folderId, color, isPinned) =>
    invoke("update_note", { id, title, content, tags, folderId, color, isPinned }),
  delete:  (id)       => invoke("delete_note",  { id }),
  restore: (id)       => invoke("restore_note", { id }),
  search:  (query)    => invoke("search_notes", { query }),
};

// ── Passwords ─────────────────────────────────────────────────────────────

export const tauriPasswords = {
  create:   (name, username, password, url, notes, totpSecret, tags, folderId, isFavorite) =>
    invoke("create_password", { name, username, password, url, notes, totpSecret, tags, folderId, isFavorite }),
  get:      (id)     => invoke("get_password",      { id }),
  list:     ()       => invoke("list_passwords"),
  listTrashed: ()    => invoke("list_trashed_passwords"),
  update:   (id, name, username, password, url, notes, totpSecret, tags, folderId, isFavorite) =>
    invoke("update_password", { id, name, username, password, url, notes, totpSecret, tags, folderId, isFavorite }),
  delete:   (id)     => invoke("delete_password",   { id }),
  restore:  (id)     => invoke("restore_password",  { id }),
  search:   (query)  => invoke("search_passwords",  { query }),
  generate: (length, uppercase, lowercase, digits, symbols, excludeAmbiguous) =>
    invoke("generate_password", { length, uppercase, lowercase, digits, symbols, excludeAmbiguous }),
};

// ── Files ─────────────────────────────────────────────────────────────────

export const tauriFiles = {
  upload:      (sourcePath, tags, folderId) =>
    invoke("upload_file",       { sourcePath, tags, folderId }),
  getMeta:     (id)            => invoke("get_file_metadata", { id }),
  list:        ()              => invoke("list_files"),
  listTrashed: ()              => invoke("list_trashed_files"),
  delete:      (id)            => invoke("delete_file",       { id }),
  restore:     (id)            => invoke("restore_file",      { id }),
  export:      (id, exportDir) => invoke("export_file",       { id, exportDir }),
  search:      (query)         => invoke("search_files",      { query }),
};

// ── Settings ──────────────────────────────────────────────────────────────

export const tauriSettings = {
  get:    ()         => invoke("get_settings"),
  update: (settings) => invoke("update_settings", { settings }),
  reset:  ()         => invoke("reset_settings"),
};

// ── Backup ────────────────────────────────────────────────────────────────

export const tauriBackup = {
  create: (options) => invoke("create_backup", options),
  restore: (backupPath, options) => invoke("restore_backup", { 
    backupPath, 
    password: options?.password,
    includeMetadata: options?.includeMetadata 
  }),
  
  list:    ()           => invoke("list_backups"),
  delete:  (backupPath) => invoke("delete_backup",  { backupPath }),
  export:  (destDir)    => invoke("export_vault",   { destDir }),
};

// ── Events ────────────────────────────────────────────────────────────────

export const vaultEvents = {
  onAutoLocked:      (cb) => listen("vault:auto-locked",      cb),
  onEmergencyLocked: (cb) => listen("vault:emergency-locked", cb),
};