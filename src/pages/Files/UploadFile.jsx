import React, { useState, useRef } from "react";
import Button from "../../components/ui/Button.jsx";
import { useToast } from "../../hooks/useToast.js";
import useFileStore from "../../store/fileStore.js";
import { formatBytes } from "../../utils/helpers.js";
import styles from "./UploadFile.module.css";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export default function UploadFile({ onSuccess, onCancel }) {
  const { success, error: showError } = useToast();
  const upload = useFileStore(s => s.upload);
  const isUploading = useFileStore(s => s.isUploading);

  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  };

  const validateAndSet = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      showError(`File too large. Maximum: ${formatBytes(MAX_FILE_SIZE)}`);
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t]);
      setTagInput("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      // Note: In Tauri, we use the file path, not the File object
      // This will be wired via dialog plugin for path selection
      const result = await upload(selectedFile.name, tags, null);
      if (result.ok) {
        success("File uploaded and encrypted");
        onSuccess?.();
      } else {
        showError(result.error || "Upload failed");
      }
    } catch (e) {
      showError(e.message || "Upload failed");
    }
    setUploading(false);
  };

  return (
    <div className={styles.uploadWrap}>
      {/* Drop zone */}
      <div
        className={`${styles.dropZone} ${dragActive ? styles.dragOver : ""} ${selectedFile ? styles.hasFile : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className={styles.hidden}
          onChange={handleFileChange}
        />

        {selectedFile ? (
          <div className={styles.selectedFile}>
            <span className={styles.fileName}>{selectedFile.name}</span>
            <span className={styles.fileSize}>{formatBytes(selectedFile.size)}</span>
            <button
              className={styles.clearBtn}
              onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
            >
              <XIcon />
            </button>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <UploadIcon />
            <p className={styles.dropText}>
              {dragActive ? "Drop file here" : "Drag file here or click to browse"}
            </p>
            <p className={styles.dropHint}>Max {formatBytes(MAX_FILE_SIZE)}</p>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className={styles.tagsSection}>
        <label className={styles.label}>Tags (optional)</label>
        <div className={styles.tagRow}>
          <input
            className={styles.tagInput}
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddTag()}
            placeholder="Add tag..."
          />
          <Button variant="secondary" size="sm" onClick={handleAddTag}>Add</Button>
        </div>
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map(tag => (
              <span key={tag} className={styles.tag}>
                {tag}
                <button onClick={() => setTags(t => t.filter(x => x !== tag))} className={styles.removeTag}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={onCancel} fullWidth>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleUpload}
          loading={uploading}
          disabled={!selectedFile}
          fullWidth
        >
          Encrypt & upload
        </Button>
      </div>
    </div>
  );
}

function UploadIcon() { return <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.4" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>; }
function XIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
