use std::path::Path;
use crate::utils::errors::VaultisResult;

/// Detect MIME type from file extension (simple heuristic).
pub fn detect_mime_type(path: &Path) -> String {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "pdf"  => "application/pdf",
        "jpg" | "jpeg" => "image/jpeg",
        "png"  => "image/png",
        "gif"  => "image/gif",
        "webp" => "image/webp",
        "svg"  => "image/svg+xml",
        "mp4"  => "video/mp4",
        "mov"  => "video/quicktime",
        "avi"  => "video/x-msvideo",
        "mkv"  => "video/x-matroska",
        "mp3"  => "audio/mpeg",
        "wav"  => "audio/wav",
        "txt"  => "text/plain",
        "md"   => "text/markdown",
        "html" | "htm" => "text/html",
        "css"  => "text/css",
        "js"   => "application/javascript",
        "json" => "application/json",
        "zip"  => "application/zip",
        "tar"  => "application/x-tar",
        "gz"   => "application/gzip",
        "doc"  => "application/msword",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls"  => "application/vnd.ms-excel",
        "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "ppt"  => "application/vnd.ms-powerpoint",
        "pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        _ => "application/octet-stream",
    }
    .to_string()
}

/// Return the original file size. Returns 0 if file doesn't exist.
pub fn get_file_size(path: &Path) -> VaultisResult<u64> {
    Ok(std::fs::metadata(path).map(|m| m.len()).unwrap_or(0))
}