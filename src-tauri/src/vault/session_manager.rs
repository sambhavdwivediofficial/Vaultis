use chrono::Utc;
use crate::{
    state::{app_state::AppState, session_state::SessionInfo},
    utils::errors::VaultisResult,
};

/// Build a `SessionInfo` snapshot from current app state.
pub fn build_session_info(
    state: &AppState,
    display_name: &str,
    auto_lock_secs: Option<u64>,
) -> SessionInfo {
    SessionInfo {
        is_unlocked: state.is_unlocked(),
        unlocked_at: if state.is_unlocked() {
            Some(Utc::now())
        } else {
            None
        },
        vault_display_name: display_name.to_string(),
        read_only: *state.read_only.read(),
        auto_lock_secs,
    }
}

/// Tear down the session cleanly: clear key + auto-lock timer.
pub fn close_session(state: &AppState) -> VaultisResult<()> {
    state.emergency_lock();
    tracing::info!("Session closed — vault locked");
    Ok(())
}