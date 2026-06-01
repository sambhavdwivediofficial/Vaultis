use std::path::PathBuf;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;

use crate::utils::errors::{VaultisError, VaultisResult};

pub type DbPool = Pool<SqliteConnectionManager>;

/// Create and return a connection pool for the given database path.
/// Configures WAL mode, foreign keys, and synchronous = NORMAL for performance.
pub fn create_pool(db_path: &PathBuf) -> VaultisResult<DbPool> {
    let manager = SqliteConnectionManager::file(db_path)
        .with_flags(
            rusqlite::OpenFlags::SQLITE_OPEN_READ_WRITE
                | rusqlite::OpenFlags::SQLITE_OPEN_CREATE
                | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
        )
        .with_init(|conn| {
            conn.execute_batch(
                "PRAGMA journal_mode = WAL;
                 PRAGMA foreign_keys = ON;
                 PRAGMA synchronous = NORMAL;
                 PRAGMA cache_size = -8000;
                 PRAGMA temp_store = MEMORY;",
            )
        });

    let pool = r2d2::Builder::new()
        .max_size(8)
        .min_idle(Some(1))
        .build(manager)
        .map_err(|e| VaultisError::DatabasePool(e.to_string()))?;

    Ok(pool)
}