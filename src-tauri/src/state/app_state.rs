use std::{path::PathBuf, sync::Arc, time::Instant};
use parking_lot::RwLock;
use once_cell::sync::OnceCell;

use crate::{
    crypto::key_manager::KeyManager,
    database::connection::{create_pool, DbPool},
    utils::errors::{VaultisError, VaultisResult},
};

/// Central application state shared across all Tauri commands via `.manage()`.
pub struct AppState {
    /// The resolved app data directory (set during `.setup()`).
    pub data_dir: RwLock<PathBuf>,
    /// In-memory key manager holding the unlocked vault key (or None if locked).
    pub key_manager: Arc<KeyManager>,
    /// SQLite connection pool (initialized on first unlock or vault creation).
    pub db_pool: OnceCell<DbPool>,
    /// Number of consecutive failed unlock attempts.
    pub failed_attempts: RwLock<u32>,
    /// Timestamp of last failed attempt (for throttling).
    pub last_failed_at: RwLock<Option<Instant>>,
    /// Whether the vault is in read-only mode.
    pub read_only: RwLock<bool>,
    /// Auto-lock deadline (if enabled).
    pub auto_lock_at: RwLock<Option<Instant>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            data_dir: RwLock::new(PathBuf::new()),
            key_manager: Arc::new(KeyManager::new()),
            db_pool: OnceCell::new(),
            failed_attempts: RwLock::new(0),
            last_failed_at: RwLock::new(None),
            read_only: RwLock::new(false),
            auto_lock_at: RwLock::new(None),
        }
    }

    /// Initialize the DB pool. Safe to call multiple times — only runs once.
    pub fn init_pool(&self) -> VaultisResult<()> {
        let data_dir = self.data_dir.read().clone();
        self.db_pool.get_or_try_init(|| {
            let db_path = crate::utils::paths::get_database_path(&data_dir);
            create_pool(&db_path)
        })?;
        Ok(())
    }

    /// Borrow the connection pool, returning an error if not initialized.
    pub fn pool(&self) -> VaultisResult<&DbPool> {
        self.db_pool
            .get()
            .ok_or(VaultisError::VaultLocked)
    }

    /// Returns `true` if the vault is currently unlocked.
    pub fn is_unlocked(&self) -> bool {
        self.key_manager.is_unlocked()
    }

    /// Record a failed unlock attempt and return the delay (in seconds) the
    /// caller must wait before the next attempt.
    pub fn record_failed_attempt(&self) -> u64 {
        let mut count = self.failed_attempts.write();
        *count += 1;
        *self.last_failed_at.write() = Some(Instant::now());

        let n = *count;
        for &(threshold, delay) in crate::utils::config::ATTEMPT_DELAY_SECONDS.iter().rev() {
            if n >= threshold {
                return delay;
            }
        }
        0
    }

    /// Reset failed attempt counter after a successful unlock.
    pub fn reset_failed_attempts(&self) {
        *self.failed_attempts.write() = 0;
        *self.last_failed_at.write() = None;
    }

    /// Instantly lock the vault — clear the key, reset auto-lock timer.
    pub fn emergency_lock(&self) {
        self.key_manager.clear();
        *self.auto_lock_at.write() = None;
        tracing::warn!("Vault emergency-locked");
    }

    /// Set the auto-lock deadline relative to now.
    pub fn set_auto_lock(&self, seconds: u64) {
        if seconds == 0 {
            *self.auto_lock_at.write() = None;
        } else {
            let deadline = Instant::now() + std::time::Duration::from_secs(seconds);
            *self.auto_lock_at.write() = Some(deadline);
        }
    }

    /// Bump the auto-lock deadline on activity.
    pub fn refresh_auto_lock(&self, seconds: u64) {
        if self.auto_lock_at.read().is_some() {
            self.set_auto_lock(seconds);
        }
    }

    /// Check whether the auto-lock timer has expired and lock if so.
    /// Returns `true` if the vault was just locked by this call.
    pub fn check_auto_lock(&self) -> bool {
        let expired = self
            .auto_lock_at
            .read()
            .map(|deadline| Instant::now() >= deadline)
            .unwrap_or(false);

        if expired {
            self.emergency_lock();
            return true;
        }
        false
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}