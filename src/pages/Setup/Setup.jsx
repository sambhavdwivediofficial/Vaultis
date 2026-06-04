import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore.js";
import { useToast } from "../../hooks/useToast.js";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import RecoveryModal from "../../components/modals/RecoveryModal.jsx";
import { getPasswordStrength } from "../../utils/helpers.js";
import {
  PASSWORD_STRENGTH_LABELS,
  PASSWORD_STRENGTH_COLORS,
} from "../../utils/constants.js";
import styles from "./Setup.module.css";

export default function SetupPage() {
  const navigate                = useNavigate();
  const createVault             = useAuthStore(s => s.createVault);
  const recoveryKey             = useAuthStore(s => s.recoveryKey);
  const clearRecoveryKey        = useAuthStore(s => s.clearRecoveryKey);
  const [vaultName, setVaultName] = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});
  const { error: showError, success } = useToast();

  const strength = getPasswordStrength(password);
  const strengthLabel = PASSWORD_STRENGTH_LABELS[strength];
  const strengthColor = PASSWORD_STRENGTH_COLORS[strength];

  const validate = () => {
    const newErrors = {};
    if (!vaultName.trim()) newErrors.vaultName = "Vault name is required";
    if (vaultName.length > 50) newErrors.vaultName = "Max 50 characters";
    if (!password) newErrors.password = "Password is required";
    if (password.length < 8) newErrors.password = "Min 8 characters";
    if (password !== confirm) newErrors.confirm = "Passwords don't match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await createVault(password, vaultName.trim());
    setLoading(false);
    if (!result.ok) { showError(result.error); return; }
    success("Vault created!");
  };

  const handleRecoveryClose = () => {
    clearRecoveryKey();
    navigate("/dashboard");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.bg} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Create Your Vault</h1>
          <p className={styles.desc}>
            Set up a master password to encrypt all your data. 
            Choose something strong and unique.
          </p>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={e => { e.preventDefault(); handleCreate(); }}>
          {/* Vault name */}
          <Input
            label="Vault name"
            value={vaultName}
            onChange={e => { setVaultName(e.target.value); if (errors.vaultName) setErrors(s => ({ ...s, vaultName: "" })); }}
            placeholder="My Personal Vault"
            error={errors.vaultName}
            required
            autoFocus
          />

          {/* Master password */}
          <Input
            label="Master password"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(s => ({ ...s, password: "" })); }}
            placeholder="Create a strong password"
            error={errors.password}
            required
          />

          {/* Strength indicator */}
          {password && (
            <div className={styles.strengthWrap}>
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

          {/* Confirm password */}
          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); if (errors.confirm) setErrors(s => ({ ...s, confirm: "" })); }}
            placeholder="Re-enter your password"
            error={errors.confirm}
            required
          />

          {/* Requirements */}
          <div className={styles.requirements}>
            <h3 className={styles.reqTitle}>Password requirements:</h3>
            <div className={styles.reqList}>
              <Req met={password.length >= 8} text="At least 8 characters" />
              <Req met={/[A-Z]/.test(password) && /[a-z]/.test(password)} text="Mix of uppercase & lowercase" />
              <Req met={/[0-9]/.test(password)} text="Contains a number" />
              <Req met={/[^A-Za-z0-9]/.test(password)} text="Contains a special character" />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Create vault
          </Button>
        </form>

        {/* Link back */}
        <p className={styles.footer}>
          Already have a vault?{" "}
          <button className={styles.link} onClick={() => navigate("/unlock")}>
            Unlock it
          </button>
        </p>
      </div>

      {/* Recovery key modal */}
      <RecoveryModal open={!!recoveryKey} recoveryKey={recoveryKey} onClose={handleRecoveryClose} />
    </div>
  );
}

function Req({ met, text }) {
  return (
    <div className={styles.req}>
      <span className={styles.reqCheck} style={{ color: met ? "var(--accent-primary)" : "var(--text-disabled)" }}>
        {met ? <CheckIcon /> : <EmptyIcon />}
      </span>
      <span className={styles.reqText} style={{ color: met ? "var(--text-primary)" : "var(--text-tertiary)" }}>
        {text}
      </span>
    </div>
  );
}

function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function EmptyIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>;
}