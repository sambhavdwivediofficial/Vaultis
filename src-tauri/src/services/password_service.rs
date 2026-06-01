use chrono::Utc;
use uuid::Uuid;

use crate::{
    crypto::aes::{decrypt_string, encrypt_string},
    crypto::random::secure_random_password,
    database::{connection::DbPool, queries::*},
    models::password::{
        CreatePasswordRequest, GeneratePasswordOptions, PasswordEntry, PasswordPlaintext,
        UpdatePasswordRequest,
    },
    utils::errors::{VaultisError, VaultisResult},
};

pub struct PasswordService;

impl PasswordService {
    pub fn create_password(
        pool: &DbPool,
        key: &[u8; 32],
        req: CreatePasswordRequest,
    ) -> VaultisResult<PasswordPlaintext> {
        let conn = pool.get()?;
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let strength = compute_strength(&req.password);

        let name_enc = encrypt_string(key, &req.name)?;
        let username_enc = encrypt_string(key, &req.username)?;
        let password_enc = encrypt_string(key, &req.password)?;
        let url_enc = req.url.as_ref().map(|u| encrypt_string(key, u)).transpose()?;
        let notes_enc = req.notes.as_ref().map(|n| encrypt_string(key, n)).transpose()?;
        let totp_enc = req.totp_secret.as_ref().map(|t| encrypt_string(key, t)).transpose()?;
        let tags_enc = req.tags.as_ref().map(|t| encrypt_string(key, &t.join(","))).transpose()?;

        conn.execute(
            INSERT_PASSWORD,
            rusqlite::params![
                &id,
                &name_enc,
                &username_enc,
                &password_enc,
                &url_enc,
                &notes_enc,
                &totp_enc,
                &tags_enc,
                &req.folder_id,
                &now,
                &now,
                Option::<String>::None,
                0i32,
                Option::<String>::None,
                req.is_favorite.unwrap_or(false) as i32,
                strength,
            ],
        )?;

        Ok(PasswordPlaintext {
            id,
            name: req.name,
            username: req.username,
            password: req.password,
            url: req.url,
            notes: req.notes,
            totp_secret: req.totp_secret,
            tags: req.tags.unwrap_or_default(),
            folder_id: req.folder_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            last_used_at: None,
            is_trashed: false,
            trashed_at: None,
            is_favorite: req.is_favorite.unwrap_or(false),
            password_strength: strength,
        })
    }

    pub fn get_password(
        pool: &DbPool,
        key: &[u8; 32],
        id: &str,
    ) -> VaultisResult<PasswordPlaintext> {
        let conn = pool.get()?;
        let entry = conn
            .query_row(SELECT_PASSWORD_BY_ID, rusqlite::params![id], |row| {
                Ok(PasswordEntry {
                    id: row.get(0)?,
                    name_enc: row.get(1)?,
                    username_enc: row.get(2)?,
                    password_enc: row.get(3)?,
                    url_enc: row.get(4)?,
                    notes_enc: row.get(5)?,
                    totp_secret_enc: row.get(6)?,
                    tags_enc: row.get(7)?,
                    folder_id: row.get(8)?,
                    created_at: parse_dt(&row.get::<_, String>(9)?),
                    updated_at: parse_dt(&row.get::<_, String>(10)?),
                    last_used_at: row.get::<_, Option<String>>(11)?.map(|s| parse_dt(&s)),
                    is_trashed: row.get::<_, i32>(12)? != 0,
                    trashed_at: row.get::<_, Option<String>>(13)?.map(|s| parse_dt(&s)),
                    is_favorite: row.get::<_, i32>(14)? != 0,
                    password_strength: row.get(15)?,
                })
            })
            .map_err(|_| VaultisError::NotFound(format!("Password {id}")))?;

        // Update last_used_at
        let now = Utc::now().to_rfc3339();
        conn.execute(TOUCH_PASSWORD_USED, rusqlite::params![id, &now])?;

        decrypt_password(key, entry)
    }

    pub fn list_passwords(
        pool: &DbPool,
        key: &[u8; 32],
    ) -> VaultisResult<Vec<PasswordPlaintext>> {
        let conn = pool.get()?;
        let mut stmt = conn.prepare(SELECT_ALL_PASSWORDS)?;
        let entries = stmt
            .query_map([], |row| {
                Ok(PasswordEntry {
                    id: row.get(0)?,
                    name_enc: row.get(1)?,
                    username_enc: row.get(2)?,
                    password_enc: row.get(3)?,
                    url_enc: row.get(4)?,
                    notes_enc: row.get(5)?,
                    totp_secret_enc: row.get(6)?,
                    tags_enc: row.get(7)?,
                    folder_id: row.get(8)?,
                    created_at: parse_dt(&row.get::<_, String>(9)?),
                    updated_at: parse_dt(&row.get::<_, String>(10)?),
                    last_used_at: row.get::<_, Option<String>>(11)?.map(|s| parse_dt(&s)),
                    is_trashed: row.get::<_, i32>(12)? != 0,
                    trashed_at: row.get::<_, Option<String>>(13)?.map(|s| parse_dt(&s)),
                    is_favorite: row.get::<_, i32>(14)? != 0,
                    password_strength: row.get(15)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        entries.into_iter().map(|e| decrypt_password(key, e)).collect()
    }

    pub fn update_password(
        pool: &DbPool,
        key: &[u8; 32],
        req: UpdatePasswordRequest,
    ) -> VaultisResult<PasswordPlaintext> {
        let existing = Self::get_password(pool, key, &req.id)?;
        let conn = pool.get()?;

        let name = req.name.as_deref().unwrap_or(&existing.name);
        let username = req.username.as_deref().unwrap_or(&existing.username);
        let password = req.password.as_deref().unwrap_or(&existing.password);
        let strength = compute_strength(password);
        let now = Utc::now().to_rfc3339();

        let name_enc = encrypt_string(key, name)?;
        let username_enc = encrypt_string(key, username)?;
        let password_enc = encrypt_string(key, password)?;
        let url_enc = req
            .url
            .as_ref()
            .or(existing.url.as_ref())
            .map(|u| encrypt_string(key, u))
            .transpose()?;
        let notes_enc = req
            .notes
            .as_ref()
            .or(existing.notes.as_ref())
            .map(|n| encrypt_string(key, n))
            .transpose()?;
        let totp_enc = req
            .totp_secret
            .as_ref()
            .or(existing.totp_secret.as_ref())
            .map(|t| encrypt_string(key, t))
            .transpose()?;
        let tags = req.tags.as_ref().cloned().unwrap_or(existing.tags.clone());
        let tags_enc = if tags.is_empty() {
            None
        } else {
            Some(encrypt_string(key, &tags.join(","))?)
        };
        let is_favorite = req.is_favorite.unwrap_or(existing.is_favorite);

        conn.execute(
            UPDATE_PASSWORD,
            rusqlite::params![
                &req.id,
                &name_enc,
                &username_enc,
                &password_enc,
                &url_enc,
                &notes_enc,
                &totp_enc,
                &tags_enc,
                &req.folder_id.or(existing.folder_id),
                &now,
                is_favorite as i32,
                strength,
            ],
        )?;

        Self::list_passwords(pool, key)?
            .into_iter()
            .find(|p| p.id == req.id)
            .ok_or_else(|| VaultisError::NotFound(req.id.clone()))
    }

    pub fn delete_password(pool: &DbPool, id: &str) -> VaultisResult<()> {
        let conn = pool.get()?;
        let now = Utc::now().to_rfc3339();
        conn.execute(SOFT_DELETE_PASSWORD, rusqlite::params![id, &now])?;
        Ok(())
    }

    pub fn restore_password(pool: &DbPool, id: &str) -> VaultisResult<()> {
        let conn = pool.get()?;
        conn.execute(RESTORE_PASSWORD, rusqlite::params![id])?;
        Ok(())
    }

    pub fn search_passwords(
        pool: &DbPool,
        key: &[u8; 32],
        query: &str,
    ) -> VaultisResult<Vec<PasswordPlaintext>> {
        let all = Self::list_passwords(pool, key)?;
        let results = crate::vault::search_manager::search_passwords(&all, query);
        Ok(results.into_iter().cloned().collect())
    }

    /// Generate a secure password using the given options.
    pub fn generate_password(opts: GeneratePasswordOptions) -> VaultisResult<String> {
        let mut charset: Vec<u8> = Vec::new();
        let ambiguous = b"0O1lI";

        if opts.uppercase {
            charset.extend_from_slice(b"ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        }
        if opts.lowercase {
            charset.extend_from_slice(b"abcdefghijklmnopqrstuvwxyz");
        }
        if opts.digits {
            charset.extend_from_slice(b"0123456789");
        }
        if opts.symbols {
            charset.extend_from_slice(b"!@#$%^&*()-_=+[]{}|;:,.<>?");
        }

        if opts.exclude_ambiguous {
            charset.retain(|c| !ambiguous.contains(c));
        }

        if charset.is_empty() {
            charset.extend_from_slice(b"abcdefghijklmnopqrstuvwxyz0123456789");
        }

        let len = opts.length.clamp(8, 128);
        secure_random_password(len, &charset)
    }
}

fn decrypt_password(key: &[u8; 32], entry: PasswordEntry) -> VaultisResult<PasswordPlaintext> {
    Ok(PasswordPlaintext {
        id: entry.id,
        name: decrypt_string(key, &entry.name_enc)?,
        username: decrypt_string(key, &entry.username_enc)?,
        password: decrypt_string(key, &entry.password_enc)?,
        url: entry.url_enc.as_ref().map(|e| decrypt_string(key, e)).transpose()?,
        notes: entry.notes_enc.as_ref().map(|e| decrypt_string(key, e)).transpose()?,
        totp_secret: entry.totp_secret_enc.as_ref().map(|e| decrypt_string(key, e)).transpose()?,
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
        last_used_at: entry.last_used_at,
        is_trashed: entry.is_trashed,
        trashed_at: entry.trashed_at,
        is_favorite: entry.is_favorite,
        password_strength: entry.password_strength,
    })
}

/// Simple entropy-based password strength score 0-4.
fn compute_strength(password: &str) -> Option<u8> {
    let len = password.len();
    let has_upper = password.chars().any(|c| c.is_uppercase());
    let has_lower = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_symbol = password.chars().any(|c| !c.is_alphanumeric());

    let variety = [has_upper, has_lower, has_digit, has_symbol]
        .iter()
        .filter(|&&b| b)
        .count();

    let score = match (len, variety) {
        (l, _) if l < 6 => 0,
        (l, v) if l < 10 || v < 2 => 1,
        (l, v) if l < 14 || v < 3 => 2,
        (l, v) if l < 18 || v < 4 => 3,
        _ => 4,
    };

    Some(score)
}

fn parse_dt(s: &str) -> chrono::DateTime<Utc> {
    chrono::DateTime::parse_from_rfc3339(s)
        .unwrap_or_default()
        .with_timezone(&Utc)
}