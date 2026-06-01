use serde::{Deserialize, Serialize};
use tauri::State;

use crate::{
    database::queries::{SELECT_ALL_SETTINGS, UPSERT_SETTING},
    state::app_state::AppState,
    utils::config::AUTO_LOCK_DEFAULT_SECS,
};

/// Full application settings snapshot.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub auto_lock_secs: u64,
    pub theme: String,
    pub language: String,
    pub show_password_strength: bool,
    pub clipboard_clear_secs: u64,
    pub launch_at_startup: bool,
    pub minimize_to_tray: bool,
    pub compact_mode: bool,
    pub font_size: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            auto_lock_secs: AUTO_LOCK_DEFAULT_SECS,
            theme: "dark".into(),
            language: "en".into(),
            show_password_strength: true,
            clipboard_clear_secs: 30,
            launch_at_startup: false,
            minimize_to_tray: true,
            compact_mode: false,
            font_size: "medium".into(),
        }
    }
}

/// Load settings from DB, merging with defaults for any missing keys.
#[tauri::command]
pub fn get_settings(state: State<AppState>) -> Result<AppSettings, String> {
    if !state.is_unlocked() {
        // Return defaults if vault is locked (settings page visible pre-unlock)
        return Ok(AppSettings::default());
    }

    let pool = state.pool().map_err(|e| e.to_string())?;
    let conn = pool.get().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(SELECT_ALL_SETTINGS)
        .map_err(|e| e.to_string())?;

    let pairs: Vec<(String, String)> = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?
        .collect::<Result<_, _>>()
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let mut settings = AppSettings::default();
    for (key, value) in pairs {
        apply_setting(&mut settings, &key, &value);
    }

    Ok(settings)
}

/// Persist a full settings object to the database.
#[tauri::command]
pub fn update_settings(state: State<AppState>, settings: AppSettings) -> Result<(), String> {
    if !state.is_unlocked() {
        return Err("Vault is locked.".into());
    }

    let pool = state.pool().map_err(|e| e.to_string())?;
    let conn = pool.get().map_err(|e| e.to_string())?;

    let pairs = settings_to_pairs(&settings);
    for (key, value) in &pairs {
        conn.execute(UPSERT_SETTING, rusqlite::params![key, value])
            .map_err(|e| e.to_string())?;
    }

    // Apply auto-lock change immediately
    state.set_auto_lock(settings.auto_lock_secs);

    tracing::debug!("Settings updated: auto_lock={}s theme={}", settings.auto_lock_secs, settings.theme);
    Ok(())
}

/// Reset all settings to defaults.
#[tauri::command]
pub fn reset_settings(state: State<AppState>) -> Result<AppSettings, String> {
    let defaults = AppSettings::default();
    update_settings(state, defaults.clone())?;
    Ok(defaults)
}

// ── Helpers ───────────────────────────────────────────────────────────────

fn apply_setting(settings: &mut AppSettings, key: &str, value: &str) {
    match key {
        "auto_lock_secs" => {
            if let Ok(v) = value.parse() {
                settings.auto_lock_secs = v;
            }
        }
        "theme" => settings.theme = value.to_string(),
        "language" => settings.language = value.to_string(),
        "show_password_strength" => settings.show_password_strength = value == "true",
        "clipboard_clear_secs" => {
            if let Ok(v) = value.parse() {
                settings.clipboard_clear_secs = v;
            }
        }
        "launch_at_startup" => settings.launch_at_startup = value == "true",
        "minimize_to_tray" => settings.minimize_to_tray = value == "true",
        "compact_mode" => settings.compact_mode = value == "true",
        "font_size" => settings.font_size = value.to_string(),
        _ => {}
    }
}

fn settings_to_pairs(s: &AppSettings) -> Vec<(String, String)> {
    vec![
        ("auto_lock_secs".into(), s.auto_lock_secs.to_string()),
        ("theme".into(), s.theme.clone()),
        ("language".into(), s.language.clone()),
        ("show_password_strength".into(), s.show_password_strength.to_string()),
        ("clipboard_clear_secs".into(), s.clipboard_clear_secs.to_string()),
        ("launch_at_startup".into(), s.launch_at_startup.to_string()),
        ("minimize_to_tray".into(), s.minimize_to_tray.to_string()),
        ("compact_mode".into(), s.compact_mode.to_string()),
        ("font_size".into(), s.font_size.clone()),
    ]
}