#[cfg(test)]
mod integration_tests {
    use std::path::PathBuf;
    use tempfile::TempDir;

    use vaultis_lib::{
        backup::{
            exporter::export_vault,
            importer::{restore_backup, validate_backup},
        },
        crypto::argon2::derive_key,
        crypto::random::generate_salt,
        database::{connection::create_pool, migrations::run_migrations},
        models::note::CreateNoteRequest,
        models::password::CreatePasswordRequest,
        services::{
            note_service::NoteService,
            password_service::PasswordService,
        },
        utils::paths::get_database_path,
        vault::vault_manager::create_vault,
    };

    struct TestEnv {
        _dir: TempDir,
        pub data_dir: PathBuf,
        pub key: [u8; 32],
    }

    impl TestEnv {
        fn new() -> Self {
            let dir = tempfile::tempdir().unwrap();
            let data_dir = PathBuf::from(dir.path());
            run_migrations(&data_dir).unwrap();

            let salt = generate_salt().unwrap();
            let key = *derive_key("integration_test_pass", &salt).unwrap();

            Self { _dir: dir, data_dir, key }
        }

        fn pool(&self) -> vaultis_lib::database::connection::DbPool {
            let db_path = get_database_path(&self.data_dir);
            create_pool(&db_path).unwrap()
        }
    }

    // ── Notes CRUD ────────────────────────────────────────────────────────

    #[test]
    fn test_note_create_and_retrieve() {
        let env = TestEnv::new();
        let pool = env.pool();

        let note = NoteService::create_note(
            &pool,
            &env.key,
            CreateNoteRequest {
                title: "Secret Plans".into(),
                content: "Launch Vaultis on Monday".into(),
                tags: Some(vec!["work".into(), "important".into()]),
                folder_id: None,
                color: Some("#4A90D9".into()),
            },
        )
        .unwrap();

        assert_eq!(note.title, "Secret Plans");
        assert_eq!(note.content, "Launch Vaultis on Monday");
        assert_eq!(note.tags, vec!["work", "important"]);
        assert_eq!(note.color.as_deref(), Some("#4A90D9"));
        assert!(!note.is_trashed);
        assert!(!note.is_pinned);

        // Fetch by ID
        let fetched = NoteService::get_note(&pool, &env.key, &note.id).unwrap();
        assert_eq!(fetched.id, note.id);
        assert_eq!(fetched.title, "Secret Plans");
    }

    #[test]
    fn test_note_list() {
        let env = TestEnv::new();
        let pool = env.pool();

        for i in 0..5 {
            NoteService::create_note(
                &pool,
                &env.key,
                CreateNoteRequest {
                    title: format!("Note {i}"),
                    content: format!("Content {i}"),
                    tags: None,
                    folder_id: None,
                    color: None,
                },
            )
            .unwrap();
        }

        let notes = NoteService::list_notes(&pool, &env.key).unwrap();
        assert_eq!(notes.len(), 5);
    }

    #[test]
    fn test_note_soft_delete_and_restore() {
        let env = TestEnv::new();
        let pool = env.pool();

        let note = NoteService::create_note(
            &pool,
            &env.key,
            CreateNoteRequest {
                title: "Deletable Note".into(),
                content: "Will be trashed".into(),
                tags: None,
                folder_id: None,
                color: None,
            },
        )
        .unwrap();

        NoteService::delete_note(&pool, &note.id).unwrap();

        // Should not appear in list
        let notes = NoteService::list_notes(&pool, &env.key).unwrap();
        assert!(!notes.iter().any(|n| n.id == note.id), "Deleted note must not appear in list");

        // Restore
        NoteService::restore_note(&pool, &note.id).unwrap();
        let notes = NoteService::list_notes(&pool, &env.key).unwrap();
        assert!(notes.iter().any(|n| n.id == note.id), "Restored note must appear in list");
    }

    #[test]
    fn test_note_search() {
        let env = TestEnv::new();
        let pool = env.pool();

        NoteService::create_note(&pool, &env.key, CreateNoteRequest {
            title: "Vaultis Architecture".into(),
            content: "Built with Tauri and Rust".into(),
            tags: Some(vec!["tech".into()]),
            folder_id: None,
            color: None,
        }).unwrap();

        NoteService::create_note(&pool, &env.key, CreateNoteRequest {
            title: "Shopping List".into(),
            content: "Milk, eggs, bread".into(),
            tags: None,
            folder_id: None,
            color: None,
        }).unwrap();

        let results = NoteService::search_notes(&pool, &env.key, "Tauri").unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].title, "Vaultis Architecture");

        let all = NoteService::search_notes(&pool, &env.key, "").unwrap();
        assert_eq!(all.len(), 2);
    }

    // ── Passwords CRUD ────────────────────────────────────────────────────

    #[test]
    fn test_password_create_and_retrieve() {
        let env = TestEnv::new();
        let pool = env.pool();

        let entry = PasswordService::create_password(
            &pool,
            &env.key,
            CreatePasswordRequest {
                name: "GitHub".into(),
                username: "sambhavdwivedi".into(),
                password: "Sup3rS3cr3t!".into(),
                url: Some("https://github.com".into()),
                notes: Some("Work account".into()),
                totp_secret: None,
                tags: Some(vec!["dev".into()]),
                folder_id: None,
                is_favorite: Some(true),
            },
        )
        .unwrap();

        assert_eq!(entry.name, "GitHub");
        assert_eq!(entry.username, "sambhavdwivedi");
        assert_eq!(entry.password, "Sup3rS3cr3t!");
        assert_eq!(entry.url.as_deref(), Some("https://github.com"));
        assert!(entry.is_favorite);
        assert!(entry.password_strength.unwrap_or(0) > 0);
    }

    #[test]
    fn test_password_strength_scoring() {
        let env = TestEnv::new();
        let pool = env.pool();

        let weak = PasswordService::create_password(&pool, &env.key, CreatePasswordRequest {
            name: "Weak".into(),
            username: "u".into(),
            password: "abc".into(),
            url: None, notes: None, totp_secret: None,
            tags: None, folder_id: None, is_favorite: None,
        }).unwrap();

        let strong = PasswordService::create_password(&pool, &env.key, CreatePasswordRequest {
            name: "Strong".into(),
            username: "u".into(),
            password: "Tr0ub4dor&3XtraLong!".into(),
            url: None, notes: None, totp_secret: None,
            tags: None, folder_id: None, is_favorite: None,
        }).unwrap();

        assert!(
            weak.password_strength.unwrap_or(99) < strong.password_strength.unwrap_or(0),
            "Strong password must score higher than weak"
        );
    }

    #[test]
    fn test_password_generate() {
        use vaultis_lib::models::password::GeneratePasswordOptions;

        let pwd = PasswordService::generate_password(GeneratePasswordOptions {
            length: 24,
            uppercase: true,
            lowercase: true,
            digits: true,
            symbols: true,
            exclude_ambiguous: false,
        }).unwrap();

        assert_eq!(pwd.len(), 24);
        assert!(pwd.chars().any(|c| c.is_uppercase()), "Should contain uppercase");
        assert!(pwd.chars().any(|c| c.is_lowercase()), "Should contain lowercase");
        assert!(pwd.chars().any(|c| c.is_ascii_digit()), "Should contain digit");
    }

    // ── Backup / Restore ──────────────────────────────────────────────────

    #[test]
    fn test_backup_create_and_validate() {
        let env = TestEnv::new();
        create_vault(&env.data_dir, "BackupPass1!", "Backup Test").unwrap();

        let result = export_vault(&env.data_dir, &env.data_dir.join("backups"), "test-vault-id", 3, 5).unwrap();
        let backup_path = PathBuf::from(&result.backup_path);

        assert!(backup_path.exists(), "Backup file must exist");
        assert!(result.size_bytes > 0, "Backup must have non-zero size");

        let validation = validate_backup(&backup_path);
        assert!(validation.is_valid, "Backup must be valid: {:?}", validation.error);

        let manifest = validation.manifest.unwrap();
        assert_eq!(manifest.vault_id, "test-vault-id");
        assert_eq!(manifest.note_count, 3);
        assert_eq!(manifest.password_count, 5);
        assert!(manifest.encrypted);
    }

    #[test]
    fn test_backup_restore() {
        let env = TestEnv::new();
        create_vault(&env.data_dir, "RestorePass1!", "Restore Test").unwrap();

        // Create backup
        let result = export_vault(&env.data_dir, &env.data_dir.join("backups"), "restore-test-id", 0, 0).unwrap();
        let backup_path = PathBuf::from(&result.backup_path);

        // Restore to a fresh directory
        let restore_dir = env.data_dir.join("restored");
        std::fs::create_dir_all(&restore_dir).unwrap();

        let manifest = restore_backup(&restore_dir, &backup_path).unwrap();
        assert_eq!(manifest.vault_id, "restore-test-id");

        // vault.meta should now exist in restore dir
        assert!(restore_dir.join("vault.meta").exists(), "vault.meta must be restored");
    }
}