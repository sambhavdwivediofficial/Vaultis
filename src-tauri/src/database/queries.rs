// ── Notes ──────────────────────────────────────────────────────────────────

pub const INSERT_NOTE: &str = "
    INSERT INTO notes (id, title_enc, content_enc, tags_enc, folder_id,
                       created_at, updated_at, is_trashed, trashed_at, color_enc, is_pinned)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
";

pub const SELECT_NOTE_BY_ID: &str = "
    SELECT id, title_enc, content_enc, tags_enc, folder_id,
           created_at, updated_at, is_trashed, trashed_at, color_enc, is_pinned
    FROM notes WHERE id = ?1
";

pub const SELECT_ALL_NOTES: &str = "
    SELECT id, title_enc, content_enc, tags_enc, folder_id,
           created_at, updated_at, is_trashed, trashed_at, color_enc, is_pinned
    FROM notes WHERE is_trashed = 0
    ORDER BY is_pinned DESC, updated_at DESC
";

pub const SELECT_TRASHED_NOTES: &str = "
    SELECT id, title_enc, content_enc, tags_enc, folder_id,
           created_at, updated_at, is_trashed, trashed_at, color_enc, is_pinned
    FROM notes WHERE is_trashed = 1
    ORDER BY trashed_at DESC
";

pub const UPDATE_NOTE: &str = "
    UPDATE notes
    SET title_enc = ?2, content_enc = ?3, tags_enc = ?4,
        folder_id = ?5, updated_at = ?6, color_enc = ?7, is_pinned = ?8
    WHERE id = ?1
";

pub const SOFT_DELETE_NOTE: &str = "
    UPDATE notes SET is_trashed = 1, trashed_at = ?2 WHERE id = ?1
";

pub const RESTORE_NOTE: &str = "
    UPDATE notes SET is_trashed = 0, trashed_at = NULL WHERE id = ?1
";

pub const HARD_DELETE_NOTE: &str = "DELETE FROM notes WHERE id = ?1";

// ── Files ──────────────────────────────────────────────────────────────────

pub const INSERT_FILE: &str = "
    INSERT INTO files (id, name_enc, mime_type_enc, original_size, original_hash_enc,
                       tags_enc, folder_id, created_at, updated_at, is_trashed, trashed_at, nonce_hex)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
";

pub const SELECT_FILE_BY_ID: &str = "
    SELECT id, name_enc, mime_type_enc, original_size, original_hash_enc,
           tags_enc, folder_id, created_at, updated_at, is_trashed, trashed_at, nonce_hex
    FROM files WHERE id = ?1
";

pub const SELECT_ALL_FILES: &str = "
    SELECT id, name_enc, mime_type_enc, original_size, original_hash_enc,
           tags_enc, folder_id, created_at, updated_at, is_trashed, trashed_at, nonce_hex
    FROM files WHERE is_trashed = 0
    ORDER BY created_at DESC
";

pub const SELECT_TRASHED_FILES: &str = "
    SELECT id, name_enc, mime_type_enc, original_size, original_hash_enc,
           tags_enc, folder_id, created_at, updated_at, is_trashed, trashed_at, nonce_hex
    FROM files WHERE is_trashed = 1
    ORDER BY trashed_at DESC
";

pub const SOFT_DELETE_FILE: &str = "
    UPDATE files SET is_trashed = 1, trashed_at = ?2 WHERE id = ?1
";

pub const RESTORE_FILE: &str = "
    UPDATE files SET is_trashed = 0, trashed_at = NULL WHERE id = ?1
";

pub const HARD_DELETE_FILE: &str = "DELETE FROM files WHERE id = ?1";

// ── Passwords ──────────────────────────────────────────────────────────────

pub const INSERT_PASSWORD: &str = "
    INSERT INTO passwords (id, name_enc, username_enc, password_enc, url_enc,
                           notes_enc, totp_secret_enc, tags_enc, folder_id,
                           created_at, updated_at, last_used_at, is_trashed,
                           trashed_at, is_favorite, password_strength)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
";

pub const SELECT_PASSWORD_BY_ID: &str = "
    SELECT id, name_enc, username_enc, password_enc, url_enc, notes_enc,
           totp_secret_enc, tags_enc, folder_id, created_at, updated_at,
           last_used_at, is_trashed, trashed_at, is_favorite, password_strength
    FROM passwords WHERE id = ?1
";

pub const SELECT_ALL_PASSWORDS: &str = "
    SELECT id, name_enc, username_enc, password_enc, url_enc, notes_enc,
           totp_secret_enc, tags_enc, folder_id, created_at, updated_at,
           last_used_at, is_trashed, trashed_at, is_favorite, password_strength
    FROM passwords WHERE is_trashed = 0
    ORDER BY is_favorite DESC, updated_at DESC
";

pub const SELECT_TRASHED_PASSWORDS: &str = "
    SELECT id, name_enc, username_enc, password_enc, url_enc, notes_enc,
           totp_secret_enc, tags_enc, folder_id, created_at, updated_at,
           last_used_at, is_trashed, trashed_at, is_favorite, password_strength
    FROM passwords WHERE is_trashed = 1
    ORDER BY trashed_at DESC
";

pub const UPDATE_PASSWORD: &str = "
    UPDATE passwords
    SET name_enc = ?2, username_enc = ?3, password_enc = ?4, url_enc = ?5,
        notes_enc = ?6, totp_secret_enc = ?7, tags_enc = ?8, folder_id = ?9,
        updated_at = ?10, is_favorite = ?11, password_strength = ?12
    WHERE id = ?1
";

pub const TOUCH_PASSWORD_USED: &str = "
    UPDATE passwords SET last_used_at = ?2 WHERE id = ?1
";

pub const SOFT_DELETE_PASSWORD: &str = "
    UPDATE passwords SET is_trashed = 1, trashed_at = ?2 WHERE id = ?1
";

pub const RESTORE_PASSWORD: &str = "
    UPDATE passwords SET is_trashed = 0, trashed_at = NULL WHERE id = ?1
";

pub const HARD_DELETE_PASSWORD: &str = "DELETE FROM passwords WHERE id = ?1";

// ── Tags ───────────────────────────────────────────────────────────────────

pub const INSERT_TAG: &str = "
    INSERT INTO tags (id, name_enc, color_enc, created_at)
    VALUES (?1, ?2, ?3, ?4)
";

pub const SELECT_ALL_TAGS: &str = "
    SELECT id, name_enc, color_enc, created_at FROM tags ORDER BY created_at ASC
";

pub const DELETE_TAG: &str = "DELETE FROM tags WHERE id = ?1";

// ── Settings ───────────────────────────────────────────────────────────────

pub const UPSERT_SETTING: &str = "
    INSERT INTO settings (key, value) VALUES (?1, ?2)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
";

pub const SELECT_SETTING: &str = "SELECT value FROM settings WHERE key = ?1";

pub const SELECT_ALL_SETTINGS: &str = "SELECT key, value FROM settings";

// ── Audit log ──────────────────────────────────────────────────────────────

pub const INSERT_AUDIT_LOG: &str = "
    INSERT INTO audit_log (event_type, entity_type, entity_id, occurred_at, details_enc)
    VALUES (?1, ?2, ?3, ?4, ?5)
";