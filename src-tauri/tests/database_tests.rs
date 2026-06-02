#[cfg(test)]
mod database_tests {
    use std::path::PathBuf;
    use tempfile::TempDir;

    use vaultis_lib::{
        database::{
            connection::create_pool,
            migrations::{get_schema_version, run_migrations},
            // schema::CREATE_TABLES_SQL,
        },
        utils::paths::get_database_path,
    };

    fn temp_dir() -> TempDir {
        tempfile::tempdir().expect("Failed to create temp dir")
    }

    // ── Migration tests ───────────────────────────────────────────────────

    #[test]
    fn test_migrations_create_all_tables() {
        let dir = temp_dir();
        let data_dir = PathBuf::from(dir.path());
        run_migrations(&data_dir).expect("Migrations should succeed");

        let db_path = get_database_path(&data_dir);
        let conn = rusqlite::Connection::open(&db_path).unwrap();

        for table in &["notes", "files", "passwords", "tags", "folders", "settings", "audit_log"] {
            let count: i64 = conn
                .query_row(
                    &format!("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='{table}'"),
                    [],
                    |row| row.get(0),
                )
                .unwrap_or(0);
            assert_eq!(count, 1, "Table '{table}' should exist after migration");
        }
    }

    #[test]
    fn test_migrations_idempotent() {
        let dir = temp_dir();
        let data_dir = PathBuf::from(dir.path());
        // Running twice should not fail
        run_migrations(&data_dir).expect("First migration");
        run_migrations(&data_dir).expect("Second migration should be idempotent");
    }

    #[test]
    fn test_schema_version_stored() {
        let dir = temp_dir();
        let data_dir = PathBuf::from(dir.path());
        run_migrations(&data_dir).unwrap();

        let db_path = get_database_path(&data_dir);
        let conn = rusqlite::Connection::open(&db_path).unwrap();
        let version = get_schema_version(&conn).unwrap();
        assert_eq!(version, 1, "Schema version should be 1 after initial migration");
    }

    // ── Connection pool tests ─────────────────────────────────────────────

    #[test]
    fn test_pool_creation() {
        let dir = temp_dir();
        let data_dir = PathBuf::from(dir.path());
        run_migrations(&data_dir).unwrap();

        let db_path = get_database_path(&data_dir);
        let pool = create_pool(&db_path).expect("Pool creation should succeed");

        let conn = pool.get().expect("Should get connection from pool");
        // Execute a simple query to verify connection works
        let result: i64 = conn
            .query_row("SELECT COUNT(*) FROM notes", [], |row| row.get(0))
            .unwrap();
        assert_eq!(result, 0, "Notes table should be empty");
    }

    #[test]
    fn test_pool_concurrent_access() {
        use std::sync::Arc;
        use std::thread;

        let dir = temp_dir();
        let data_dir = PathBuf::from(dir.path());
        run_migrations(&data_dir).unwrap();

        let db_path = get_database_path(&data_dir);
        let pool = Arc::new(create_pool(&db_path).unwrap());

        let mut handles = Vec::new();
        for i in 0..4 {
            let pool = Arc::clone(&pool);
            let handle = thread::spawn(move || {
                let conn = pool.get().expect("Thread should get connection");
                let count: i64 = conn
                    .query_row("SELECT COUNT(*) FROM notes", [], |row| row.get(0))
                    .unwrap();
                assert_eq!(count, 0, "Thread {i}: expected 0 notes");
            });
            handles.push(handle);
        }
        for h in handles {
            h.join().expect("Thread should not panic");
        }
    }

    // ── WAL / PRAGMA tests ────────────────────────────────────────────────

    #[test]
    fn test_wal_mode_enabled() {
        let dir = temp_dir();
        let data_dir = PathBuf::from(dir.path());
        run_migrations(&data_dir).unwrap();

        let db_path = get_database_path(&data_dir);
        let pool = create_pool(&db_path).unwrap();
        let conn = pool.get().unwrap();

        let mode: String = conn
            .query_row("PRAGMA journal_mode", [], |row| row.get(0))
            .unwrap();
        assert_eq!(mode, "wal", "WAL mode should be enabled");
    }

    #[test]
    fn test_foreign_keys_enabled() {
        let dir = temp_dir();
        let data_dir = PathBuf::from(dir.path());
        run_migrations(&data_dir).unwrap();

        let db_path = get_database_path(&data_dir);
        let pool = create_pool(&db_path).unwrap();
        let conn = pool.get().unwrap();

        let fk: i32 = conn
            .query_row("PRAGMA foreign_keys", [], |row| row.get(0))
            .unwrap();
        assert_eq!(fk, 1, "Foreign keys should be enabled");
    }
}