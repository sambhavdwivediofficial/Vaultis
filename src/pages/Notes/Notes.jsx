import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import ContentArea from "../../components/layout/ContentArea.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import NoteCard from "../../components/vault/NoteCard.jsx";
import NoteEditor from "./NoteEditor.jsx";
import Button from "../../components/ui/Button.jsx";
import { SkeletonCard } from "../../components/ui/Loader.jsx";
import useNoteStore from "../../store/noteStore.js";
import { useSearch } from "../../hooks/useSearch.js";
import { isSmallScreen } from "../../utils/helpers.js";
import styles from "./Notes.module.css";

export default function NotesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const notes = useNoteStore(s => s.notes);
  const activeNote = useNoteStore(s => s.activeNote);
  const isLoading = useNoteStore(s => s.isLoading);
  const fetchNotes = useNoteStore(s => s.fetch);
  const fetchOne = useNoteStore(s => s.fetchOne);
  const setActive = useNoteStore(s => s.setActive);
  const clearActive = useNoteStore(s => s.clearActive);

  const { query, setQuery, results, loading: searching } = useSearch(
    async q => useNoteStore.getState().search(q),
    300
  );

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (id && id !== "new") {
      fetchOne(id).then(note => note && setActive(note));
    } else {
      clearActive();
    }
  }, [id, fetchOne, setActive, clearActive]);

  const displayNotes = query ? results : notes;
  const isEditMode = id && id !== "new";
  const isNewMode = id === "new";

  return (
    <div className={styles.wrapper}>
      {isSmallScreen() && (
        <Navbar onMenuToggle={() => {}} />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <div className={styles.main}>
        <Header
          title="Notes"
          showSearch={true}
          onSearch={setQuery}
          actions={
            <Button
              variant="primary"
              size="sm"
              icon={<PlusIcon />}
              onClick={() => navigate("/notes/new")}
            >
              New note
            </Button>
          }
        />

        <ContentArea>
          {isEditMode || isNewMode ? (
            <NoteEditor noteId={id === "new" ? null : id} onClose={() => navigate("/notes")} />
          ) : (
            <div className={styles.listView}>
              {isLoading ? (
                <div className={styles.grid}>
                  {Array(6).fill(0).map((_, i) => (
                    <SkeletonCard key={i} lines={4} />
                  ))}
                </div>
              ) : displayNotes.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><NotesIcon /></div>
                  <p className={styles.emptyText}>
                    {query ? "No notes found" : "No notes yet"}
                  </p>
                  {!query && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate("/notes/new")}
                    >
                      Create your first note
                    </Button>
                  )}
                </div>
              ) : (
                <div className={styles.grid}>
                  {displayNotes.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onDelete={() => fetchNotes()}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </ContentArea>
      </div>
    </div>
  );
}

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function NotesIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.6" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}