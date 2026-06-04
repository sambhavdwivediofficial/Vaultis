import React from "react";
import { cn } from "../../utils/helpers.js";
import styles from "./Loader.module.css";

export function Spinner({ size = "md", color, className }) {
  const sz = { xs: 12, sm: 16, md: 20, lg: 28, xl: 40 }[size] ?? 20;
  return (
    <svg
      width={sz}
      height={sz}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth="2.2"
      strokeLinecap="round"
      className={cn("spin", className)}
      style={{ color: color || "var(--accent-primary)" }}
    >
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  );
}

export function PremiumSpinner({ size = "md", className }) {
  const sz = { sm: 100, md: 140, lg: 180, xl: 240 }[size] ?? 140;
  
  return (
    <div 
      className={cn(styles.premiumSpinner, className)} 
      style={{ width: sz, height: sz }}
    >
      <div className={styles.spinnerInner}>
        <div className={styles.orbitRing1}>
          <div className={styles.orbitDot1} />
        </div>
        <div className={styles.orbitRing2}>
          <div className={styles.orbitDot2} />
        </div>
        <div className={styles.orbitRing3}>
          <div className={styles.orbitDot3} />
        </div>
        <div className={styles.coreRing1} />
        <div className={styles.coreRing2} />
        <div className={styles.coreRing3} />
        <div className={styles.centerVault}>
          <VaultSVG />
        </div>
      </div>
    </div>
  );
}

export function GridLoader({ className }) {
  return (
    <div className={cn(styles.gridLoader, className)}>
      <div className={styles.gridCell} />
      <div className={styles.gridCell} />
      <div className={styles.gridCell} />
      <div className={styles.gridCell} />
      <div className={styles.gridCell} />
      <div className={styles.gridCell} />
      <div className={styles.gridCell} />
      <div className={styles.gridCell} />
      <div className={styles.gridCell} />
    </div>
  );
}

export function LiquidLoader({ className }) {
  return (
    <div className={cn(styles.liquidLoader, className)}>
      <div className={styles.liquidBlob1} />
      <div className={styles.liquidBlob2} />
      <div className={styles.liquidBlob3} />
      <div className={styles.liquidCore} />
    </div>
  );
}

export function FullscreenLoader({ message = "Loading...", variant = "premium" }) {
  return (
    <div className={styles.fullscreen}>
      <div className={styles.loaderBox}>
        {variant === "premium" && <PremiumSpinner size="lg" />}
        {variant === "grid" && <GridLoader />}
        {variant === "liquid" && <LiquidLoader />}
        
        <div className={styles.textBlock}>
          <p className={styles.message}>{message}</p>
          <div className={styles.typingDots}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonLine({ width = "100%", height = 14, className }) {
  return (
    <span
      className={cn(styles.skeleton, "shimmer", className)}
      style={{ width, height, borderRadius: 6, display: "block" }}
    />
  );
}

export function SkeletonCard({ lines = 3, className }) {
  return (
    <div className={cn(styles.skeletonCard, className)}>
      <SkeletonLine width="60%" height={16} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 2 ? "40%" : "90%"} height={12} />
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className={styles.pageLoader}>
      <PremiumSpinner size="md" />
    </div>
  );
}

function VaultSVG() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="var(--accent-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4"/>
      <circle cx="12" cy="12" r="2.5"/>
      <path d="M12 8.5V7M12 17v-1.5M8.5 12H7M17 12h-1.5"/>
    </svg>
  );
}