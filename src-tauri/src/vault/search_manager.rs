use crate::models::{
    file::FilePlaintext,
    note::NotePlaintext,
    password::PasswordPlaintext,
};

/// Fuzzy-ish search across note fields. Case-insensitive substring match.
pub fn search_notes<'a>(notes: &'a [NotePlaintext], query: &str) -> Vec<&'a NotePlaintext> {
    let q = query.to_lowercase();
    notes
        .iter()
        .filter(|n| {
            n.title.to_lowercase().contains(&q)
                || n.content.to_lowercase().contains(&q)
                || n.tags.iter().any(|t| t.to_lowercase().contains(&q))
        })
        .collect()
}

/// Case-insensitive substring search across password entry fields.
pub fn search_passwords<'a>(
    entries: &'a [PasswordPlaintext],
    query: &str,
) -> Vec<&'a PasswordPlaintext> {
    let q = query.to_lowercase();
    entries
        .iter()
        .filter(|p| {
            p.name.to_lowercase().contains(&q)
                || p.username.to_lowercase().contains(&q)
                || p.url
                    .as_deref()
                    .map(|u| u.to_lowercase().contains(&q))
                    .unwrap_or(false)
                || p.notes
                    .as_deref()
                    .map(|n| n.to_lowercase().contains(&q))
                    .unwrap_or(false)
        })
        .collect()
}

/// Case-insensitive filename search.
pub fn search_files<'a>(files: &'a [FilePlaintext], query: &str) -> Vec<&'a FilePlaintext> {
    let q = query.to_lowercase();
    files
        .iter()
        .filter(|f| {
            f.name.to_lowercase().contains(&q)
                || f.mime_type.to_lowercase().contains(&q)
                || f.tags.iter().any(|t| t.to_lowercase().contains(&q))
        })
        .collect()
}