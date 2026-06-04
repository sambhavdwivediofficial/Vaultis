import React, { useState } from "react";
import { cn, formatDate } from "../../utils/helpers.js";
import { useClipboard } from "../../hooks/useClipboard.js";
import { useToast } from "../../hooks/useToast.js";
import usePasswordStore from "../../store/passwordStore.js";
import { PASSWORD_STRENGTH_COLORS, PASSWORD_STRENGTH_LABELS } from "../../utils/constants.js";
import styles from "./PasswordCard.module.css";

export default function PasswordCard({ entry, onClick }) {
  const [revealed, setRevealed] = useState(false);
  const { copy, copied }        = useClipboard();
  const del                     = usePasswordStore(s => s.delete);
  const update                  = usePasswordStore(s => s.update);
  const { success, error }      = useToast();

  const masked = "••••••••••";
  const strength = entry.password_strength ?? 0;
  const strengthColor = PASSWORD_STRENGTH_COLORS[strength];
  const strengthLabel = PASSWORD_STRENGTH_LABELS[strength];

  const handleCopyUser = async (e) => {
    e.stopPropagation();
    await copy(entry.username, "username");
    success("Username copied");
  };

  const handleCopyPass = async (e) => {
    e.stopPropagation();
    await copy(entry.password, "password");
    success("Password copied — clears in 30s");
  };

  const handleToggleFav = async (e) => {
    e.stopPropagation();
    await update(entry.id, { isFavorite: !entry.is_favorite });
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    const res = await del(entry.id);
    if (res.ok) success("Moved to trash");
    else error(res.error);
  };

  const handleReveal = (e) => {
    e.stopPropagation();
    setRevealed(v => !v);
  };

  const favicon = entry.url
    ? `https://www.google.com/s2/favicons?domain=${new URL(entry.url).hostname}&sz=32`
    : null;

  return (
    <article className={styles.card} onClick={onClick}>
      {/* ── Left: favicon / initial ─────────────────────────────────── */}
      <div className={styles.avatar}>
        {favicon ? (
          <img src={favicon} alt="" width={18} height={18}
            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          />
        ) : null}
        <span className={styles.initial} style={{ display: favicon ? "none" : "flex" }}>
          {entry.name?.[0]?.toUpperCase() ?? "?"}
        </span>
      </div>

      {/* ── Center: info ────────────────────────────────────────────── */}
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{entry.name}</span>
          {entry.is_favorite && <StarIcon filled />}
        </div>
        <span className={styles.username}>{entry.username}</span>

        {/* Password field */}
        <div className={styles.passRow}>
          <span className={cn(styles.password, !revealed && styles.masked)}>
            {revealed ? entry.password : masked}
          </span>
          <button className={styles.microBtn} onClick={handleReveal} aria-label="Toggle reveal">
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {/* Strength bar */}
        <div className={styles.strengthBar}>
          {[0, 1, 2, 3, 4].map(i => (
            <span
              key={i}
              className={styles.strengthSegment}
              style={{ background: i <= strength ? strengthColor : "var(--border-subtle)" }}
            />
          ))}
          <span className={styles.strengthLabel} style={{ color: strengthColor }}>
            {strengthLabel}
          </span>
        </div>
      </div>

      {/* ── Right: actions ──────────────────────────────────────────── */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={handleCopyUser} aria-label="Copy username">
          {copied === "username" ? <CheckIcon /> : <UserIcon />}
        </button>
        <button className={styles.actionBtn} onClick={handleCopyPass} aria-label="Copy password">
          {copied === "password" ? <CheckIcon /> : <CopyIcon />}
        </button>
        <button className={cn(styles.actionBtn, entry.is_favorite && styles.favActive)} onClick={handleToggleFav} aria-label="Toggle favorite">
          <StarIcon filled={entry.is_favorite} />
        </button>
        <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={handleDelete} aria-label="Delete">
          <TrashIcon />
        </button>
      </div>
    </article>
  );
}

function EyeIcon()    { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOffIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
function CopyIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
function CheckIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function UserIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function TrashIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>; }
function StarIcon({ filled }) {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "var(--accent-warning)" : "none"} stroke={filled ? "var(--accent-warning)" : "currentColor"} strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}