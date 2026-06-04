import React, { useState } from "react";
import { cn } from "../../utils/helpers.js";
import styles from "./Tooltip.module.css";

export default function Tooltip({
  children,
  content,
  position = "top",
  delay    = 500,
  className,
}) {
  const [visible, setVisible] = useState(false);
  const [timer,   setTimer]   = useState(null);

  if (!content) return children;

  const show = () => setTimer(setTimeout(() => setVisible(true), delay));
  const hide = () => { clearTimeout(timer); setVisible(false); };

  return (
    <div
      className={cn(styles.wrapper, className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div className={cn(styles.tooltip, styles[position])}>
          <span className={styles.content}>{content}</span>
          <span className={cn(styles.arrow, styles[`arrow-${position}`])} />
        </div>
      )}
    </div>
  );
}