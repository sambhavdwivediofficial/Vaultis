use std::path::PathBuf;
use rusqlite::Connection;

use crate::database::schema::CREATE_TABLES_SQL;
use crate::utils::{
    errors::{VaultisError, VaultisResult},
    paths::get_database_path,
};

/// Run all database migrations.
/// Currently applies the initial schema; future versions add ALTER TABLE steps.
pub fn run_migrations(data_dir: &PathBuf) -> VaultisResult<()> {
    let db_path = get_database_path(data_dir);
    let conn = Connection::open(&db_path)
        .map_err(|e| VaultisError::MigrationFailed(e.to_string()))?;

    conn.execute_batch(CREATE_TABLES_SQL)
        .map_err(|e| VaultisError::MigrationFailed(e.to_string()))?;

    // Record migration version in settings table
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('schema_version', '1')",
        [],
    )
    .map_err(|e| VaultisError::MigrationFailed(e.to_string()))?;

    tracing::info!("Database migrations completed successfully");
    Ok(())
}

/// Returns the current schema version stored in the settings table.
pub fn get_schema_version(conn: &Connection) -> VaultisResult<u32> {
    let version: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'schema_version'",
            [],
            |row| row.get(0),
        )
        .map_err(|_| VaultisError::MigrationFailed("No schema version found".into()))?;

    version
        .parse::<u32>()
        .map_err(|e| VaultisError::MigrationFailed(e.to_string()))
}