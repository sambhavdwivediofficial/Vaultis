use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// Serializable session info sent to the frontend after unlock.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub is_unlocked: bool,
    pub unlocked_at: Option<DateTime<Utc>>,
    pub vault_display_name: String,
    pub read_only: bool,
    pub auto_lock_secs: Option<u64>,
}