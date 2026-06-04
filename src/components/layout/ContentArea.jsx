import React from "react";
import { cn } from "../../utils/helpers.js";
import styles from "./ContentArea.module.css";

export default function ContentArea({ children, className, noPadding = false }) {
  return (
    <main className={cn(styles.content, noPadding && styles.noPadding, className)}>
      {children}
    </main>
  );
}