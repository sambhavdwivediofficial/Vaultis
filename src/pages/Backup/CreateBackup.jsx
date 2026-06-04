import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import ContentArea from "../../components/layout/ContentArea.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Dialog, { DialogFooter } from "../../components/ui/Dialog.jsx";
import { useToast } from "../../hooks/useToast.js";
import useAuthStore from "../../store/authStore.js";
import useNoteStore from "../../store/noteStore.js";
import usePasswordStore from "../../store/passwordStore.js";
import useFileStore from "../../store/fileStore.js";
import { tauriBackup } from "../../services/tauriBridge.js";
import { formatBytes, formatDate } from "../../utils/helpers.js";
import { isSmallScreen } from "../../utils/helpers.js";
import styles from "./CreateBackup.module.css";

export default function CreateBackup() {
  const navigate = useNavigate();
  const { success, error: showError, warning } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const vaultInfo = useAuthStore(s => s.vaultInfo);
  const notes = useNoteStore(s => s.notes);
  const passwords = usePasswordStore(s => s.passwords);
  const files = useFileStore(s => s.files);

  const [step, setStep] = useState("review"); // review → progress → confirm
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backupSize, setBackupSize] = useState(0);
  const [backupPath, setBackupPath] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [encryptionMethod, setEncryptionMethod] = useState("aes256-gcm");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  // Calculate stats
  const noteCount = notes.filter(n => !n.deleted_at).length;
  const passwordCount = passwords.filter(p => !p.deleted_at).length;
  const fileCount = files.filter(f => !f.deleted_at).length;
  const totalFileSize = files
    .filter(f => !f.deleted_at)
    .reduce((acc, f) => acc + (f.original_size || 0), 0);

  const totalItems = noteCount + passwordCount + fileCount;

  // Estimate backup size (typically 30-40% of original with encryption)
  const estimatedBackupSize = Math.round(totalFileSize * 0.35 + totalItems * 2048);
  const estimatedDurationMs = estimatedBackupSize / (10 * 1024 * 1024) * 1000; // ~10MB/s estimate

  const handleCreateBackup = useCallback(async () => {
    if (totalItems === 0) {
      showError("Nothing to backup — vault is empty");
      return;
    }

    setStep("progress");
    setCreating(true);
    setProgress(0);

    try {
      // Simulate progress for UI (real progress would come from Tauri)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 30;
        });
      }, 500);

      const result = await tauriBackup.create({
        includeMetadata,
        encryptionMethod,
        compressionLevel: 9,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.ok) {
        setBackupSize(result.backupSize || estimatedBackupSize);
        setBackupPath(result.backupPath);
        success("Backup created successfully");
        setTimeout(() => setStep("confirm"), 1500);
      } else {
        setStep("review");
        showError(result.error || "Backup creation failed");
      }
    } catch (err) {
      setStep("review");
      showError(err.message || "Backup failed — please try again");
    } finally {
      setCreating(false);
    }
  }, [totalItems, includeMetadata, encryptionMethod, showError, success]);

  const handleViewBackups = () => {
    navigate("/backup");
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
          title="Create Backup"
          subtitle={
            step === "review"
              ? "Prepare your vault for backup"
              : step === "progress"
              ? "Encrypting and storing backup..."
              : "Backup completed successfully"
          }
        />

        <ContentArea>
          {/* ── STEP 1: REVIEW ─────────────────────────────────────── */}
          {step === "review" && (
            <div className={styles.container}>
              {/* Info banner */}
              <Card padding="lg" className={styles.infoBanner}>
                <div className={styles.infoBannerContent}>
                  <div className={styles.infoIcon}>
                    <InfoIcon />
                  </div>
                  <div>
                    <p className={styles.infoBannerTitle}>
                      About your backup
                    </p>
                    <p className={styles.infoBannerText}>
                      Backups are encrypted with {encryptionMethod === "aes256-gcm" ? "AES-256-GCM" : "ChaCha20-Poly1305"} and 
                      stored locally on your computer. You can restore from any backup at any time.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Stats grid */}
              <div className={styles.statsGrid}>
                <StatCard
                  icon={<NoteIcon />}
                  label="Notes"
                  value={noteCount}
                  detail={`${noteCount} encrypted note${noteCount !== 1 ? "s" : ""}`}
                />
                <StatCard
                  icon={<KeyIcon />}
                  label="Passwords"
                  value={passwordCount}
                  detail={`${passwordCount} account${passwordCount !== 1 ? "s" : ""}`}
                />
                <StatCard
                  icon={<FileIcon />}
                  label="Files"
                  value={fileCount}
                  detail={`${formatBytes(totalFileSize)} total`}
                />
                <StatCard
                  icon={<DataIcon />}
                  label="Backup Size"
                  value={formatBytes(estimatedBackupSize)}
                  detail="Compressed & encrypted"
                />
              </div>

              {/* Options */}
              <Card padding="lg">
                <div className={styles.sectionTitle}>
                  <SettingsIcon /> Backup Options
                </div>

                <div className={styles.optionGroup}>
                  {/* Encryption method */}
                  <div className={styles.optionRow}>
                    <div className={styles.optionLabel}>
                      <p className={styles.optionName}>Encryption Method</p>
                      <p className={styles.optionDetail}>
                        Choose the encryption algorithm
                      </p>
                    </div>
                    <select
                      className={styles.select}
                      value={encryptionMethod}
                      onChange={e => setEncryptionMethod(e.target.value)}
                    >
                      <option value="aes256-gcm">
                        AES-256-GCM (Recommended)
                      </option>
                      <option value="chacha20-poly1305">
                        ChaCha20-Poly1305 (Fast)
                      </option>
                    </select>
                  </div>

                  <div className={styles.divider} />

                  {/* Include metadata */}
                  <div className={styles.optionRow}>
                    <div className={styles.optionLabel}>
                      <p className={styles.optionName}>Include Metadata</p>
                      <p className={styles.optionDetail}>
                        Save timestamps, tags, and colors
                      </p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={includeMetadata}
                        onChange={e => setIncludeMetadata(e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </Card>

              {/* Important info */}
              <Card padding="lg" className={styles.importantCard}>
                <div className={styles.importantTitle}>
                  <AlertIcon /> Important
                </div>
                <ul className={styles.importantList}>
                  <li>Backups are encrypted with your master password</li>
                  <li>Store backups in a safe location (external drive, cloud)</li>
                  <li>Estimated size: <strong>{formatBytes(estimatedBackupSize)}</strong></li>
                  <li>Estimated time: <strong>{Math.ceil(estimatedDurationMs / 1000)}s</strong></li>
                  <li>Your vault remains encrypted and secure</li>
                </ul>
              </Card>

              {/* Warning if large */}
              {estimatedBackupSize > 1024 * 1024 * 1024 && (
                <Card padding="lg" className={styles.warningCard}>
                  <div className={styles.warningTitle}>
                    <WarningIcon /> Large Backup
                  </div>
                  <p className={styles.warningText}>
                    Your backup is over 1GB. Make sure you have enough storage space.
                    This may take a few minutes depending on your storage speed.
                  </p>
                </Card>
              )}

              {/* Action buttons */}
              <div className={styles.actions}>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleViewBackups}
                  fullWidth
                >
                  View existing backups
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCreateBackup}
                  loading={creating}
                  disabled={totalItems === 0}
                  fullWidth
                >
                  Start backup
                </Button>
              </div>

              {totalItems === 0 && (
                <p className={styles.disabledHint}>
                  Add notes, passwords, or files to your vault before creating a backup
                </p>
              )}
            </div>
          )}

          {/* ── STEP 2: PROGRESS ──────────────────────────────────── */}
          {step === "progress" && (
            <div className={styles.progressContainer}>
              <div className={styles.progressCard}>
                {/* Icon animation */}
                <div className={styles.progressIcon}>
                  <LockIcon />
                </div>

                {/* Progress title */}
                <h2 className={styles.progressTitle}>
                  Creating your backup...
                </h2>

                {/* Progress bar */}
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

                {/* Details */}
                <div className={styles.progressDetails}>
                  <DetailRow
                    label="Items"
                    value={`${totalItems} items`}
                  />
                  <DetailRow
                    label="Size"
                    value={formatBytes(estimatedBackupSize)}
                  />
                  <DetailRow
                    label="Encryption"
                    value={
                      encryptionMethod === "aes256-gcm"
                        ? "AES-256-GCM"
                        : "ChaCha20-Poly1305"
                    }
                  />
                  <DetailRow
                    label="Status"
                    value={
                      progress < 30
                        ? "Gathering data..."
                        : progress < 60
                        ? "Encrypting..."
                        : progress < 90
                        ? "Compressing..."
                        : "Finalizing..."
                    }
                    animated
                  />
                </div>

                {/* Tips */}
                <div className={styles.tips}>
                  <p className={styles.tipsTitle}>💡 Keep your backup safe</p>
                  <ul className={styles.tipsList}>
                    <li>Store on external drive or cloud storage</li>
                    <li>Keep multiple copies in different locations</li>
                    <li>Test restore regularly to ensure integrity</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: CONFIRM ───────────────────────────────────── */}
          {step === "confirm" && (
            <div className={styles.confirmContainer}>
              <div className={styles.confirmCard}>
                {/* Success icon */}
                <div className={styles.successIcon}>
                  <CheckIcon />
                </div>

                {/* Success message */}
                <h2 className={styles.successTitle}>
                  Backup created successfully!
                </h2>

                <p className={styles.successSubtitle}>
                  Your vault has been encrypted and backed up
                </p>

                {/* Backup details */}
                <div className={styles.backupSummary}>
                  <SummaryRow
                    label="Backup Date"
                    value={formatDate(new Date().toISOString())}
                  />
                  <SummaryRow
                    label="Backup Size"
                    value={formatBytes(backupSize)}
                  />
                  <SummaryRow
                    label="Items Included"
                    value={`${noteCount} notes, ${passwordCount} passwords, ${fileCount} files`}
                  />
                  <SummaryRow
                    label="Encryption"
                    value={
                      encryptionMethod === "aes256-gcm"
                        ? "AES-256-GCM"
                        : "ChaCha20-Poly1305"
                    }
                  />
                  {backupPath && (
                    <SummaryRow
                      label="Location"
                      value={backupPath}
                      code
                    />
                  )}
                </div>

                {/* Next steps */}
                <div className={styles.nextSteps}>
                  <p className={styles.nextStepsTitle}>📋 Next steps:</p>
                  <ol className={styles.nextStepsList}>
                    <li>Store your backup in a safe location</li>
                    <li>Keep it separate from your main computer</li>
                    <li>Create backups regularly (weekly recommended)</li>
                    <li>Test restore process occasionally</li>
                  </ol>
                </div>

                {/* CTA buttons */}
                <div className={styles.confirmActions}>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleViewBackups}
                    fullWidth
                  >
                    View all backups
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate("/dashboard")}
                    fullWidth
                  >
                    Return to dashboard
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ContentArea>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, detail }) {
  return (
    <Card padding="md" hoverable>
      <div className={styles.statCardContent}>
        <div className={styles.statIcon}>{icon}</div>
        <div>
          <p className={styles.statLabel}>{label}</p>
          <p className={styles.statValue}>{value}</p>
          <p className={styles.statDetail}>{detail}</p>
        </div>
      </div>
    </Card>
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

function SummaryRow({ label, value, code }) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={`${styles.summaryValue} ${code ? styles.code : ""}`}>
        {value}
      </span>
    </div>
  );
}

function InfoIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>; }
function AlertIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function WarningIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warning)" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function NoteIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function KeyIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>; }
function FileIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>; }
function DataIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m2.12-2.12l4.24-4.24M19.78 19.78l-4.24-4.24m-2.12-2.12l-4.24-4.24"/></svg>; }
function LockIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.4" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function CheckIcon() { return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
