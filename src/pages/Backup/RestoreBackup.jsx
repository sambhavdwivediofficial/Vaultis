import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import ContentArea from "../../components/layout/ContentArea.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Dialog, { DialogFooter } from "../../components/ui/Dialog.jsx";
import { useToast } from "../../hooks/useToast.js";
import { tauriBackup } from "../../services/tauriBridge.js";
import { formatBytes, formatDate } from "../../utils/helpers.js";
import { isSmallScreen } from "../../utils/helpers.js";
import styles from "./RestoreBackup.module.css";

export default function RestoreBackup() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [step, setStep] = useState("select"); // select → password → progress → confirm
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState(0);

  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupPassword, setBackupPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [restoreMetadata, setRestoreMetadata] = useState(true);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleSelectBackup = async () => {
    try {
      // TODO: Open file dialog to select backup
      // For now, assume user selected a backup
      setSelectedBackup({
        name: "backup_2025-06-03.vaultis",
        size: 1024 * 1024 * 150,
        date: new Date().toISOString(),
        checksum: "abc123def456",
      });
      setStep("password");
    } catch (e) {
      showError(e.message || "Failed to select backup");
    }
  };

  const handleVerifyPassword = async () => {
    if (!backupPassword) {
      setPasswordError("Password is required");
      return;
    }

    setRestoring(true);
    setPasswordError("");

    try {
      // Verify backup integrity with password
      const result = await tauriBackup.verify(selectedBackup.name, backupPassword);
      
      if (result.ok) {
        success("Backup verified successfully");
        setStep("confirm");
      } else {
        setPasswordError(result.error || "Invalid password or corrupted backup");
      }
    } catch (e) {
      setPasswordError(e.message || "Verification failed");
    } finally {
      setRestoring(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (confirmText !== "RESTORE") {
      showError('Type "RESTORE" to confirm');
      return;
    }

    setStep("progress");
    setRestoring(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? prev : prev + Math.random() * 25));
      }, 800);

      const result = await tauriBackup.restore(selectedBackup.name, {
        password: backupPassword,
        includeMetadata: restoreMetadata,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.ok) {
        success("Vault restored successfully");
        setTimeout(() => setStep("complete"), 1500);
      } else {
        setStep("confirm");
        showError(result.error || "Restore failed");
      }
    } catch (e) {
      setStep("confirm");
      showError(e.message || "Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {isSmallScreen() && <Navbar onMenuToggle={() => {}} />}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <div className={styles.main}>
        <Header
          title="Restore from Backup"
          subtitle={
            step === "select"
              ? "Select a backup to restore"
              : step === "password"
              ? "Verify your backup with password"
              : step === "confirm"
              ? "Confirm restoration"
              : step === "progress"
              ? "Restoring your vault..."
              : "Restoration complete"
          }
        />

        <ContentArea>
          {/* ── STEP 1: SELECT BACKUP ─────────────────────────────── */}
          {step === "select" && (
            <div className={styles.container}>
              <Card padding="lg" className={styles.infoBanner}>
                <div className={styles.infoContent}>
                  <InfoIcon />
                  <div>
                    <p className={styles.infoTitle}>Select a backup file</p>
                    <p className={styles.infoText}>
                      Choose a previously created .vaultis backup file to restore your vault.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Warning */}
              <Card padding="lg" className={styles.warningCard}>
                <div className={styles.warningTitle}>
                  <AlertIcon /> Important
                </div>
                <p className={styles.warningText}>
                  Restoring from a backup will <strong>replace your current vault</strong> with the 
                  backed-up version. Make sure you have a recent backup of your current vault before 
                  proceeding.
                </p>
              </Card>

              {/* File selector */}
              <Card padding="lg">
                <div className={styles.fileSelector}>
                  <div className={styles.fileSelectorIcon}>
                    <FileOpenIcon />
                  </div>
                  <p className={styles.fileSelectorText}>
                    Choose a .vaultis backup file
                  </p>
                  <p className={styles.fileSelectorHint}>
                    .vaultis • Encrypted backup
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<BrowseIcon />}
                    onClick={handleSelectBackup}
                    fullWidth
                  >
                    Browse for backup
                  </Button>
                </div>
              </Card>

              {/* Recent backups */}
              <Card padding="lg">
                <div className={styles.sectionTitle}>Recent backups</div>
                <div className={styles.backupList}>
                  <BackupListItem
                    name="backup_2025-06-03.vaultis"
                    size={1024 * 1024 * 150}
                    date={new Date().toISOString()}
                    onClick={() => {
                      setSelectedBackup({
                        name: "backup_2025-06-03.vaultis",
                        size: 1024 * 1024 * 150,
                        date: new Date().toISOString(),
                      });
                      setStep("password");
                    }}
                  />
                  <BackupListItem
                    name="backup_2025-05-27.vaultis"
                    size={1024 * 1024 * 145}
                    date={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
                    onClick={() => {
                      setSelectedBackup({
                        name: "backup_2025-05-27.vaultis",
                        size: 1024 * 1024 * 145,
                        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                      });
                      setStep("password");
                    }}
                  />
                </div>
              </Card>
            </div>
          )}

          {/* ── STEP 2: PASSWORD VERIFICATION ─────────────────────── */}
          {step === "password" && selectedBackup && (
            <div className={styles.container}>
              {/* Backup info */}
              <Card padding="lg" className={styles.backupInfoCard}>
                <div className={styles.backupInfoHeader}>
                  <FileIcon />
                  <div>
                    <p className={styles.backupName}>{selectedBackup.name}</p>
                    <p className={styles.backupMeta}>
                      {formatBytes(selectedBackup.size)} • {formatDate(selectedBackup.date)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Password form */}
              <Card padding="lg">
                <p className={styles.sectionTitle}>Enter backup password</p>
                <p className={styles.sectionDesc}>
                  Enter your master password to decrypt and restore the backup.
                </p>
                <Input
                  type="password"
                  label="Master Password"
                  value={backupPassword}
                  onChange={e => {
                    setBackupPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Enter your master password"
                  error={passwordError}
                  autoFocus
                />
              </Card>

              {/* Options */}
              <Card padding="lg">
                <div className={styles.optionRow}>
                  <div>
                    <p className={styles.optionName}>Restore metadata</p>
                    <p className={styles.optionDetail}>
                      Restore timestamps, tags, colors, and custom metadata
                    </p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={restoreMetadata}
                      onChange={e => setRestoreMetadata(e.target.checked)}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </Card>

              {/* Actions */}
              <div className={styles.actions}>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    setStep("select");
                    setBackupPassword("");
                    setPasswordError("");
                  }}
                  fullWidth
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleVerifyPassword}
                  loading={restoring}
                  fullWidth
                >
                  Verify & Continue
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: CONFIRMATION ──────────────────────────────── */}
          {step === "confirm" && selectedBackup && (
            <div className={styles.container}>
              <Card padding="lg" className={styles.dangerCard}>
                <div className={styles.dangerTitle}>
                  <WarningIcon /> This will restore your backup
                </div>
                <p className={styles.dangerText}>
                  Your current vault will be <strong>permanently replaced</strong> with the 
                  backup from <strong>{formatDate(selectedBackup.date, { relative: false })}</strong>.
                </p>
                <p className={styles.dangerText}>
                  Any changes made since this backup was created will be lost.
                </p>
              </Card>

              <Card padding="lg">
                <p className={styles.confirmLabel}>
                  Type <strong>RESTORE</strong> to confirm
                </p>
                <Input
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type RESTORE"
                  autoFocus
                />
              </Card>

              <div className={styles.actions}>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setStep("password")}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleConfirmRestore}
                  loading={restoring}
                  disabled={confirmText !== "RESTORE"}
                  fullWidth
                >
                  Restore Now
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: PROGRESS ──────────────────────────────────── */}
          {step === "progress" && (
            <div className={styles.progressContainer}>
              <Card padding="lg" className={styles.progressCard}>
                <div className={styles.progressIcon}>
                  <LockIcon />
                </div>
                <p className={styles.progressTitle}>
                  Restoring your vault...
                </p>

                <div className={styles.progressBarWrap}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className={styles.progressPercent}>
                    {Math.round(Math.min(progress, 100))}%
                  </p>
                </div>

                <div className={styles.progressDetails}>
                  <DetailRow label="Backup" value={selectedBackup.name} />
                  <DetailRow label="Size" value={formatBytes(selectedBackup.size)} />
                  <DetailRow
                    label="Status"
                    value={
                      progress < 30
                        ? "Reading backup..."
                        : progress < 60
                        ? "Decrypting..."
                        : progress < 90
                        ? "Verifying..."
                        : "Finalizing..."
                    }
                    animated
                  />
                </div>

                <p className={styles.progressHint}>
                  Do not close the application during restoration
                </p>
              </Card>
            </div>
          )}

          {/* ── STEP 5: COMPLETE ──────────────────────────────────── */}
          {step === "complete" && (
            <div className={styles.completeContainer}>
              <Card padding="lg" className={styles.completeCard}>
                <div className={styles.completeIcon}>
                  <CheckIcon />
                </div>
                <p className={styles.completeTitle}>
                  Backup restored successfully!
                </p>
                <p className={styles.completeSubtitle}>
                  Your vault has been restored to the backed-up state
                </p>

                <div className={styles.completeSummary}>
                  <SummaryRow label="Restored From" value={selectedBackup.name} />
                  <SummaryRow label="Backup Date" value={formatDate(selectedBackup.date)} />
                  <SummaryRow label="Backup Size" value={formatBytes(selectedBackup.size)} />
                </div>

                <div className={styles.nextSteps}>
                  <p className={styles.nextStepsTitle}>Next steps:</p>
                  <ol className={styles.nextStepsList}>
                    <li>Your vault is now restored and locked</li>
                    <li>Unlock your vault with your master password</li>
                    <li>Verify all your data has been restored correctly</li>
                    <li>Create a new backup to protect your current state</li>
                  </ol>
                </div>

                <div className={styles.completeActions}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate("/unlock")}
                    fullWidth
                  >
                    Go to unlock
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate("/backup")}
                    fullWidth
                  >
                    Back to backups
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </ContentArea>
      </div>
    </div>
  );
}

function BackupListItem({ name, size, date, onClick }) {
  return (
    <button className={styles.backupItem} onClick={onClick}>
      <div className={styles.backupItemIcon}>
        <FileIcon />
      </div>
      <div className={styles.backupItemInfo}>
        <p className={styles.backupItemName}>{name}</p>
        <p className={styles.backupItemMeta}>
          {formatBytes(size)} • {formatDate(date)}
        </p>
      </div>
      <ChevronIcon />
    </button>
  );
}

function DetailRow({ label, value, animated }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={`${styles.detailValue} ${animated ? styles.animated : ""}`}>
        {value}
      </span>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  );
}

function InfoIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>; }
function AlertIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function WarningIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function FileIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>; }
function FileOpenIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.4" strokeLinecap="round"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>; }
function BrowseIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="1" x2="12" y2="21"/></svg>; }
function LockIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.4" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function CheckIcon() { return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function ChevronIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>; }
