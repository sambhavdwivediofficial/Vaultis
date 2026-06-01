use parking_lot::RwLock;
use zeroize::Zeroizing;

use crate::utils::{
    config::AES_KEY_SIZE,
    errors::{VaultisError, VaultisResult},
};

/// Holds the active vault master key in memory.
/// The key is wiped automatically when `KeyManager` is dropped or `clear()` is called.
pub struct KeyManager {
    /// The master key wrapped in `Zeroizing` so it's wiped on drop.
    key: RwLock<Option<Zeroizing<[u8; AES_KEY_SIZE]>>>,
}

impl KeyManager {
    pub fn new() -> Self {
        Self {
            key: RwLock::new(None),
        }
    }

    /// Store the master key in memory.
    pub fn set_key(&self, key: Zeroizing<[u8; AES_KEY_SIZE]>) {
        let mut guard = self.key.write();
        // If there's a previous key, it will be zeroized when replaced.
        *guard = Some(key);
    }

    /// Check whether a key is currently loaded.
    pub fn is_unlocked(&self) -> bool {
        self.key.read().is_some()
    }

    /// Execute a closure that receives a reference to the raw key bytes.
    /// Returns `VaultisError::VaultLocked` if no key is loaded.
    pub fn with_key<F, T>(&self, f: F) -> VaultisResult<T>
    where
        F: FnOnce(&[u8; AES_KEY_SIZE]) -> VaultisResult<T>,
    {
        let guard = self.key.read();
        match guard.as_ref() {
            Some(key) => f(key),
            None => Err(VaultisError::VaultLocked),
        }
    }

    /// Zeroize and remove the key from memory.
    pub fn clear(&self) {
        let mut guard = self.key.write();
        // Drop the Zeroizing wrapper → triggers automatic zeroize of the key bytes.
        *guard = None;
    }
}

impl Default for KeyManager {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for KeyManager {
    fn drop(&mut self) {
        self.clear();
    }
}