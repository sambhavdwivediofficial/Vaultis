use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// File metadata stored encrypted in the database.
/// The actual file bytes are stored separately as `<id>.valts`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub id: String,
    /// Encrypted original filename.
    pub name_enc: String,
    /// Encrypted MIME type.
    pub mime_type_enc: String,
    /// Original file size in bytes (not encrypted — used for quota/display).
    pub original_size: u64,
    /// Encrypted SHA-256 hash of the original file (for integrity verification).
    pub original_hash_enc: String,
    /// Encrypted tags.
    pub tags_enc: Option<String>,
    pub folder_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_trashed: bool,
    pub trashed_at: Option<DateTime<Utc>>,
    /// Encryption nonce stored in DB (hex); chunk nonces are embedded in the file.
    pub nonce_hex: String,
}

/// Decrypted file metadata returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilePlaintext {
    pub id: String,
    pub name: String,
    pub mime_type: String,
    pub original_size: u64,
    pub original_hash: String,
    pub tags: Vec<String>,
    pub folder_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_trashed: bool,
    pub trashed_at: Option<DateTime<Utc>>,
}

/// Payload from frontend to upload a new file.
#[derive(Debug, Deserialize)]
pub struct UploadFileRequest {
    /// Absolute path to the source file on disk.
    pub source_path: String,
    pub tags: Option<Vec<String>>,
    pub folder_id: Option<String>,
}