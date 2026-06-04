/**
 * Format file size in human readable form.
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format a number with locale separators.
 */
export function formatNumber(n) {
  if (n == null) return "0";
  return new Intl.NumberFormat("en-US").format(n);
}

/**
 * Format a URL for display (removes protocol, trailing slash).
 */
export function formatUrl(url) {
  if (!url) return "";
  return url
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/\/$/, "");
}

/**
 * Mask a password string for display.
 */
export function maskPassword(pw, char = "•", visibleEnd = 0) {
  if (!pw) return "";
  if (visibleEnd > 0) {
    return char.repeat(pw.length - visibleEnd) + pw.slice(-visibleEnd);
  }
  return char.repeat(Math.max(pw.length, 8));
}

/**
 * Truncate text at word boundary.
 */
export function truncateWords(text = "", maxWords = 20) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

/**
 * Format a domain from URL.
 */
export function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Format percentage.
 */
export function formatPercent(value, decimals = 0) {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Capitalize first letter of each word.
 */
export function titleCase(str = "") {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Slug-ify a string.
 */
export function slugify(str = "") {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-");
}