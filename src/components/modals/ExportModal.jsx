import React, { useState } from "react";
import Dialog, { DialogFooter } from "../ui/Dialog.jsx";
import Button from "../ui/Button.jsx";
import { useToast } from "../../hooks/useToast.js";
import { tauriBackup } from "../../services/tauriBridge.js";
import styles from "./ExportModal.module.css";

export default function ExportModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(null);
  const { success, error }    = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await tauriBackup.export("C:\\Users\\Public\\Documents");
      setDone(result);
      success("Vault exported successfully");
    } catch (e) {
      error(e?.message || "Export failed");
    }
    setLoading(false);
  };

  const handleClose = () => { setDone(null); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} title="Export Vault" size="sm"
      description="Create an encrypted backup of your entire vault.">
      <div className={styles.body}>
        {done ? (
          <div className={styles.success}>
            <div className={styles.successIcon}><CheckIcon /></div>
            <p className={styles.successText}>Export complete</p>
            <p className={styles.successPath}>{done.backup_path}</p>
            <p className={styles.successMeta}>
              Size: {(done.size_bytes / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className={styles.info}>
            <InfoRow icon={<ShieldIcon />} label="Fully encrypted" desc="All data is AES-256-GCM encrypted before export" />
            <InfoRow icon={<KeyIcon />}    label="Password required" desc="You need your master password to restore this backup" />
            <InfoRow icon={<FileIcon />}   label=".vaultis format" desc="Portable and self-contained backup archive" />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          {done ? "Close" : "Cancel"}
        </Button>
        {!done && (
          <Button variant="primary" size="sm" onClick={handleExport} loading={loading}>
            Export vault
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}

function InfoRow({ icon, label, desc }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoIcon}>{icon}</span>
      <div>
        <p className={styles.infoLabel}>{label}</p>
        <p className={styles.infoDesc}>{desc}</p>
      </div>
    </div>
  );
}

function CheckIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function ShieldIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function KeyIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>; }
function FileIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>; }
