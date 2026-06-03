use chrono::Utc;
use uuid::Uuid;

use crate::{
    crypto::aes::{decrypt_string, encrypt_string},
    database::{connection::DbPool, queries::*},
    models::note::{
        CreateNoteRequest, Note, NotePlaintext, UpdateNoteRequest,
    },
    utils::errors::{VaultisError, VaultisResult},
};

pub struct NoteService;

impl NoteService {
    /// Encrypt a plaintext note and insert it into the database.
    pub fn create_note(
        pool: &DbPool,
        key: &[u8; 32],
        req: CreateNoteRequest,
    ) -> VaultisResult<NotePlaintext> {
        let conn = pool.get()?;
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let title_enc = encrypt_string(key, &req.title)?;
        let content_enc = encrypt_string(key, &req.content)?;
        let tags_enc = if let Some(tags) = &req.tags {
            Some(encrypt_string(key, &tags.join(","))?)
        } else {
            None
        };
        let color_enc = req.color.as_ref().map(|c| encrypt_string(key, c)).transpose()?;

        conn.execute(
            INSERT_NOTE,
            rusqlite::params![
                &id,
                &title_enc,
                &content_enc,
                &tags_enc,
                &req.folder_id,
                &now,
                &now,
                0i32,
                Option::<String>::None,
                &color_enc,
                0i32,
            ],
        )?;

        Ok(NotePlaintext {
            id,
            title: req.title,
            content: req.content,
            tags: req.tags.unwrap_or_default(),
            folder_id: req.folder_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            is_trashed: false,
            trashed_at: None,
            color: req.color,
            is_pinned: false,
        })
    }

    /// Fetch and decrypt a single note by ID.
    pub fn get_note(pool: &DbPool, key: &[u8; 32], id: &str) -> VaultisResult<NotePlaintext> {
        let conn = pool.get()?;
        let note = conn
            .query_row(SELECT_NOTE_BY_ID, rusqlite::params![id], |row| {
                Ok(Note {
                    id: row.get(0)?,
                    title_enc: row.get(1)?,
                    content_enc: row.get(2)?,
                    tags_enc: row.get(3)?,
                    folder_id: row.get(4)?,
                    created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                        .unwrap_or_default()
                        .with_timezone(&Utc),
                    updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                        .unwrap_or_default()
                        .with_timezone(&Utc),
                    is_trashed: row.get::<_, i32>(7)? != 0,
                    trashed_at: row.get::<_, Option<String>>(8)?.and_then(|s| {
                        chrono::DateTime::parse_from_rfc3339(&s)
                            .ok()
                            .map(|dt| dt.with_timezone(&Utc))
                    }),
                    color_enc: row.get(9)?,
                    is_pinned: row.get::<_, i32>(10)? != 0,
                })
            })
            .map_err(|_| VaultisError::NotFound(format!("Note {id}")))?;

        decrypt_note(key, note)
    }

    /// List all non-trashed notes (decrypted).
    pub fn list_notes(pool: &DbPool, key: &[u8; 32]) -> VaultisResult<Vec<NotePlaintext>> {
        let conn = pool.get()?;
        let mut stmt = conn.prepare(SELECT_ALL_NOTES)?;
        let notes = stmt
            .query_map([], |row| {
                Ok(Note {
                    id: row.get(0)?,
                    title_enc: row.get(1)?,
                    content_enc: row.get(2)?,
                    tags_enc: row.get(3)?,
                    folder_id: row.get(4)?,
                    created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                        .unwrap_or_default()
                        .with_timezone(&Utc),
                    updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                        .unwrap_or_default()
                        .with_timezone(&Utc),
                    is_trashed: row.get::<_, i32>(7)? != 0,
                    trashed_at: row.get::<_, Option<String>>(8)?.and_then(|s| {
                        chrono::DateTime::parse_from_rfc3339(&s)
                            .ok()
                            .map(|dt| dt.with_timezone(&Utc))
                    }),
                    color_enc: row.get(9)?,
                    is_pinned: row.get::<_, i32>(10)? != 0,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        notes.into_iter().map(|n| decrypt_note(key, n)).collect()
    }

    /// List all TRASHED notes (decrypted).
    pub fn list_trashed_notes(pool: &DbPool, key: &[u8; 32]) -> VaultisResult<Vec<NotePlaintext>> {
        let conn = pool.get()?;
        let mut stmt = conn.prepare(SELECT_TRASHED_NOTES)?;
        let notes = stmt
            .query_map([], |row| {
                Ok(Note {
                    id: row.get(0)?,
                    title_enc: row.get(1)?,
                    content_enc: row.get(2)?,
                    tags_enc: row.get(3)?,
                    folder_id: row.get(4)?,
                    created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                        .unwrap_or_default()
                        .with_timezone(&Utc),
                    updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                        .unwrap_or_default()
                        .with_timezone(&Utc),
                    is_trashed: row.get::<_, i32>(7)? != 0,
                    trashed_at: row.get::<_, Option<String>>(8)?.and_then(|s| {
                        chrono::DateTime::parse_from_rfc3339(&s)
                            .ok()
                            .map(|dt| dt.with_timezone(&Utc))
                    }),
                    color_enc: row.get(9)?,
                    is_pinned: row.get::<_, i32>(10)? != 0,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        notes.into_iter().map(|n| decrypt_note(key, n)).collect()
    }

    /// Update an existing note.
    pub fn update_note(
        pool: &DbPool,
        key: &[u8; 32],
        req: UpdateNoteRequest,
    ) -> VaultisResult<NotePlaintext> {
        let existing = Self::get_note(pool, key, &req.id)?;
        let conn = pool.get()?;

        let title = req.title.as_deref().unwrap_or(&existing.title);
        let content = req.content.as_deref().unwrap_or(&existing.content);
        let tags = req.tags.as_ref().cloned().unwrap_or(existing.tags.clone());
        let color = req.color.as_ref().or(existing.color.as_ref());
        let is_pinned = req.is_pinned.unwrap_or(existing.is_pinned);
        let folder_id = req.folder_id.as_ref().or(existing.folder_id.as_ref());
        let now = Utc::now().to_rfc3339();

        let title_enc = encrypt_string(key, title)?;
        let content_enc = encrypt_string(key, content)?;
        let tags_enc = if tags.is_empty() {
            None
        } else {
            Some(encrypt_string(key, &tags.join(","))?)
        };
        let color_enc = color.map(|c| encrypt_string(key, c)).transpose()?;

        conn.execute(
            UPDATE_NOTE,
            rusqlite::params![
                &req.id,
                &title_enc,
                &content_enc,
                &tags_enc,
                &folder_id,
                &now,
                &color_enc,
                is_pinned as i32,
            ],
        )?;

        Self::get_note(pool, key, &req.id)
    }

    /// Soft-delete a note (moves to trash).
    pub fn delete_note(pool: &DbPool, id: &str) -> VaultisResult<()> {
        let conn = pool.get()?;
        let now = Utc::now().to_rfc3339();
        conn.execute(SOFT_DELETE_NOTE, rusqlite::params![id, &now])?;
        Ok(())
    }

    /// Restore a note from trash.
    pub fn restore_note(pool: &DbPool, id: &str) -> VaultisResult<()> {
        let conn = pool.get()?;
        conn.execute(RESTORE_NOTE, rusqlite::params![id])?;
        Ok(())
    }

    /// Search decrypted notes by query string.
    pub fn search_notes(
        pool: &DbPool,
        key: &[u8; 32],
        query: &str,
    ) -> VaultisResult<Vec<NotePlaintext>> {
        let all = Self::list_notes(pool, key)?;
        let results = crate::vault::search_manager::search_notes(&all, query);
        Ok(results.into_iter().cloned().collect())
    }
}

/// Decrypt a single `Note` into a `NotePlaintext`.
fn decrypt_note(key: &[u8; 32], note: Note) -> VaultisResult<NotePlaintext> {
    let title = decrypt_string(key, &note.title_enc)?;
    let content = decrypt_string(key, &note.content_enc)?;
    let tags = if let Some(enc) = &note.tags_enc {
        let raw = decrypt_string(key, enc)?;
        raw.split(',').map(|s| s.to_string()).collect()
    } else {
        vec![]
    };
    let color = note
        .color_enc
        .as_ref()
        .map(|enc| decrypt_string(key, enc))
        .transpose()?;

    Ok(NotePlaintext {
        id: note.id,
        title,
        content,
        tags,
        folder_id: note.folder_id,
        created_at: note.created_at,
        updated_at: note.updated_at,
        is_trashed: note.is_trashed,
        trashed_at: note.trashed_at,
        color,
        is_pinned: note.is_pinned,
    })
}