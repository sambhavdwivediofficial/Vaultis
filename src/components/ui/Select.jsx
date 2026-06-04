import React from "react";
import { cn } from "../../utils/helpers.js";
import styles from "./Select.module.css";

export default function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder,
  error,
  hint,
  size = "md",
  className,
  containerClass,
  disabled,
  ...props
}) {
  return (
    <div className={cn(styles.wrapper, containerClass)}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={cn(styles.selectWrap, styles[size], error && styles.hasError, disabled && styles.disabled)}>
        <select
          className={cn(styles.select, className)}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron}>
          <ChevronIcon />
        </span>
      </div>
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}