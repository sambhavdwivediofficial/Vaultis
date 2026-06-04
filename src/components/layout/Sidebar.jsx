import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../../utils/helpers.js";
import useAuthStore from "../../store/authStore.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  {
    group: "Vault",
    items: [
      { to: "/dashboard", label: "Dashboard",   icon: <DashboardIcon /> },
      { to: "/notes",     label: "Notes",        icon: <NotesIcon /> },
      { to: "/files",     label: "Files",        icon: <FilesIcon /> },
      { to: "/passwords", label: "Passwords",    icon: <KeyIcon /> },
    ],
  },
  {
    group: "Organize",
    items: [
      { to: "/tags",  label: "Tags",  icon: <TagIcon /> },
      { to: "/trash", label: "Trash", icon: <TrashIcon /> },
    ],
  },
  {
    group: "System",
    items: [
      { to: "/backup",   label: "Backup",   icon: <BackupIcon /> },
      { to: "/settings", label: "Settings", icon: <SettingsIcon /> },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const navigate  = useNavigate();
  const lock      = useAuthStore(s => s.lock);
  const vaultInfo = useAuthStore(s => s.vaultInfo);
  const { toast } = useToast();

  const handleLock = async () => {
    await lock();
    navigate("/unlock");
    toast("Vault locked");
  };

  return (
    <aside className={cn(styles.sidebar, collapsed && styles.collapsed)}>
      {/* ── Logo & toggle ─────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.logoWrap}>
          <div className={styles.logoMark}>
            <VaultIcon />
          </div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoName}>Vaultis</span>
              {vaultInfo?.display_name && (
                <span className={styles.vaultName}>{vaultInfo.display_name}</span>
              )}
            </div>
          )}
        </div>
        {/* <button className={styles.collapseBtn} onClick={onToggle} aria-label="Toggle sidebar">
          <ChevronIcon collapsed={collapsed} />
        </button> */}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(group => (
          <div key={group.group} className={styles.navGroup}>
            {!collapsed && (
              <span className={styles.groupLabel}>{group.group}</span>
            )}
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(styles.navItem, isActive && styles.active)
                }
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && (
                  <span className={styles.navLabel}>{item.label}</span>
                )}
                {collapsed && (
                  <span className={styles.tooltip}>{item.label}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Lock button ───────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <button className={cn(styles.lockBtn, collapsed && styles.lockBtnCollapsed)} onClick={handleLock}>
          <span className={styles.navIcon}><LockIcon /></span>
          {!collapsed && <span>Lock vault</span>}
          {collapsed && <span className={styles.tooltip}>Lock vault</span>}
        </button>
      </div>
    </aside>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────

function VaultIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 9V7M12 17v-2M9 12H7M17 12h-2"/>
    </svg>
  );
}
function DashboardIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function NotesIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
}
function FilesIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
}
function KeyIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
}
function TagIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
}
function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function BackupIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}
function SettingsIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function LockIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function ChevronIcon({ collapsed }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform var(--duration-base) var(--ease-out)" }}>
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}