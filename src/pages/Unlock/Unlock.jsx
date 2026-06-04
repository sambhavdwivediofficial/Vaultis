import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore.js";
import { useToast } from "../../hooks/useToast.js";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import { AUTO_LOCK_OPTIONS } from "../../utils/constants.js";
import styles from "./Unlock.module.css";

export default function UnlockPage() {
  const navigate       = useNavigate();
  const unlock         = useAuthStore(s => s.unlock);
  const [password,     setPassword] = useState("");
  const [autoLock,     setAutoLock] = useState("300"); // 5 min default
  const [loading,      setLoading]  = useState(false);
  const [error,        setError]    = useState("");
  const [attempts,     setAttempts] = useState(0);
  const { error: showError } = useToast();

  const handleUnlock = async () => {
    if (!password) { setError("Password is required"); return; }
    setLoading(true);
    setError("");
    
    const result = await unlock(password, parseInt(autoLock));
    
    setLoading(false);
    if (result.ok) {
      setPassword("");
      navigate("/dashboard");
    } else {
      setAttempts(a => a + 1);
      const msg = result.error || "Invalid password";
      setError(msg);
      showError(msg);
      // Auto-lock after 5 failed attempts
      if (attempts >= 4) {
        setPassword("");
        setTimeout(() => navigate("/"), 2000);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && password) handleUnlock();
  };

  const isLocked = attempts >= 5;

  return (
    <div className={styles.wrapper}>
      <div className={styles.bg} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <VaultIcon />
          </div>
          <h1 className={styles.title}>Unlock Vaultis</h1>
          <p className={styles.desc}>Enter your master password to access your encrypted vault</p>
        </div>

        {/* Error alert */}
        {error && (
          <div className={styles.alert} role="alert">
            <AlertIcon />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form className={styles.form} onSubmit={e => { e.preventDefault(); handleUnlock(); }}>
          <Input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); if (error) setError(""); }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your master password"
            error={isLocked ? "Too many attempts. Please restart." : ""}
            disabled={isLocked}
            autoFocus
          />

          {/* <Select
            label="Auto-lock after"
            options={AUTO_LOCK_OPTIONS}
            value={autoLock}
            onChange={setAutoLock}
            disabled={isLocked}
          /> */}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={isLocked || !password}
          >
            Unlock vault
          </Button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.link} onClick={() => navigate("/")}>
            Forgot password?
          </button>
          {attempts > 0 && (
            <span className={styles.attempts}>
              {5 - attempts} attempt{5 - attempts === 1 ? "" : "s"} remaining
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function VaultIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
      stroke="var(--accent-primary)" strokeWidth="1.4" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 9V7M12 17v-2M9 12H7M17 12h-2"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--accent-danger)" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}