import React, { useEffect, useRef } from "react";
import { cn } from "../../utils/helpers.js";
import styles from "./Dialog.module.css";

export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size    = "md",
  hideClose = false,
  className,
}) {
  const overlayRef = useRef(null);
  const panelRef   = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else       document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Focus first focusable element
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const focusable = panelRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    setTimeout(() => focusable?.focus(), 80);
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        className={cn(styles.panel, styles[size], className)}
        style={{ animation: "slide-up-modal var(--duration-slow) var(--ease-spring) both" }}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className={styles.header}>
            <div>
              {title && <h2 className={styles.title}>{title}</h2>}
              {description && <p className={styles.description}>{description}</p>}
            </div>
            {!hideClose && (
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close dialog"
              >
                <XIcon />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

export function DialogFooter({ children, align = "right" }) {
  return (
    <div
      className={styles.footer}
      style={{ justifyContent: align === "right" ? "flex-end" : align === "between" ? "space-between" : "flex-start" }}
    >
      {children}
    </div>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}