import React, { useState } from "react";
import Button from "../../components/ui/Button.jsx";
import { useToast } from "../../hooks/useToast.js";
import { formatBytes, formatDate } from "../../utils/helpers.js";
import styles from "./FileViewer.module.css";

export default function FileViewer({ file, onClose }) {
  const { success, error: showError } = useToast();
  const [downloading, setDownloading] = useState(false);

  const isImage = file.mime_type?.startsWith("image/");
  const isPdf = file.mime_type === "application/pdf";
  const canPreview = isImage || isPdf;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // TODO: Implement file export from Tauri
      success("File downloaded");
    } catch (e) {
      showError("Download failed");
    }
    setDownloading(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.name);
      success("Filename copied");
    } catch {
      showError("Copy failed");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.info}>
          <span className={styles.mimeType}>{file.mime_type}</span>
          <h2 className={styles.name}>{file.name}</h2>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          <XIcon />
        </button>
      </div>

      {canPreview ? (
        <div className={styles.preview}>
          {isImage && <img src={file.preview_url} alt={file.name} />}
          {isPdf && <embed src={file.preview_url} type="application/pdf" />}
        </div>
      ) : (
        <div className={styles.noPreview}>
          <FileIcon />
          <p>File preview not available</p>
          <p className={styles.hint}>{formatBytes(file.original_size)}</p>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.meta}>
          <div className={styles.metaRow}>
            <span className={styles.label}>Size</span>
            <span className={styles.value}>{formatBytes(file.original_size)}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.label}>Created</span>
            <span className={styles.value}>{formatDate(file.created_at, { relative: false })}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.label}>Type</span>
            <span className={styles.value}>{file.mime_type}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" size="sm" icon={<CopyIcon />} onClick={handleCopy}>
            Copy name
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<DownloadIcon />}
            onClick={handleDownload}
            loading={downloading}
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}

function XIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function FileIcon() { return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.6" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>; }
function CopyIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
function DownloadIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
