import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../utils/helpers.js";
import useAuthStore from "../../store/authStore.js";
import styles from "./Navbar.module.css";

const ROUTE_LABELS = {
  "/dashboard": "Dashboard",
  "/notes":     "Notes",
  "/files":     "Files",
  "/passwords": "Passwords",
  "/tags":      "Tags",
  "/trash":     "Trash",
  "/backup":    "Backup",
  "/settings":  "Settings",
};

export default function Navbar({ onMenuToggle }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const lock      = useAuthStore(s => s.lock);
  const vaultInfo = useAuthStore(s => s.vaultInfo);

  const label = ROUTE_LABELS[location.pathname] ?? "Vaultis";

  const handleLock = async () => {
    await lock();
    navigate("/unlock");
  };

  return (
    <div className={styles.navbar}>
      <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Open menu">
        <MenuIcon />
      </button>

      <div className={styles.center}>
        <span className={styles.vaultLabel}>
          <ShieldIcon />
          {vaultInfo?.display_name || "Vaultis"}
        </span>
        <span className={styles.separator}>/</span>
        <span className={styles.pageLabel}>{label}</span>
      </div>

      <button className={styles.lockBtn} onClick={handleLock} aria-label="Lock vault">
        <LockIcon />
      </button>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}