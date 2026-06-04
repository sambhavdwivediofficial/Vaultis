import React from "react";
import { cn } from "../../utils/helpers.js";
import styles from "./Card.module.css";

export default function Card({
  children,
  className,
  onClick,
  active    = false,
  hoverable = false,
  accent,
  padding   = "md",
  ...props
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className={cn(
        styles.card,
        hoverable && styles.hoverable,
        active    && styles.active,
        onClick   && styles.clickable,
        styles[`pad-${padding}`],
        className
      )}
      onClick={onClick}
      style={accent ? { "--card-accent": accent } : undefined}
      {...props}
    >
      {accent && <span className={styles.accentBar} />}
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn(styles.header, className)}>{children}</div>;
}

export function CardBody({ children, className }) {
  return <div className={cn(styles.body, className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return <div className={cn(styles.footer, className)}>{children}</div>;
}