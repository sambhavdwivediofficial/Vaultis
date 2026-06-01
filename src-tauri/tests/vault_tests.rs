#[cfg(test)]
mod vault_tests {
    use std::path::PathBuf;
    use tempfile::TempDir;

    use vaultis_lib::{
        database::migrations::run_migrations,
        vault::vault_manager::{
            change_master_password, create_vault, get_vault_info, unlock_vault,
            unlock_with_recovery, vault_exists,
        },
    };

    fn setup() -> (TempDir, PathBuf) {
        let dir = tempfile::tempdir().expect("temp dir");
        let path = PathBuf::from(dir.path());
        run_migrations(&path).expect("migrations");
        (dir, path)
    }

    // ── Vault creation ────────────────────────────────────────────────────

    #[test]
    fn test_vault_does_not_exist_initially() {
        let (_dir, path) = setup();
        assert!(!vault_exists(&path), "Vault should not exist before creation");
    }

    #[test]
    fn test_create_vault_success() {
        let (_dir, path) = setup();
        let recovery = create_vault(&path, "StrongPassword!1", "Test Vault");
        assert!(recovery.is_ok(), "create_vault should succeed");
        assert!(vault_exists(&path), "Vault should exist after creation");
    }

    #[test]
    fn test_create_vault_duplicate_fails() {
        let (_dir, path) = setup();
        create_vault(&path, "Password1!", "Vault").unwrap();
        let result = create_vault(&path, "Password1!", "Vault");
        assert!(result.is_err(), "Creating a second vault should fail");
    }

    #[test]
    fn test_recovery_key_format() {
        let (_dir, path) = setup();
        let recovery = create_vault(&path, "TestPass1!", "My Vault").unwrap();
        let parts: Vec<&str> = recovery.display.split('-').collect();
        assert_eq!(parts.len(), 5);
        for part in &parts {
            assert_eq!(part.len(), 4);
        }
    }

    // ── Vault unlock ──────────────────────────────────────────────────────

    #[test]
    fn test_unlock_correct_password() {
        let (_dir, path) = setup();
        create_vault(&path, "CorrectPass1!", "Vault").unwrap();
        let key = unlock_vault(&path, "CorrectPass1!");
        assert!(key.is_ok(), "Correct password should unlock vault");
        assert_eq!(key.unwrap().len(), 32, "Key should be 32 bytes");
    }

    #[test]
    fn test_unlock_wrong_password_fails() {
        let (_dir, path) = setup();
        create_vault(&path, "CorrectPass1!", "Vault").unwrap();
        let result = unlock_vault(&path, "WrongPassword!");
        assert!(result.is_err(), "Wrong password must fail");
    }

    #[test]
    fn test_unlock_nonexistent_vault_fails() {
        let (_dir, path) = setup();
        let result = unlock_vault(&path, "AnyPassword");
        assert!(result.is_err(), "Unlock on missing vault must fail");
    }

    // ── Recovery unlock ───────────────────────────────────────────────────

    #[test]
    fn test_unlock_with_recovery_key() {
        let (_dir, path) = setup();
        let recovery = create_vault(&path, "MyPassword1!", "Vault").unwrap();
        let key = unlock_with_recovery(&path, &recovery.display);
        assert!(key.is_ok(), "Recovery key unlock should succeed");
    }

    #[test]
    fn test_unlock_with_invalid_recovery_fails() {
        let (_dir, path) = setup();
        create_vault(&path, "MyPassword1!", "Vault").unwrap();
        let result = unlock_with_recovery(&path, "XXXX-XXXX-XXXX-XXXX-XXXX");
        // This will attempt decryption with a mismatched key → DecryptionFailed
        assert!(result.is_err());
    }

    // ── Password change ───────────────────────────────────────────────────

    #[test]
    fn test_change_password_success() {
        let (_dir, path) = setup();
        create_vault(&path, "OldPassword1!", "Vault").unwrap();
        change_master_password(&path, "OldPassword1!", "NewPassword1!").unwrap();

        // Old password must no longer work
        assert!(unlock_vault(&path, "OldPassword1!").is_err());
        // New password must work
        assert!(unlock_vault(&path, "NewPassword1!").is_ok());
    }

    #[test]
    fn test_change_password_wrong_current_fails() {
        let (_dir, path) = setup();
        create_vault(&path, "CorrectPass1!", "Vault").unwrap();
        let result = change_master_password(&path, "WrongPass", "NewPass1!");
        assert!(result.is_err(), "Wrong current password must reject change");
    }

    // ── Vault info ────────────────────────────────────────────────────────

    #[test]
    fn test_get_vault_info() {
        let (_dir, path) = setup();
        create_vault(&path, "Password1!", "My Test Vault").unwrap();
        let info = get_vault_info(&path).unwrap();
        assert_eq!(info.display_name, "My Test Vault");
        assert_eq!(info.schema_version, 1);
        assert!(!info.vault_id.is_empty());
    }

    // ── Key determinism ───────────────────────────────────────────────────

    #[test]
    fn test_unlock_produces_deterministic_key() {
        let (_dir, path) = setup();
        create_vault(&path, "DeterministicPass1!", "Vault").unwrap();
        let k1 = unlock_vault(&path, "DeterministicPass1!").unwrap();
        let k2 = unlock_vault(&path, "DeterministicPass1!").unwrap();
        assert_eq!(k1.as_slice(), k2.as_slice(), "Same password must yield same key");
    }
}