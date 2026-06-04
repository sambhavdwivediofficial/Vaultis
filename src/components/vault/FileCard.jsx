import React from "react";
import { cn, formatBytes, formatDate, getMimeIcon } from "../../utils/helpers.js";
import { useToast } from "../../hooks/useToast.js";
import useFileStore from "../../store/fileStore.js";
import styles from "./FileCard.module.css";

const MIME_COLORS = {
  image:   "#0095ff",
  video:   "#8b5cf6",
  audio:   "#f59e0b",
  pdf:     "#ff4466",
  archive: "#f97316",
  text:    "#00d4a0",
  file:    "#64748b",
};

export default function FileCard({ file, onClick }) {
  const del            = useFileStore(s => s.delete);
  const exportFile     = useFileStore(s => s.exportFile);
  const { success, error } = useToast();

  const iconType  = getMimeIcon(file.mime_type);
  const iconColor = MIME_COLORS[iconType] || MIME_COLORS.file;

  const handleDelete = async (e) => {
    e.stopPropagation();
    const res = await del(file.id);
    if (res.ok) success("File moved to trash");
    else error(res.error);
  };

  const handleExport = async (e) => {
    e.stopPropagation();
    // TODO: open folder picker via dialog plugin
    const res = await exportFile(file.id, "C:\\Users\\Public\\Documents");
    if (res.ok) success(`Exported to ${res.path}`);
    else error(res.error);
  };

  return (
    <article className={styles.card} onClick={onClick}>
      <div className={styles.iconWrap} style={{ "--file-color": iconColor }}>
        <FileTypeIcon type={iconType} />
      </div>

      <div className={styles.info}>
        <span className={styles.name}>{file.name}</span>
        <div className={styles.meta}>
          <span className={styles.size}>{formatBytes(file.original_size)}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.date}>{formatDate(file.created_at)}</span>
        </div>
        <span className={styles.mime}>{file.mime_type}</span>
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={handleExport} aria-label="Export file">
          <ExportIcon />
        </button>
        <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={handleDelete} aria-label="Delete file">
          <TrashIcon />
        </button>
      </div>
    </article>
  );
}

function FileTypeIcon({ type }) {
  const icons = {
    image:   <ImageIcon />,
    video:   <VideoIcon />,
    audio:   <AudioIcon />,
    pdf:     <PdfIcon />,
    archive: <ArchiveIcon />,
    text:    <TextIcon />,
    file:    <GenericFileIcon />,
  };
  return icons[type] || icons.file;
}

function ImageIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>; }
function VideoIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>; }
function AudioIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function PdfIcon()         { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function ArchiveIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>; }
function TextIcon()        { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
function GenericFileIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>; }
function ExportIcon()      { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function TrashIcon()       { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>; }
