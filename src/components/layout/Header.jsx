import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore.js";
import styles from "./Header.module.css";

export default function Header({ title, actions, showSearch, onSearch }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const vaultInfo = useAuthStore(s => s.vaultInfo);

  const handleSearchToggle = () => {
    setSearchOpen(v => {
      if (!v) setTimeout(() => inputRef.current?.focus(), 50);
      return !v;
    });
    if (searchOpen) { setQuery(""); onSearch?.(""); }
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        {showSearch && (
          <div className={`${styles.searchWrap} ${searchOpen ? styles.searchOpen : ""}`}>
            {searchOpen && (
              <input
                ref={inputRef}
                className={styles.searchInput}
                value={query}
                onChange={handleChange}
                placeholder="Search..."
                onKeyDown={e => { if (e.key === "Escape") handleSearchToggle(); }}
              />
            )}
            <button className={styles.iconBtn} onClick={handleSearchToggle} aria-label="Search">
              {searchOpen ? <XIcon /> : <SearchIcon />}
            </button>
          </div>
        )}
        {actions}
      </div>
    </header>
  );
}

function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function XIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}