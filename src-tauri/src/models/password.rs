use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// A password entry stored encrypted in the database.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordEntry {
    pub id: String,
    /// Encrypted service/site name.
    pub name_enc: String,
    /// Encrypted username/email.
    pub username_enc: String,
    /// Encrypted password.
    pub password_enc: String,
    /// Encrypted URL (optional).
    pub url_enc: Option<String>,
    /// Encrypted notes/comments (optional).
    pub notes_enc: Option<String>,
    /// Encrypted TOTP secret (optional, for future 2FA support).
    pub totp_secret_enc: Option<String>,
    /// Comma-separated tag ids (encrypted).
    pub tags_enc: Option<String>,
    pub folder_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
    pub is_trashed: bool,
    pub trashed_at: Option<DateTime<Utc>>,
    pub is_favorite: bool,
    pub password_strength: Option<u8>,
}

/// Decrypted password entry returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordPlaintext {
    pub id: String,
    pub name: String,
    pub username: String,
    pub password: String,
    pub url: Option<String>,
    pub notes: Option<String>,
    pub totp_secret: Option<String>,
    pub tags: Vec<String>,
    pub folder_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
    pub is_trashed: bool,
    pub trashed_at: Option<DateTime<Utc>>,
    pub is_favorite: bool,
    pub password_strength: Option<u8>,
}

/// Payload for creating a password entry.
#[derive(Debug, Deserialize)]
pub struct CreatePasswordRequest {
    pub name: String,
    pub username: String,
    pub password: String,
    pub url: Option<String>,
    pub notes: Option<String>,
    pub totp_secret: Option<String>,
    pub tags: Option<Vec<String>>,
    pub folder_id: Option<String>,
    pub is_favorite: Option<bool>,
}

/// Payload for updating a password entry.
#[derive(Debug, Deserialize)]
pub struct UpdatePasswordRequest {
    pub id: String,
    pub name: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub url: Option<String>,
    pub notes: Option<String>,
    pub totp_secret: Option<String>,
    pub tags: Option<Vec<String>>,
    pub folder_id: Option<String>,
    pub is_favorite: Option<bool>,
}

/// Options for the built-in password generator.
#[derive(Debug, Deserialize)]
pub struct GeneratePasswordOptions {
    pub length: usize,
    pub uppercase: bool,
    pub lowercase: bool,
    pub digits: bool,
    pub symbols: bool,
    pub exclude_ambiguous: bool,
}