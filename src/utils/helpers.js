import { MIME_ICONS } from "./constants.js";

/**
 * Merge class names, filtering falsy values.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format file size in human-readable form.
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format a date as relative time or absolute.
 */
export function formatDate(dateStr, { relative = true } = {}) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (relative) {
    const now = Date.now();
    const diff = now - date.getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return "just now";
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/**
 * Format a date with time.
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/**
 * Get icon type from MIME type.
 */
export function getMimeIcon(mimeType) {
  if (!mimeType) return MIME_ICONS.default;
  for (const [prefix, icon] of Object.entries(MIME_ICONS)) {
    if (mimeType.startsWith(prefix)) return icon;
  }
  return MIME_ICONS.default;
}

/**
 * Truncate text to a given length.
 */
export function truncate(str, maxLen = 40) {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + "…";
}

/**
 * Generate a unique ID (for client-side temp keys).
 */
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Debounce a function.
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if the user is on a small screen.
 */
export function isSmallScreen() {
  return window.innerWidth < 768;
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Password strength score 0-4.
 */
export function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(4, score);
}

/**
 * Strip markdown for preview snippets.
 */
export function stripMarkdown(md = "") {
  return md
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
}