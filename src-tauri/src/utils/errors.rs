use thiserror::Error;

/// Central error type for Vaultis.
/// Every module converts its errors into `VaultisError`.
#[derive(Debug, Error)]
pub enum VaultisError {
    // ── Vault errors ───────────────────────────────────────────────────────
    #[error("Vault does not exist — please create one first")]
    VaultNotFound,

    #[error("Vault is locked — please unlock first")]
    VaultLocked,

    #[error("Vault already exists")]
    VaultAlreadyExists,

    #[error("Invalid master password")]
    InvalidPassword,

    #[error("Vault integrity check failed — data may be corrupted")]
    IntegrityCheckFailed,

    // ── Crypto errors ──────────────────────────────────────────────────────
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),

    #[error("Decryption failed — wrong password or tampered data")]
    DecryptionFailed,

    #[error("Key derivation failed: {0}")]
    KeyDerivationFailed(String),

    #[error("Invalid key length — expected 32 bytes")]
    InvalidKeyLength,

    #[error("Recovery key is invalid or malformed")]
    InvalidRecoveryKey,

    // ── Database errors ────────────────────────────────────────────────────
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Database pool error: {0}")]
    DatabasePool(String),

    #[error("Record not found: {0}")]
    NotFound(String),

    #[error("Database migration failed: {0}")]
    MigrationFailed(String),

    // ── File errors ────────────────────────────────────────────────────────
    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("File read error: {0}")]
    FileReadError(String),

    #[error("File write error: {0}")]
    FileWriteError(String),

    #[error("File too large — maximum allowed size is {max_mb} MB")]
    FileTooLarge { max_mb: u64 },

    #[error("Unsupported file type: {0}")]
    UnsupportedFileType(String),

    #[error("Chunk processing error: {0}")]
    ChunkProcessingError(String),

    // ── Serialization errors ───────────────────────────────────────────────
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Invalid base64 encoding: {0}")]
    Base64Error(String),

    #[error("Invalid hex encoding: {0}")]
    HexError(String),

    // ── Session / Auth errors ──────────────────────────────────────────────
    #[error("Session expired — vault auto-locked")]
    SessionExpired,

    #[error("Too many failed attempts — try again in {seconds} seconds")]
    TooManyAttempts { seconds: u64 },

    #[error("Operation not permitted in read-only mode")]
    ReadOnlyMode,

    // ── Backup errors ──────────────────────────────────────────────────────
    #[error("Backup creation failed: {0}")]
    BackupFailed(String),

    #[error("Backup restoration failed: {0}")]
    RestoreFailed(String),

    #[error("Backup file is corrupted or invalid")]
    InvalidBackup,

    // ── Settings errors ────────────────────────────────────────────────────
    #[error("Invalid settings value: {0}")]
    InvalidSettings(String),

    // ── IO errors ─────────────────────────────────────────────────────────
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    // ── Generic ───────────────────────────────────────────────────────────
    #[error("Internal error: {0}")]
    Internal(String),
}

/// Convert `VaultisError` to a string that can be sent across the Tauri
/// command boundary (all Tauri commands return `Result<T, String>`).
impl From<VaultisError> for String {
    fn from(e: VaultisError) -> Self {
        e.to_string()
    }
}

impl From<r2d2::Error> for VaultisError {
    fn from(e: r2d2::Error) -> Self {
        VaultisError::DatabasePool(e.to_string())
    }
}

impl From<base64::DecodeError> for VaultisError {
    fn from(e: base64::DecodeError) -> Self {
        VaultisError::Base64Error(e.to_string())
    }
}

impl From<hex::FromHexError> for VaultisError {
    fn from(e: hex::FromHexError) -> Self {
        VaultisError::HexError(e.to_string())
    }
}

/// Shorthand Result type used throughout the codebase.
pub type VaultisResult<T> = Result<T, VaultisError>;