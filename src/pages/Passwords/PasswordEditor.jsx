import React, { useEffect, useState } from "react";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Dialog, { DialogFooter } from "../../components/ui/Dialog.jsx";
import { useToast } from "../../hooks/useToast.js";
import usePasswordStore from "../../store/passwordStore.js";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import ContentArea from "../../components/layout/ContentArea.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import { isSmallScreen, getPasswordStrength } from "../../utils/helpers.js";
import { PASSWORD_STRENGTH_LABELS, PASSWORD_STRENGTH_COLORS } from "../../utils/constants.js";
import styles from "./PasswordEditor.module.css";

export default function PasswordEditor({ entryId, onClose, onSaved }) {
  const { success, error: showError } = useToast();
  const fetchOne = usePasswordStore(s => s.fetchOne);
  const create = usePasswordStore(s => s.create);
  const update = usePasswordStore(s => s.update);
  const delete_ = usePasswordStore(s => s.delete);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isFav, setIsFav] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);
  const strengthLabel = PASSWORD_STRENGTH_LABELS[strength];
  const strengthColor = PASSWORD_STRENGTH_COLORS[strength];

  useEffect(() => {
    if (entryId) {
      fetchOne(entryId).then(entry => {
        if (entry) {
          setName(entry.name);
          setUsername(entry.username);
          setPassword(entry.password);
          setUrl(entry.url || "");
          setNotes(entry.notes || "");
          setIsFav(entry.is_favorite);
        }
      });
    }
  }, [entryId, fetchOne]);

  const handleSave = async () => {
    if (!name.trim()) { showError("Name is required"); return; }
    if (!password) { showError("Password is required"); return; }
    
    setLoading(true);
    const data = {
      name: name.trim(),
      username,
      password,
      url,
      notes,
      isFavorite: isFav,
    };
    
    const result = entryId
      ? await update(entryId, data)
      : await create(data);
    
    setLoading(false);
    if (result.ok) {
      success(entryId ? "Password updated" : "Password saved");
      setTimeout(() => { onSaved?.(); onClose?.(); }, 800);
    } else {
      showError(result.error);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const result = await delete_(entryId);
    setLoading(false);
    if (result.ok) {
      success("Password deleted");
      setTimeout(() => { onSaved?.(); onClose?.(); }, 800);
    } else {
      showError(result.error);
    }
  };

  return (
    <div className={styles.wrapper}>
      {isSmallScreen() && <Navbar onMenuToggle={() => {}} />}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />

      <div className={styles.main}>
        <Header
          title={entryId ? "Edit password" : "Add password"}
          actions={
            <div className={styles.actions}>
              {entryId && (
                <Button variant="ghost" size="sm" icon={<TrashIcon />} onClick={() => setShowDeleteConfirm(true)} />
              )}
              <Button variant="primary" size="sm" onClick={handleSave} loading={loading}>
                Save
              </Button>
            </div>
          }
        />

        <ContentArea>
          <div className={styles.form}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Basic Info</h3>
              <Input
                label="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Gmail, GitHub, Bank"
                required
              />
              <Input
                label="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username or email"
              />
              <Input
                label="Website URL"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Security</h3>
              <div className={styles.passwordField}>
                <label className={styles.label}>Master Password</label>
                <div className={styles.passInputWrap}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter a strong password"
                    className={styles.input}
                    required
                  />
                  <button
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {password && (
                <div className={styles.strength}>
                  <div className={styles.strengthBar}>
                    {[0, 1, 2, 3, 4].map(i => (
                      <span
                        key={i}
                        className={styles.strengthSegment}
                        style={{ background: i <= strength ? strengthColor : "var(--border-subtle)" }}
                      />
                    ))}
                  </div>
                  <span className={styles.strengthLabel} style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Additional</h3>
              <div className={styles.notesField}>
                <label className={styles.label}>Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Security questions, recovery codes, or other notes..."
                  className={styles.textarea}
                  rows={4}
                />
              </div>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isFav}
                  onChange={e => setIsFav(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Mark as favorite</span>
              </label>
            </div>

            <div className={styles.formActions}>
              <Button variant="ghost" onClick={onClose} fullWidth>Cancel</Button>
              <Button variant="primary" onClick={handleSave} loading={loading} fullWidth>
                Save password
              </Button>
            </div>
          </div>
        </ContentArea>
      </div>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete password?"
        size="sm"
      >
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
          This password entry will be permanently deleted from your vault.
        </p>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)} fullWidth>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={loading} fullWidth>Delete</Button>
        </div>
      </Dialog>
    </div>
  );
}

function TrashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>; }
function EyeIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOffIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
