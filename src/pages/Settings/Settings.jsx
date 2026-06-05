import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import ContentArea from "../../components/layout/ContentArea.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Dialog, { DialogFooter } from "../../components/ui/Dialog.jsx";
import { useToast } from "../../hooks/useToast.js";
import useSettingsStore from "../../store/settingsStore.js";
import useAuthStore from "../../store/authStore.js";
import { tauriVault } from "../../services/tauriBridge.js";
import { AUTO_LOCK_OPTIONS } from "../../utils/constants.js";
import { isSmallScreen } from "../../utils/helpers.js";
import styles from "./Settings.module.css";

const CLIPBOARD_CLEAR_OPTIONS = [
  { label: "Never",     value: 0 },
  { label: "10 seconds", value: 10 },
  { label: "30 seconds", value: 30 },
  { label: "1 minute",  value: 60 },
  { label: "5 minutes", value: 300 },
];

const FONT_SIZE_OPTIONS = [
  { label: "Small",  value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large",  value: "large" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const settings = useSettingsStore(s => s.settings);
  const update = useSettingsStore(s => s.update);
  const reset = useSettingsStore(s => s.reset);
  const fetch_ = useSettingsStore(s => s.fetch);

  const changePassword = useAuthStore(s => s.changePassword);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const handleSettingChange = (key, value) => {
    update({ [key]: value });
    success("Setting updated");
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { showError("Current password required"); return; }
    if (!newPassword) { showError("New password required"); return; }
    if (newPassword.length < 8) { showError("Min 8 characters"); return; }
    if (newPassword !== confirmPassword) { showError("Passwords don't match"); return; }

    setChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setChangingPassword(false);

    if (result.ok) {
      success("Password changed successfully");
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      showError(result.error || "Failed to change password");
    }
  };

  const handleReset = async () => {
    setResetting(true);
    const result = await reset();
    setResetting(false);

    if (result.ok) {
      success("Settings reset to defaults");
      setShowResetDialog(false);
      fetch_();
    } else {
      showError("Reset failed");
    }
  };

  const handleDeleteVaultis = async () => {
    if (deleteConfirmText !== "DELETE VAULTIS") {
      showError('Type "DELETE VAULTIS" to confirm');
      return;
    }

    setDeleting(true);
    try {
      const result = await tauriVault.deleteVaultPermanently();
      
      if (result.ok) {
        success("Vault deleted permanently");
        setShowDeleteDialog(false);
        
        // Wait a moment for the toast to show, then navigate
        setTimeout(() => {
          navigate("/", { replace: true });
          window.location.reload();
        }, 1500);
      } else {
        showError(result.error || "Failed to delete vault");
      }
    } catch (e) {
      showError(e.message || "Deletion failed");
    } finally {
      setDeleting(false);
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
        <Header title="Settings" />

        <ContentArea>
          <div className={styles.container}>
            {/* Security Section */}
            <Card padding="lg">
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <ShieldIcon /> Security
                </h3>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.label}>Master Password</p>
                  <p className={styles.hint}>Change your vault's master password</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Change password
                </Button>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.label}>Auto-lock timeout</p>
                  <p className={styles.hint}>Automatically lock vault when inactive</p>
                </div>
                <Select
                  options={AUTO_LOCK_OPTIONS}
                  value={settings.auto_lock_secs?.toString()}
                  onChange={v => handleSettingChange("auto_lock_secs", parseInt(v))}
                  size="sm"
                  className={styles.selectSmall}
                />
              </div>
            </Card>

            {/* Clipboard Section */}
            <Card padding="lg">
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <CopyIcon /> Clipboard
                </h3>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.label}>Auto-clear clipboard</p>
                  <p className={styles.hint}>Automatically clear sensitive data from clipboard</p>
                </div>
                <Select
                  options={CLIPBOARD_CLEAR_OPTIONS}
                  value={settings.clipboard_clear_secs?.toString()}
                  onChange={v => handleSettingChange("clipboard_clear_secs", parseInt(v))}
                  size="sm"
                  className={styles.selectSmall}
                />
              </div>
            </Card>

            {/* Display Section */}
            <Card padding="lg">
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <PaletteIcon /> Display
                </h3>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.label}>Font size</p>
                  <p className={styles.hint}>Adjust UI text size for readability</p>
                </div>
                <Select
                  options={FONT_SIZE_OPTIONS}
                  value={settings.font_size}
                  onChange={v => handleSettingChange("font_size", v)}
                  size="sm"
                  className={styles.selectSmall}
                />
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.label}>Compact mode</p>
                  <p className={styles.hint}>Reduce spacing and card heights</p>
                </div>
                <button
                  className={`${styles.toggle} ${settings.compact_mode ? styles.toggleActive : ""}`}
                  onClick={() => handleSettingChange("compact_mode", !settings.compact_mode)}
                >
                  <span className={styles.toggleSwitch} />
                </button>
              </div>
            </Card>

            {/* Privacy Section */}
            <Card padding="lg">
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <EyeIcon /> Privacy
                </h3>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.label}>Show password strength</p>
                  <p className={styles.hint}>Display strength indicator while typing</p>
                </div>
                <button
                  className={`${styles.toggle} ${settings.show_password_strength ? styles.toggleActive : ""}`}
                  onClick={() => handleSettingChange("show_password_strength", !settings.show_password_strength)}
                >
                  <span className={styles.toggleSwitch} />
                </button>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.label}>Minimize to tray</p>
                  <p className={styles.hint}>Close to system tray instead of exiting</p>
                </div>
                <button
                  className={`${styles.toggle} ${settings.minimize_to_tray ? styles.toggleActive : ""}`}
                  onClick={() => handleSettingChange("minimize_to_tray", !settings.minimize_to_tray)}
                >
                  <span className={styles.toggleSwitch} />
                </button>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.label}>Launch at startup</p>
                  <p className={styles.hint}>Automatically start Vaultis on system boot</p>
                </div>
                <button
                  className={`${styles.toggle} ${settings.launch_at_startup ? styles.toggleActive : ""}`}
                  onClick={() => handleSettingChange("launch_at_startup", !settings.launch_at_startup)}
                >
                  <span className={styles.toggleSwitch} />
                </button>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card padding="lg" className={styles.dangerCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle} style={{ color: "var(--accent-danger)" }}>
                  <AlertIcon /> Danger Zone
                </h3>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.label}>Reset all settings</p>
                  <p className={styles.hint}>Restore default settings for this vault</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetDialog(true)}
                >
                  Reset
                </Button>
              </div>

              <div className={styles.divider} />

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.label} style={{ color: "var(--accent-danger)" }}>Delete Vaultis</p>
                  <p className={styles.hint} style={{ color: "var(--accent-danger)" }}>Permanently delete your vault and all data</p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        </ContentArea>
      </div>

      {/* Change Password Dialog */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        title="Change Master Password"
        size="sm"
      >
        <div className={styles.dialogForm}>
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            required
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Enter a new password"
            hint="Min 8 characters"
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            required
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setShowPasswordDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleChangePassword}
            loading={changingPassword}
          >
            Change password
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Reset Settings Dialog */}
      <Dialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        title="Reset Settings?"
        size="sm"
      >
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
          All settings will be restored to their default values. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button variant="ghost" size="sm" onClick={() => setShowResetDialog(false)} fullWidth>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleReset} loading={resetting} fullWidth>
            Reset all
          </Button>
        </div>
      </Dialog>

      {/* Delete Vaultis Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Vaultis?"
        size="sm"
      >
        <div className={styles.deleteWarning}>
          <div className={styles.deleteWarningIcon}>
            <WarningIcon />
          </div>
          <p className={styles.deleteWarningTitle}>
            This action is permanent and irreversible
          </p>
          <p className={styles.deleteWarningText}>
            Your vault, all passwords, notes, files, and settings will be permanently deleted. 
            There is no way to recover your data after this.
          </p>
          <p className={styles.deleteWarningText}>
            To confirm deletion, type <strong>DELETE VAULTIS</strong>
          </p>
        </div>

        <Input
          value={deleteConfirmText}
          onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
          placeholder="Type DELETE VAULTIS"
          autoFocus
        />

        <DialogFooter style={{ marginTop: "var(--space-4)" }}>
          <Button variant="ghost" size="sm" onClick={() => {
            setShowDeleteDialog(false);
            setDeleteConfirmText("");
          }} fullWidth style={{ marginTop: "var(--space-4)" }}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteVaultis}
            loading={deleting}
            disabled={deleteConfirmText !== "DELETE VAULTIS"}
            fullWidth style={{ marginTop: "var(--space-4)" }}
          >
            Delete Permanently
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function ShieldIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function CopyIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
function PaletteIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="13" cy="13" r="8"/><path d="M5.64 5.64a8 8 0 0 1 10.72 10.72"/><circle cx="6" cy="20" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="12" cy="4" r="1"/></svg>; }
function EyeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function AlertIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function WarningIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
