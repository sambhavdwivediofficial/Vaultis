use std::sync::atomic::{AtomicBool, Ordering};
// use std::sync::Arc;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};

use crate::state::app_state::AppState;

static AUTO_LOCK_MONITOR_RUNNING: AtomicBool = AtomicBool::new(false);

pub fn spawn_auto_lock_monitor(app_handle: AppHandle) {
    if AUTO_LOCK_MONITOR_RUNNING.swap(true, Ordering::SeqCst) {
        tracing::debug!("Auto-lock monitor already running");
        return;
    }

    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(1));

        loop {
            interval.tick().await;

            let state = app_handle.state::<AppState>();

            if !state.is_unlocked() {
                AUTO_LOCK_MONITOR_RUNNING.store(false, Ordering::SeqCst);
                break;
            }

            if state.check_auto_lock() {
                if let Err(err) = app_handle.emit("vault:auto-locked", ()) {
                    tracing::error!("Failed to emit auto-lock event: {}", err);
                }

                tracing::info!("Vault auto-locked due to inactivity");

                AUTO_LOCK_MONITOR_RUNNING.store(false, Ordering::SeqCst);
                break;
            }
        }
    });
}