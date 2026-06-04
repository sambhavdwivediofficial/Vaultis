import React, { useEffect, useState } from "react";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Dialog from "../../components/ui/Dialog.jsx";
import Card from "../../components/ui/Card.jsx";
import { useToast } from "../../hooks/useToast.js";
import useNoteStore from "../../store/noteStore.js";
import { NOTE_COLORS } from "../../utils/constants.js";
import styles from "./NoteEditor.module.css";

export default function NoteEditor({ noteId, onClose }) {
  const { success, error: showError } = useToast();
  const fetchOne = useNoteStore(s => s.fetchOne);
  const create = useNoteStore(s => s.create);
  const update = useNoteStore(s => s.update);
  const delete_ = useNoteStore(s => s.delete);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [color, setColor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (noteId) {
      fetchOne(noteId).then(note => {
        if (note) {
          setTitle(note.title);
          setContent(note.content);
          setTags(note.tags || []);
          setColor(note.color);
        }
      });
    }
  }, [noteId, fetchOne]);

  const handleSave = async () => {
    if (!title.trim()) { showError("Title is required"); return; }
    setLoading(true);
    
    const data = { title: title.trim(), content, tags, color };
    const result = noteId
      ? await update({ id: noteId, ...data })
      : await create(data);
    
    setLoading(false);
    if (result.ok) {
      success(noteId ? "Note updated" : "Note created");
      setTimeout(onClose, 800);
    } else {
      showError(result.error);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const result = await delete_(noteId);
    setLoading(false);
    if (result.ok) {
      success("Note deleted");
      setTimeout(onClose, 800);
    } else {
      showError(result.error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Button
            variant="ghost"
            size="sm"
            icon={<BackIcon />}
            onClick={onClose}
          >
            Back
          </Button>
          <span className={styles.title}>
            {noteId ? "Edit note" : "New note"}
          </span>
        </div>
        <div className={styles.headerActions}>
          {noteId && (
            <Button
              variant="ghost"
              size="sm"
              icon={<TrashIcon />}
              onClick={() => setShowDeleteConfirm(true)}
            />
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={loading}
          >
            Save
          </Button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.form}>
          <Input
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note title"
            required
          />

          <div className={styles.tagsSection}>
            <label className={styles.label}>Tags</label>
            <div className={styles.tagInput}>
              <input
                type="text"
                className={styles.input}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyDown={e => e.key === "Enter" && handleAddTag()}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddTag}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className={styles.tags}>
                {tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className={styles.removeTag}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.colorSection}>
            <label className={styles.label}>Color</label>
            <button className={styles.colorBtn} onClick={() => setShowColorPicker(!showColorPicker)}>
              <span className={styles.colorSwatch} style={{ background: color || "var(--text-tertiary)" }} />
              {color ? "Change color" : "Pick color"}
            </button>
            {showColorPicker && (
              <div className={styles.colorPalette}>
                <button
                  className={styles.colorOption}
                  onClick={() => { setColor(null); setShowColorPicker(false); }}
                  style={{ border: color === null ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)" }}
                >
                  Default
                </button>
                {NOTE_COLORS.filter(c => c.value).map(c => (
                  <button
                    key={c.value}
                    className={styles.colorOption}
                    style={{
                      background: c.value,
                      border: color === c.value ? `2px solid ${c.value}` : "1px solid var(--border-subtle)"
                    }}
                    onClick={() => { setColor(c.value); setShowColorPicker(false); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <textarea
          className={styles.editor}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write your note... Markdown supported"
        />
      </div>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete note?"
        size="sm"
      >
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
          This action cannot be undone. The note will be permanently deleted from your vault.
        </p>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)} fullWidth>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={loading} fullWidth>Delete</Button>
        </div>
      </Dialog>
    </div>
  );
}

function BackIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>; }
