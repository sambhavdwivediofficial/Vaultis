import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import ContentArea from "../../components/layout/ContentArea.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import VaultCard from "../../components/vault/VaultCard.jsx";
import Button from "../../components/ui/Button.jsx";
import { SkeletonCard } from "../../components/ui/Loader.jsx";
import useNoteStore from "../../store/noteStore.js";
import usePasswordStore from "../../store/passwordStore.js";
import useFileStore from "../../store/fileStore.js";
import { isSmallScreen } from "../../utils/helpers.js";
import styles from "./Dashboard.module.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notesLoading = useNoteStore(s => s.isLoading);
  const notesList    = useNoteStore(s => s.notes);
  const fetchNotes   = useNoteStore(s => s.fetch);

  const passwordsLoading = usePasswordStore(s => s.isLoading);
  const passwordsList    = usePasswordStore(s => s.passwords);
  const fetchPasswords   = usePasswordStore(s => s.fetch);

  const filesLoading = useFileStore(s => s.isLoading);
  const filesList    = useFileStore(s => s.files);
  const fetchFiles   = useFileStore(s => s.fetch);

  useEffect(() => {
    fetchNotes();
    fetchPasswords();
    fetchFiles();
  }, [fetchNotes, fetchPasswords, fetchFiles]);

  const isLoading = notesLoading || passwordsLoading || filesLoading;

  const stats = [
    {
      label: "Notes",
      value: notesList.length,
      sub: "encrypted entries",
      icon: <NotesIcon />,
      color: "#0095ff",
      to: "/notes",
    },
    {
      label: "Passwords",
      value: passwordsList.length,
      sub: "saved accounts",
      icon: <KeyIcon />,
      color: "#00d4a0",
      to: "/passwords",
    },
    {
      label: "Files",
      value: filesList.length,
      sub: "encrypted files",
      icon: <FilesIcon />,
      color: "#8b5cf6",
      to: "/files",
    },
  ];

  const recentNotes = notesList.slice(0, 3);
  const recentPasswords = passwordsList.slice(0, 3);

  return (
    <div className={styles.wrapper}>
      {isSmallScreen() && (
        <Navbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <div className={styles.main}>
        <Header title="Dashboard" />
        
        <ContentArea>
          {/* ── Stats cards ──────────────────────────────────────────── */}
          <section className={styles.statsSection}>
            <div className={styles.statsGrid}>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <SkeletonCard key={i} lines={3} />)
              ) : (
                stats.map(stat => (
                  <VaultCard
                    key={stat.label}
                    {...stat}
                    trend={Math.floor(Math.random() * 20) - 5}
                  />
                ))
              )}
            </div>
          </section>

          {/* ── Recent items ─────────────────────────────────────────── */}
          <section className={styles.recentSection}>
            {/* Recent notes */}
            <div className={styles.recentCard}>
              <div className={styles.recentHeader}>
                <h3 className={styles.recentTitle}>Recent Notes</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate("/notes")}>
                  View all
                </Button>
              </div>
              <div className={styles.recentList}>
                {recentNotes.length === 0 ? (
                  <EmptyState icon={<NotesIcon />} text="No notes yet" action={() => navigate("/notes/new")} />
                ) : (
                  recentNotes.map(note => (
                    <div key={note.id} className={styles.recentItem} onClick={() => navigate(`/notes/${note.id}`)}>
                      <div className={styles.itemIcon} style={{ color: note.color || "#0095ff" }}>
                        <NotesIcon />
                      </div>
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{note.title || "Untitled"}</p>
                        <p className={styles.itemMeta}>{new Date(note.updated_at).toLocaleDateString()}</p>
                      </div>
                      <ChevronIcon />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent passwords */}
            <div className={styles.recentCard}>
              <div className={styles.recentHeader}>
                <h3 className={styles.recentTitle}>Recent Passwords</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate("/passwords")}>
                  View all
                </Button>
              </div>
              <div className={styles.recentList}>
                {recentPasswords.length === 0 ? (
                  <EmptyState icon={<KeyIcon />} text="No passwords saved" action={() => navigate("/passwords")} />
                ) : (
                  recentPasswords.map(pwd => (
                    <div key={pwd.id} className={styles.recentItem} onClick={() => navigate(`/passwords/${pwd.id}`)}>
                      <div className={styles.itemIcon} style={{ background: "var(--glass-bg-active)" }}>
                        <KeyIcon />
                      </div>
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{pwd.name}</p>
                        <p className={styles.itemMeta}>{pwd.username || "No username"}</p>
                      </div>
                      <ChevronIcon />
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* ── Quick actions ────────────────────────────────────────── */}
          <section className={styles.actionsSection}>
            <h3 className={styles.actionsTitle}>Quick Actions</h3>
            <div className={styles.actionsGrid}>
              <Button variant="outline" icon={<PlusIcon />} onClick={() => navigate("/notes/new")} fullWidth>
                New note
              </Button>
              <Button variant="outline" icon={<PlusIcon />} onClick={() => navigate("/passwords")} fullWidth>
                Add password
              </Button>
              <Button variant="outline" icon={<UploadIcon />} onClick={() => navigate("/files")} fullWidth>
                Upload file
              </Button>
            </div>
          </section>
        </ContentArea>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, action }) {
  return (
    <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-tertiary)" }}>
      <div style={{ marginBottom: "var(--space-3)" }}>{icon}</div>
      <p style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-2)" }}>{text}</p>
      <Button variant="ghost" size="sm" onClick={action}>Create one now</Button>
    </div>
  );
}

function NotesIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function KeyIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>; }
function FilesIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
function ChevronIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>; }
function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function UploadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
