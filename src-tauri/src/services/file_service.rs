use std::path::{Path, PathBuf};
use chrono::Utc;
use uuid::Uuid;

use crate::{
    crypto::aes::{decrypt_string, encrypt_string},
    database::{connection::DbPool, queries::*},
    files::{
        file_decryptor::decrypt_file,
        file_encryptor::encrypt_file,
        metadata::{detect_mime_type, get_file_size},
    },
    models::file::{FileEntry, FilePlaintext, UploadFileRequest},
    utils::{
        errors::{VaultisError, VaultisResult},
        paths::get_encrypted_file_path,
    },
};

pub struct FileService;

impl FileService {
    /// Encrypt and store a file. Returns decrypted metadata.
    pub fn upload_file(
        pool: &DbPool,
        key: &[u8; 32],
        data_dir: &PathBuf,
        req: UploadFileRequest,
    ) -> VaultisResult<FilePlaintext> {
        let source = Path::new(&req.source_path);
        let file_id = Uuid::new_v4().to_string();
        let dest = get_encrypted_file_path(data_dir, &file_id)?;

        let original_size = get_file_size(source)?;
        let original_name = source
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unnamed")
            .to_string();
        let mime_type = detect_mime_type(source);

        let (nonce_hex, hash) = encrypt_file(key, source, &dest)?;

        let conn = pool.get()?;
        let now = Utc::now().to_rfc3339();

        let name_enc = encrypt_string(key, &original_name)?;
        let mime_enc = encrypt_string(key, &mime_type)?;
        let hash_enc = encrypt_string(key, &hash)?;
        let tags_enc = req
            .tags
            .as_ref()
            .map(|t| encrypt_string(key, &t.join(",")))
            .transpose()?;

        conn.execute(
            INSERT_FILE,
            rusqlite::params![
                &file_id,
                &name_enc,
                &mime_enc,
                original_size as i64,
                &hash_enc,
                &tags_enc,
                &req.folder_id,
                &now,
                &now,
                0i32,
                Option::<String>::None,
                &nonce_hex,
            ],
        )?;

        Ok(FilePlaintext {
            id: file_id,
            name: original_name,
            mime_type,
            original_size,
            original_hash: hash,
            tags: req.tags.unwrap_or_default(),
            folder_id: req.folder_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            is_trashed: false,
            trashed_at: None,
        })
    }

    pub fn get_file_metadata(
        pool: &DbPool,
        key: &[u8; 32],
        id: &str,
    ) -> VaultisResult<FilePlaintext> {
        let conn = pool.get()?;
        let entry = conn
            .query_row(SELECT_FILE_BY_ID, rusqlite::params![id], map_file_row)
            .map_err(|_| VaultisError::NotFound(format!("File {id}")))?;
        decrypt_file_meta(key, entry)
    }

    pub fn list_files(pool: &DbPool, key: &[u8; 32]) -> VaultisResult<Vec<FilePlaintext>> {
        let conn = pool.get()?;
        let mut stmt = conn.prepare(SELECT_ALL_FILES)?;
        let entries = stmt
            .query_map([], map_file_row)?
            .collect::<Result<Vec<_>, _>>()?;
        entries.into_iter().map(|e| decrypt_file_meta(key, e)).collect()
    }

    pub fn delete_file(pool: &DbPool, id: &str) -> VaultisResult<()> {
        let conn = pool.get()?;
        let now = Utc::now().to_rfc3339();
        conn.execute(SOFT_DELETE_FILE, rusqlite::params![id, &now])?;
        Ok(())
    }

    pub fn restore_file(pool: &DbPool, id: &str) -> VaultisResult<()> {
        let conn = pool.get()?;
        conn.execute(RESTORE_FILE, rusqlite::params![id])?;
        Ok(())
    }

    /// Decrypt and export a file to `export_dir / original_name`.
    pub fn export_file(
        pool: &DbPool,
        key: &[u8; 32],
        data_dir: &PathBuf,
        id: &str,
        export_dir: &PathBuf,
    ) -> VaultisResult<PathBuf> {
        let meta = Self::get_file_metadata(pool, key, id)?;
        let source = get_encrypted_file_path(data_dir, id)?;
        let dest = export_dir.join(&meta.name);
        decrypt_file(key, &source, &dest)?;
        Ok(dest)
    }

    pub fn search_files(
        pool: &DbPool,
        key: &[u8; 32],
        query: &str,
    ) -> VaultisResult<Vec<FilePlaintext>> {
        let all = Self::list_files(pool, key)?;
        let results = crate::vault::search_manager::search_files(&all, query);
        Ok(results.into_iter().cloned().collect())
    }
}

fn map_file_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<FileEntry> {
    Ok(FileEntry {
        id: row.get(0)?,
        name_enc: row.get(1)?,
        mime_type_enc: row.get(2)?,
        original_size: row.get::<_, i64>(3)? as u64,
        original_hash_enc: row.get(4)?,
        tags_enc: row.get(5)?,
        folder_id: row.get(6)?,
        created_at: parse_dt(&row.get::<_, String>(7)?),
        updated_at: parse_dt(&row.get::<_, String>(8)?),
        is_trashed: row.get::<_, i32>(9)? != 0,
        trashed_at: row.get::<_, Option<String>>(10)?.map(|s| parse_dt(&s)),
        nonce_hex: row.get(11)?,
    })
}

fn decrypt_file_meta(key: &[u8; 32], entry: FileEntry) -> VaultisResult<FilePlaintext> {
    Ok(FilePlaintext {
        id: entry.id,
        name: decrypt_string(key, &entry.name_enc)?,
        mime_type: decrypt_string(key, &entry.mime_type_enc)?,
        original_size: entry.original_size,
        original_hash: decrypt_string(key, &entry.original_hash_enc)?,
        tags: entry
            .tags_enc
            .as_ref()
            .map(|e| -> VaultisResult<Vec<String>> {
                Ok(decrypt_string(key, e)?
                    .split(',')
                    .map(|s| s.to_string())
                    .collect())
            })
            .transpose()?
            .unwrap_or_default(),
        folder_id: entry.folder_id,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        is_trashed: entry.is_trashed,
        trashed_at: entry.trashed_at,
    })
}

fn parse_dt(s: &str) -> chrono::DateTime<Utc> {
    chrono::DateTime::parse_from_rfc3339(s)
        .unwrap_or_default()
        .with_timezone(&Utc)
}