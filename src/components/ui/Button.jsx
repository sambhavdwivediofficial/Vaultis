import React from "react";
import { cn } from "../../utils/helpers.js";
import styles from "./Button.module.css";

const VARIANTS = {
  primary:   styles.primary,
  secondary: styles.secondary,
  ghost:     styles.ghost,
  danger:    styles.danger,
  outline:   styles.outline,
  link:      styles.link,
};

const SIZES = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className,
  onClick,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        styles.btn,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && styles.fullWidth,
        loading   && styles.loading,
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className={styles.spinnerWrap}>
          <Spinner size={size} />
        </span>
      ) : icon ? (
        <span className={styles.iconLeft}>{icon}</span>
      ) : null}
      {children && <span className={styles.label}>{children}</span>}
      {iconRight && !loading && (
        <span className={styles.iconRight}>{iconRight}</span>
      )}
    </button>
  );
}

function Spinner({ size }) {
  const sz = size === "xs" || size === "sm" ? 12 : 14;
  return (
    <svg
      width={sz} height={sz}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      className="spin"
    >
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  );
}