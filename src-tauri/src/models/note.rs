use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// A note stored encrypted in the database.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    /// Encrypted title (base64 blob).
    pub title_enc: String,
    /// Encrypted content (base64 blob).
    pub content_enc: String,
    /// Comma-separated tag ids (stored encrypted).
    pub tags_enc: Option<String>,
    /// Folder id this note belongs to (nullable).
    pub folder_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_trashed: bool,
    pub trashed_at: Option<DateTime<Utc>>,
    /// Color accent for the card (stored encrypted).
    pub color_enc: Option<String>,
    /// Whether the note is pinned to the top.
    pub is_pinned: bool,
}

/// Decrypted note returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotePlaintext {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub folder_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_trashed: bool,
    pub trashed_at: Option<DateTime<Utc>>,
    pub color: Option<String>,
    pub is_pinned: bool,
}

/// Payload for creating a new note.
#[derive(Debug, Deserialize)]
pub struct CreateNoteRequest {
    pub title: String,
    pub content: String,
    pub tags: Option<Vec<String>>,
    pub folder_id: Option<String>,
    pub color: Option<String>,
}

/// Payload for updating an existing note.
#[derive(Debug, Deserialize)]
pub struct UpdateNoteRequest {
    pub id: String,
    pub title: Option<String>,
    pub content: Option<String>,
    pub tags: Option<Vec<String>>,
    pub folder_id: Option<String>,
    pub color: Option<String>,
    pub is_pinned: Option<bool>,
}