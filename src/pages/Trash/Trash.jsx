import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import ContentArea from "../../components/layout/ContentArea.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Dialog, { DialogFooter } from "../../components/ui/Dialog.jsx";
import { SkeletonCard } from "../../components/ui/Loader.jsx";
import { useToast } from "../../hooks/useToast.js";
import { tauriNotes, tauriPasswords, tauriFiles } from "../../services/tauriBridge.js";
import { formatDate, truncate, isSmallScreen } from "../../utils/helpers.js";
import styles from "./Trash.module.css";

const FILTER_OPTIONS = [
  { label: "All",       value: "all" },
  { label: "Notes",     value: "notes" },
  { label: "Passwords", value: "passwords" },
  { label: "Files",     value: "files" },
];

export default function TrashPage() {
  const { success, error: showError } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [deletedNotes, setDeletedNotes] = useState([]);
  const [deletedPasswords, setDeletedPasswords] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [showEmptyDialog, setShowEmptyDialog] = useState(false);
  const [emptying, setEmptying] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [notes, passwords, files] = await Promise.all([
        tauriNotes.listTrashed().catch(() => []),
        tauriPasswords.listTrashed().catch(() => []),
        tauriFiles.listTrashed().catch(() => []),
      ]);
      setDeletedNotes(notes);
      setDeletedPasswords(passwords);
      setDeletedFiles(files);
    } catch (e) {
      showError("Failed to load trash");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleRestoreNote = async (id) => {
    try {
      await tauriNotes.restore(id);
      success("Note restored");
      fetchAll();
    } catch (e) {
      showError("Restore failed");
    }
  };

  const handleRestorePassword = async (id) => {
    try {
      await tauriPasswords.restore(id);
      success("Password restored");
      fetchAll();
    } catch (e) {
      showError("Restore failed");
    }
  };

  const handleRestoreFile = async (id) => {
    try {
      await tauriFiles.restore(id);
      success("File restored");
      fetchAll();
    } catch (e) {
      showError("Restore failed");
    }
  };

  const handleEmptyTrash = async () => {
    setEmptying(true);
    try {
      await Promise.all([
        ...deletedNotes.map(n => tauriNotes.delete(n.id)),
        ...deletedPasswords.map(p => tauriPasswords.delete(p.id)),
        ...deletedFiles.map(f => tauriFiles.delete(f.id)),
      ]);
      success("Trash emptied");
      setShowEmptyDialog(false);
      fetchAll();
    } catch (e) {
      showError("Failed to empty trash");
    }
    setEmptying(false);
  };

  const allItems = [
    ...deletedNotes.map(n => ({ ...n, _type: "note" })),
    ...deletedPasswords.map(p => ({ ...p, _type: "password" })),
    ...deletedFiles.map(f => ({ ...f, _type: "file" })),
  ];

  const filtered = allItems.filter(item => {
    if (filter === "all") return true;
    if (filter === "notes") return item._type === "note";
    if (filter === "passwords") return item._type === "password";
    if (filter === "files") return item._type === "file";
    return true;
  });

  const totalCount = allItems.length;

  const handleRestore = (item) => {
    if (item._type === "note") handleRestoreNote(item.id);
    if (item._type === "password") handleRestorePassword(item.id);
    if (item._type === "file") handleRestoreFile(item.id);
  };

  return (
    <div className={styles.wrapper}>
      {isSmallScreen() && <Navbar onMenuToggle={() => {}} />}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />

      <div className={styles.main}>
        <Header
          title="Trash"
          actions={
            totalCount > 0 && (
              <Button
                variant="danger"
                size="sm"
                icon={<TrashIcon />}
                onClick={() => setShowEmptyDialog(true)}
              >
                Empty trash
              </Button>
            )
          }
        />

        <ContentArea>
          <div className={styles.container}>
            <div className={styles.filters}>
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.filterBtn} ${filter === opt.value ? styles.active : ""}`}
                  onClick={() => setFilter(opt.value)}
                >
                  {opt.label}
                  {opt.value !== "all" && (
                    <span className={styles.filterCount}>
                      {opt.value === "notes" ? deletedNotes.length
                        : opt.value === "passwords" ? deletedPasswords.length
                        : deletedFiles.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className={styles.list}>
                {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} lines={2} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><TrashEmptyIcon /></div>
                <p className={styles.emptyText}>
                  {filter === "all" ? "Trash is empty" : `No deleted ${filter}`}
                </p>
              </div>
            ) : (
              <div className={styles.list}>
                {filtered.map((item) => (
                  <Card key={`${item._type}-${item.id}`} padding="md">
                    <div className={styles.itemRow}>
                      <div className={styles.itemTypeIcon}>
                        {item._type === "note"     ? <NoteIcon />     : null}
                        {item._type === "password" ? <KeyIcon />      : null}
                        {item._type === "file"     ? <FileIcon />     : null}
                      </div>
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>
                          {truncate(item.title || item.name, 60)}
                        </p>
                        <div className={styles.itemMeta}>
                          <span className={styles.itemType}>{item._type}</span>
                          <span className={styles.dot}>·</span>
                          <span className={styles.itemDate}>
                            deleted {formatDate(item.trashed_at)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<RestoreIcon />}
                        onClick={() => handleRestore(item)}
                      >
                        Restore
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ContentArea>
      </div>

      <Dialog
        open={showEmptyDialog}
        onClose={() => setShowEmptyDialog(false)}
        title="Empty Trash?"
        size="sm"
      >
        <div className={styles.emptyDialogBody}>
          <div className={styles.emptyDialogIcon}><WarnIcon /></div>
          <p>
            This will permanently delete <strong>{totalCount}</strong> item{totalCount !== 1 ? "s" : ""}.
            This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setShowEmptyDialog(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleEmptyTrash} loading={emptying}>
            Empty trash
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function TrashIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>; }
function TrashEmptyIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.6" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>; }
function NoteIcon()       { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function KeyIcon()        { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>; }
function FileIcon()       { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>; }
function RestoreIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>; }
function WarnIcon()       { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
