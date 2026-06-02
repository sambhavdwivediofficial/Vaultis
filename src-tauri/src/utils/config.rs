/// Maximum file size allowed for encryption (2 GB)
pub const MAX_FILE_SIZE_BYTES: u64 = 2 * 1024 * 1024 * 1024;

/// Chunk size for streaming file encryption (1 MB)
pub const CHUNK_SIZE_BYTES: usize = 1024 * 1024;

/// Argon2id memory cost (64 MB) — intentionally expensive
pub const ARGON2_MEMORY_KIB: u32 = 65_536;

/// Argon2id iteration count
pub const ARGON2_ITERATIONS: u32 = 3;

/// Argon2id parallelism
pub const ARGON2_PARALLELISM: u32 = 4;

/// AES-256-GCM key size in bytes
pub const AES_KEY_SIZE: usize = 32;

/// AES-256-GCM nonce size in bytes
pub const AES_NONCE_SIZE: usize = 12;

/// AES-256-GCM auth tag size in bytes
pub const AES_TAG_SIZE: usize = 16;

/// Argon2id salt size in bytes
pub const SALT_SIZE: usize = 32;

/// Recovery key: 16 segments × 4 hex chars = 64 hex chars = 32 bytes
pub const RECOVERY_SEGMENTS: usize = 16;
pub const RECOVERY_SEGMENT_LEN: usize = 4;
pub const RECOVERY_KEY_SIZE: usize = AES_KEY_SIZE; // 32 bytes

/// Backup file extension
pub const BACKUP_EXTENSION: &str = "vaultis";

/// Encrypted file extension
pub const ENCRYPTED_FILE_EXTENSION: &str = "valts";

/// Database filename
pub const DATABASE_FILENAME: &str = "vaultis.db";

/// Vault metadata filename
pub const VAULT_META_FILENAME: &str = "vault.meta";

/// Encrypted files directory name inside app data
pub const FILES_DIR: &str = "files";

/// Backups directory name inside app data
pub const BACKUPS_DIR: &str = "backups";

/// Logs directory name inside app data
pub const LOGS_DIR: &str = "logs";

/// Maximum failed unlock attempts before delay kicks in
pub const MAX_FAST_ATTEMPTS: u32 = 3;

/// Delay seconds per group of failed attempts
pub const ATTEMPT_DELAY_SECONDS: &[(u32, u64)] = &[
    (5, 10),   // after 5 attempts → 10s delay
    (8, 30),   // after 8 attempts → 30s delay
    (10, 60),  // after 10 attempts → 60s delay
    (15, 300), // after 15 attempts → 5 min delay
];

/// Auto-lock presets in seconds
pub const AUTO_LOCK_PRESETS: &[u64] = &[60, 300, 900, 1800, 3600];

/// Auto-lock default (5 minutes)
pub const AUTO_LOCK_DEFAULT_SECS: u64 = 300;

/// App name for display
pub const APP_NAME: &str = "Vaultis";

/// App author
pub const APP_AUTHOR: &str = "Sambhav Dwivedi";

/// App website
pub const APP_WEBSITE: &str = "https://www.sambhavdwivedi.in";

/// App repository
pub const APP_REPO: &str = "https://github.com/sambhavdwivediofficial/Vaultis";