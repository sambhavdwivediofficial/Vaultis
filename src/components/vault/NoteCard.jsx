import React from "react";
import { useNavigate } from "react-router-dom";
import { cn, formatDate, stripMarkdown, truncate } from "../../utils/helpers.js";
import useNoteStore from "../../store/noteStore.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./NoteCard.module.css";

export default function NoteCard({ note, onDelete }) {
  const navigate = useNavigate();
  const del      = useNoteStore(s => s.delete);
  const update   = useNoteStore(s => s.update);
  const { success, error } = useToast();

  const preview = stripMarkdown(note.content);

  const handleDelete = async (e) => {
    e.stopPropagation();
    const res = await del(note.id);
    if (res.ok) { success("Note moved to trash"); onDelete?.(); }
    else error(res.error);
  };

  const handlePin = async (e) => {
    e.stopPropagation();
    await update({ id: note.id, isPinned: !note.is_pinned });
  };

  return (
    <article
      className={cn(styles.card, note.is_pinned && styles.pinned)}
      onClick={() => navigate(`/notes/${note.id}`)}
      style={note.color ? { "--note-accent": note.color } : undefined}
    >
      {note.color && <span className={styles.colorBar} />}

      <div className={styles.top}>
        <h3 className={styles.title}>
          {note.title || "Untitled"}
        </h3>
        <div className={styles.actions}>
          <button
            className={cn(styles.actionBtn, note.is_pinned && styles.pinActive)}
            onClick={handlePin}
            aria-label={note.is_pinned ? "Unpin" : "Pin"}
          >
            <PinIcon />
          </button>
          <button
            className={cn(styles.actionBtn, styles.deleteBtn)}
            onClick={handleDelete}
            aria-label="Delete note"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {preview && (
        <p className={styles.preview}>{truncate(preview, 120)}</p>
      )}

      <div className={styles.footer}>
        <div className={styles.tags}>
          {note.tags?.slice(0, 3).map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
          {note.tags?.length > 3 && (
            <span className={styles.tagMore}>+{note.tags.length - 3}</span>
          )}
        </div>
        <span className={styles.date}>{formatDate(note.updated_at)}</span>
      </div>
    </article>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 17v5M5 17h14M12 12V2m0 0L8 6m4-4l4 4"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    </svg>
  );
}