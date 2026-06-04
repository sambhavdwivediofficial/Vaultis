import React from "react";
import Dialog, { DialogFooter } from "../ui/Dialog.jsx";
import Button from "../ui/Button.jsx";
import styles from "./DeleteModal.module.css";

export default function DeleteModal({ open, onClose, onConfirm, title, description, loading }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Confirm Delete"
      size="sm"
    >
      <div className={styles.body}>
        <div className={styles.iconWrap}>
          <WarnIcon />
        </div>
        <div className={styles.text}>
          <p className={styles.itemTitle}>{title}</p>
          <p className={styles.desc}>
            {description || "This action cannot be undone. The item will be permanently deleted."}
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
          Delete permanently
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function WarnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="var(--accent-danger)" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}