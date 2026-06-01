// use std::sync::Arc;
use std::time::Duration;
use tauri::AppHandle;
use tauri::{Manager, Emitter};

use crate::state::app_state::AppState;

/// Spawn a background Tokio task that polls the auto-lock deadline every second.
/// When the timer expires the vault is locked and an event is emitted to the frontend.
pub fn spawn_auto_lock_monitor(app_handle: AppHandle) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(1));
        loop {
            interval.tick().await;
            let state = app_handle.state::<AppState>();
            if state.check_auto_lock() {
                app_handle
                    .emit("vault:auto-locked", ())
                    .unwrap_or_default();
                tracing::info!("Vault auto-locked due to inactivity");
            }
        }
    });
}