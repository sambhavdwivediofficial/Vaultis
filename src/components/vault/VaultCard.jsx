import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/helpers.js";
import styles from "./VaultCard.module.css";

export default function VaultCard({ label, value, sub, icon, color = "var(--accent-primary)", to, trend }) {
  const navigate = useNavigate();
  return (
    <div
      className={cn(styles.card, to && styles.clickable)}
      onClick={to ? () => navigate(to) : undefined}
      style={{ "--vc-color": color }}
    >
      <div className={styles.iconWrap}>
        {icon}
      </div>
      <div className={styles.body}>
        <span className={styles.value}>{value ?? "—"}</span>
        <span className={styles.label}>{label}</span>
        {sub && <span className={styles.sub}>{sub}</span>}
      </div>
      {trend !== undefined && (
        <div className={cn(styles.trend, trend >= 0 ? styles.up : styles.down)}>
          {trend >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
      <span className={styles.glow} />
    </div>
  );
}

function TrendUpIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}
function TrendDownIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>;
}