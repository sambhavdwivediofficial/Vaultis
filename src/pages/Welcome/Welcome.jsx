import React from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore.js";
import Button from "../../components/ui/Button.jsx";
import styles from "./Welcome.module.css";

export default function WelcomePage() {
  const navigate      = useNavigate();
  const vaultExists   = useAuthStore(s => s.vaultExists);

  return (
    <div className={styles.wrapper}>
      {/* Gradient background */}
      <div className={styles.bg} />

      <div className={styles.container}>
        {/* Logo & branding */}
        <div className={styles.logo}>
          <VaultIcon />
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>Vaultis</h1>
          <p className={styles.subtitle}>Privacy-first encrypted vault</p>
          <p className={styles.desc}>
            Keep your passwords, notes, and files secure with military-grade encryption. 
            No cloud, no tracking, no accounts — just your data, fully encrypted locally.
          </p>
        </div>

        {/* Features */}
        <div className={styles.features}>
          <Feature icon={<ShieldIcon />} label="End-to-end encrypted" detail="AES-256-GCM military grade" />
          <Feature icon={<LockIcon />} label="Fully offline" detail="No cloud, no sync, complete control" />
          <Feature icon={<ZeroIcon />} label="Zero knowledge" detail="We never see your data" />
          <Feature icon={<PrivateIcon />} label="No tracking" detail="Privacy by design, open source" />
        </div>

        {/* CTA buttons */}
        <div className={styles.actions}>
          {vaultExists ? (
            <>
              <Button variant="primary" size="lg" onClick={() => navigate("/unlock")} fullWidth>
                Unlock vault
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/setup")} fullWidth>
                Create new vault
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" size="lg" onClick={() => navigate("/setup")} fullWidth>
                Create vault
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Built by <a href="https://www.sambhavdwivedi.in" target="_blank" rel="noopener noreferrer">Sambhav Dwivedi</a>
          </p>
          <p className={styles.version}>v0.1.0</p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, label, detail }) {
  return (
    <div className={styles.feature}>
      <span className={styles.featureIcon}>{icon}</span>
      <div>
        <p className={styles.featureLabel}>{label}</p>
        <p className={styles.featureDetail}>{detail}</p>
      </div>
    </div>
  );
}

function VaultIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
      stroke="var(--accent-primary)" strokeWidth="1.4" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 9V7M12 17v-2M9 12H7M17 12h-2"/>
    </svg>
  );
}

function ShieldIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function LockIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function ZeroIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinecap="round"><path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm3.5 9c0 1.93-1.57 3.5-3.5 3.5S8.5 13.93 8.5 12 10.07 8.5 12 8.5s3.5 1.57 3.5 3.5z"/></svg>;
}
function PrivateIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}