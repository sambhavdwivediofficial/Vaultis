import React, { useState } from "react";
import Dialog, { DialogFooter } from "../ui/Dialog.jsx";
import Button from "../ui/Button.jsx";
import { useClipboard } from "../../hooks/useClipboard.js";
import styles from "./RecoveryModal.module.css";

export default function RecoveryModal({ open, recoveryKey, onClose }) {
  const [confirmed, setConfirmed] = useState(false);
  const { copy, copied } = useClipboard();

  const handleCopy = () => copy(recoveryKey, "recovery");

  return (
    <Dialog open={open} onClose={undefined} title="Save Your Recovery Key" hideClose size="md"
      description="Store this key somewhere safe. It's the only way to recover your vault if you forget your password.">
      <div className={styles.body}>
        {/* Warning banner */}
        <div className={styles.warning}>
          <WarnIcon />
          <p>This key will never be shown again. Write it down or store it securely offline.</p>
        </div>

        {/* Key display */}
        <div className={styles.keyWrap}>
          <span className={styles.key}>{recoveryKey}</span>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied === "recovery" ? <CheckIcon /> : <CopyIcon />}
            {copied === "recovery" ? "Copied!" : "Copy key"}
          </button>
        </div>

        {/* Tips */}
        <div className={styles.tips}>
          <TipRow text="Print it and store in a secure location" />
          <TipRow text="Write it on paper and keep it offline" />
          <TipRow text="Never store digitally without encryption" />
        </div>

        {/* Confirm checkbox */}
        <label className={styles.confirm}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className={styles.checkbox}
          />
          <span>I have saved my recovery key in a safe place</span>
        </label>
      </div>
      <DialogFooter>
        <Button variant="primary" size="md" onClick={onClose} disabled={!confirmed} fullWidth>
          Continue to vault
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function TipRow({ text }) {
  return (
    <div className={styles.tip}>
      <span className={styles.tipDot} />
      <span>{text}</span>
    </div>
  );
}

function WarnIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warning)" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function CopyIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
function CheckIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
