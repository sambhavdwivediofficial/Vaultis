import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import ContentArea from "../../components/layout/ContentArea.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import PasswordCard from "../../components/vault/PasswordCard.jsx";
import PasswordEditor from "./PasswordEditor.jsx";
import PasswordGenerator from "./PasswordGenerator.jsx";
import Button from "../../components/ui/Button.jsx";
import Dialog from "../../components/ui/Dialog.jsx";
import { SkeletonCard } from "../../components/ui/Loader.jsx";
import usePasswordStore from "../../store/passwordStore.js";
import { useSearch } from "../../hooks/useSearch.js";
import { isSmallScreen } from "../../utils/helpers.js";
import styles from "./Passwords.module.css";

export default function PasswordVault() {
  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [editingId,        setEditingId]          = useState(null);
  const [showGenerator,    setShowGenerator]      = useState(false);
  const [filterFav,        setFilterFav]          = useState(false);
  const [generatedForField, setGeneratedForField] = useState(null);

  const passwords  = usePasswordStore(s => s.passwords);
  const isLoading  = usePasswordStore(s => s.isLoading);
  const fetch_     = usePasswordStore(s => s.fetch);

  const { query, setQuery, results } = useSearch(
    async q => usePasswordStore.getState().search(q),
    300
  );

  useEffect(() => { fetch_(); }, [fetch_]);

  let displayPasswords = query ? results : passwords;
  if (filterFav) displayPasswords = displayPasswords.filter(p => p.is_favorite && !p.deleted_at);
  displayPasswords = displayPasswords.filter(p => !p.deleted_at);

  if (editingId !== null) {
    return (
      <PasswordEditor
        entryId={editingId === "new" ? null : editingId}
        onClose={() => setEditingId(null)}
        onSaved={() => { fetch_(); setEditingId(null); }}
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      {isSmallScreen() && <Navbar onMenuToggle={() => {}} />}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <div className={styles.main}>
        <Header
          title="Passwords"
          showSearch={true}
          onSearch={setQuery}
          actions={
            <div className={styles.headerActions}>
              <Button
                variant={filterFav ? "primary" : "ghost"}
                size="sm"
                icon={<StarIcon filled={filterFav} />}
                onClick={() => setFilterFav(v => !v)}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<WandIcon />}
                onClick={() => setShowGenerator(true)}
              >
                Generator
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<PlusIcon />}
                onClick={() => setEditingId("new")}
              >
                Add
              </Button>
            </div>
          }
        />

        <ContentArea>
          {isLoading ? (
            <div className={styles.list}>
              {Array(6).fill(0).map((_, i) => (
                <SkeletonCard key={i} lines={3} />
              ))}
            </div>
          ) : displayPasswords.length === 0 ? (
            <EmptyState query={query} filterFav={filterFav} onAdd={() => setEditingId("new")} />
          ) : (
            <div className={styles.list}>
              {displayPasswords.map(entry => (
                <PasswordCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => setEditingId(entry.id)}
                />
              ))}
            </div>
          )}
        </ContentArea>
      </div>

      {/* Generator Dialog */}
      <Dialog
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        title="Password Generator"
        description="Create a strong, random password"
        size="sm"
      >
        <PasswordGenerator
          onUse={(pwd) => {
            setShowGenerator(false);
            setEditingId("new");
          }}
        />
      </Dialog>
    </div>
  );
}

function EmptyState({ query, filterFav, onAdd }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}><KeyIcon /></div>
      <p className={styles.emptyTitle}>
        {query ? "No passwords found" : filterFav ? "No favorites yet" : "No passwords saved yet"}
      </p>
      <p className={styles.emptyHint}>
        {!query && !filterFav && "Save your first password — stored with AES-256 encryption"}
      </p>
      {!query && !filterFav && (
        <Button variant="primary" size="sm" onClick={onAdd}>
          Save your first password
        </Button>
      )}
    </div>
  );
}

function PlusIcon()          { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function WandIcon()          { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 4V2M15 16v-2M8 9H2M20 9h-2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"/></svg>; }
function KeyIcon()           { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.6" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>; }
function StarIcon({ filled }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "var(--accent-warning)" : "none"} stroke={filled ? "var(--accent-warning)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
