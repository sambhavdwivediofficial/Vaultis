import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { SkeletonCard } from "../../components/ui/Loader.jsx";
import { useToast } from "../../hooks/useToast.js";
import useNoteStore from "../../store/noteStore.js";
import { formatDate } from "../../utils/helpers.js";
import styles from "./NoteViewer.module.css";

export default function NoteViewer({ noteId }) {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const fetchOne = useNoteStore(s => s.fetchOne);
  const activeNote = useNoteStore(s => s.activeNote);
  const isLoading = useNoteStore(s => s.isLoading);
  const update = useNoteStore(s => s.update);
  const del = useNoteStore(s => s.delete);

  useEffect(() => {
    if (noteId) fetchOne(noteId);
  }, [noteId, fetchOne]);

  const handlePin = async () => {
    if (!activeNote) return;
    await update({ id: activeNote.id, isPinned: !activeNote.is_pinned });
    success(activeNote.is_pinned ? "Unpinned" : "Pinned");
  };

  const handleDelete = async () => {
    if (!activeNote) return;
    const res = await del(activeNote.id);
    if (res.ok) {
      success("Note moved to trash");
      navigate("/notes");
    } else {
      showError(res.error);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <SkeletonCard lines={6} />
      </div>
    );
  }

  if (!activeNote) {
    return (
      <div className={styles.empty}>
        <p>Note not found</p>
        <Button variant="ghost" size="sm" onClick={() => navigate("/notes")}>
          Back to notes
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.viewer}>
      <div className={styles.toolbar}>
        <Button variant="ghost" size="sm" icon={<BackIcon />} onClick={() => navigate("/notes")}>
          Back
        </Button>
        <div className={styles.toolbarRight}>
          <Button
            variant="ghost"
            size="sm"
            icon={<PinIcon />}
            onClick={handlePin}
            className={activeNote.is_pinned ? styles.pinActive : ""}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<EditIcon />}
            onClick={() => navigate(`/notes/${noteId}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<TrashIcon />}
            onClick={handleDelete}
            className={styles.deleteBtn}
          />
        </div>
      </div>

      <div className={styles.content}>
        {activeNote.color && (
          <div className={styles.colorBar} style={{ background: activeNote.color }} />
        )}

        <h1 className={styles.title}>
          {activeNote.title || "Untitled"}
        </h1>

        <div className={styles.meta}>
          <span>Updated {formatDate(activeNote.updated_at)}</span>
          {activeNote.tags?.length > 0 && (
            <div className={styles.tags}>
              {activeNote.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.body}>
          {activeNote.content
            ? renderMarkdown(activeNote.content)
            : <p className={styles.noContent}>No content</p>
          }
        </div>
      </div>
    </div>
  );
}

function renderMarkdown(content) {
  // Simple markdown-like rendering
  const lines = content.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("# "))   return <h2 key={i} style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)", margin: "var(--space-5) 0 var(--space-3)", letterSpacing: "-0.03em" }}>{line.slice(2)}</h2>;
    if (line.startsWith("## "))  return <h3 key={i} style={{ fontSize: "var(--text-xl)",  fontWeight: 700, color: "var(--text-primary)", margin: "var(--space-4) 0 var(--space-2)", letterSpacing: "-0.02em" }}>{line.slice(3)}</h3>;
    if (line.startsWith("### ")) return <h4 key={i} style={{ fontSize: "var(--text-lg)",  fontWeight: 600, color: "var(--text-primary)", margin: "var(--space-3) 0 var(--space-2)" }}>{line.slice(4)}</h4>;
    if (line.startsWith("- "))   return <li  key={i} style={{ color: "var(--text-secondary)", margin: "var(--space-1) 0", paddingLeft: "var(--space-2)", listStyle: "disc inside" }}>{line.slice(2)}</li>;
    if (line.trim() === "---")   return <hr  key={i} style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "var(--space-5) 0" }} />;
    if (line === "")             return <br  key={i} />;
    return <p key={i} style={{ color: "var(--text-secondary)", lineHeight: 1.7, margin: "var(--space-1) 0" }}>{line}</p>;
  });
}

function BackIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>; }
function EditIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function PinIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 17v5M5 17h14M12 12V2m0 0L8 6m4-4l4 4"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>; }
