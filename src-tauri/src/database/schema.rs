/// SQL to create all Vaultis tables.
/// Run once during initial setup / migration.
pub const CREATE_TABLES_SQL: &str = r#"
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- ── Notes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
    id              TEXT    PRIMARY KEY NOT NULL,
    title_enc       TEXT    NOT NULL,
    content_enc     TEXT    NOT NULL,
    tags_enc        TEXT,
    folder_id       TEXT,
    created_at      TEXT    NOT NULL,
    updated_at      TEXT    NOT NULL,
    is_trashed      INTEGER NOT NULL DEFAULT 0,
    trashed_at      TEXT,
    color_enc       TEXT,
    is_pinned       INTEGER NOT NULL DEFAULT 0
);

-- ── Files ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
    id              TEXT    PRIMARY KEY NOT NULL,
    name_enc        TEXT    NOT NULL,
    mime_type_enc   TEXT    NOT NULL,
    original_size   INTEGER NOT NULL DEFAULT 0,
    original_hash_enc TEXT  NOT NULL,
    tags_enc        TEXT,
    folder_id       TEXT,
    created_at      TEXT    NOT NULL,
    updated_at      TEXT    NOT NULL,
    is_trashed      INTEGER NOT NULL DEFAULT 0,
    trashed_at      TEXT,
    nonce_hex       TEXT    NOT NULL
);

-- ── Passwords ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS passwords (
    id                  TEXT    PRIMARY KEY NOT NULL,
    name_enc            TEXT    NOT NULL,
    username_enc        TEXT    NOT NULL,
    password_enc        TEXT    NOT NULL,
    url_enc             TEXT,
    notes_enc           TEXT,
    totp_secret_enc     TEXT,
    tags_enc            TEXT,
    folder_id           TEXT,
    created_at          TEXT    NOT NULL,
    updated_at          TEXT    NOT NULL,
    last_used_at        TEXT,
    is_trashed          INTEGER NOT NULL DEFAULT 0,
    trashed_at          TEXT,
    is_favorite         INTEGER NOT NULL DEFAULT 0,
    password_strength   INTEGER
);

-- ── Tags ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
    id          TEXT    PRIMARY KEY NOT NULL,
    name_enc    TEXT    NOT NULL,
    color_enc   TEXT,
    created_at  TEXT    NOT NULL
);

-- ── Folders ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
    id          TEXT    PRIMARY KEY NOT NULL,
    name_enc    TEXT    NOT NULL,
    parent_id   TEXT,
    color_enc   TEXT,
    icon_enc    TEXT,
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- ── Settings ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    key     TEXT    PRIMARY KEY NOT NULL,
    value   TEXT    NOT NULL
);

-- ── Audit Log ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type  TEXT    NOT NULL,
    entity_type TEXT,
    entity_id   TEXT,
    occurred_at TEXT    NOT NULL,
    details_enc TEXT
);

-- ── Indices ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notes_folder        ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_trashed       ON notes(is_trashed);
CREATE INDEX IF NOT EXISTS idx_notes_pinned        ON notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_files_folder        ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_trashed       ON files(is_trashed);
CREATE INDEX IF NOT EXISTS idx_passwords_folder    ON passwords(folder_id);
CREATE INDEX IF NOT EXISTS idx_passwords_trashed   ON passwords(is_trashed);
CREATE INDEX IF NOT EXISTS idx_passwords_favorite  ON passwords(is_favorite);
CREATE INDEX IF NOT EXISTS idx_folders_parent      ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_audit_event         ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_occurred      ON audit_log(occurred_at);
"#;