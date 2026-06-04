/**
 * Format ISO date to relative string — "just now", "2h ago", "3 days ago".
 */
export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs  = Math.floor(diff / 1000);
  if (secs < 60)  return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)   return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5)  return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/**
 * Format date as "Jun 3, 2025".
 */
export function formatShort(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/**
 * Format date as "June 3, 2025 at 4:30 PM".
 */
export function formatLong(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/**
 * Format as "2025-06-03" (ISO 8601 date only).
 */
export function formatIsoDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

/**
 * Format as "4:30 PM".
 */
export function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
}

/**
 * Returns true if date is today.
 */
export function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate()  === now.getDate()
    &&   d.getMonth() === now.getMonth()
    &&   d.getFullYear() === now.getFullYear();
}

/**
 * Returns true if date is in the last N days.
 */
export function isWithinDays(dateStr, days) {
  if (!dateStr) return false;
  const ms = days * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(dateStr).getTime() < ms;
}

/**
 * Sort array of objects by a date field (newest first).
 */
export function sortByDate(arr = [], field = "created_at") {
  return [...arr].sort(
    (a, b) => new Date(b[field]).getTime() - new Date(a[field]).getTime()
  );
}

/**
 * Group items by day label.
 * Returns { "Today": [...], "Yesterday": [...], "Jun 2025": [...] }
 */
export function groupByDay(arr = [], field = "created_at") {
  const groups = {};
  arr.forEach(item => {
    let label;
    const d = new Date(item[field]);
    if (isToday(item[field])) {
      label = "Today";
    } else if (isWithinDays(item[field], 2)) {
      label = "Yesterday";
    } else {
      label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  });
  return groups;
}