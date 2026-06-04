import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import ContentArea from "../../components/layout/ContentArea.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import FileCard from "../../components/vault/FileCard.jsx";
import Button from "../../components/ui/Button.jsx";
import Dialog, { DialogFooter } from "../../components/ui/Dialog.jsx";
import { SkeletonCard } from "../../components/ui/Loader.jsx";
import useFileStore from "../../store/fileStore.js";
import { useSearch } from "../../hooks/useSearch.js";
import { useToast } from "../../hooks/useToast.js";
import { isSmallScreen, formatBytes } from "../../utils/helpers.js";
import styles from "./Files.module.css";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export default function FilesPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const files = useFileStore(s => s.files);
  const isLoading = useFileStore(s => s.isLoading);
  const isUploading = useFileStore(s => s.isUploading);
  const upload = useFileStore(s => s.upload);
  const fetch_ = useFileStore(s => s.fetch);

  const { query, setQuery, results } = useSearch(
    async q => useFileStore.getState().search(q),
    300
  );

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const displayFiles = query ? results : files;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (file.size > MAX_FILE_SIZE) {
      showError(`File too large. Max: ${formatBytes(MAX_FILE_SIZE)}`);
      return;
    }

    setUploading(true);
    try {
      // TODO: Get file path from dialog plugin
      const result = await upload("", [], null);
      if (result.ok) {
        success("File uploaded successfully");
        fetch_();
        setUploadDialogOpen(false);
      } else {
        showError(result.error);
      }
    } catch (e) {
      showError(e.message || "Upload failed");
    }
    setUploading(false);
  };

  return (
    <div className={styles.wrapper}>
      {isSmallScreen() && <Navbar onMenuToggle={() => {}} />}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <div className={styles.main}>
        <Header
          title="Files"
          showSearch={true}
          onSearch={setQuery}
          actions={
            <Button
              variant="primary"
              size="sm"
              icon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload file
            </Button>
          }
        />

        <ContentArea>
          {isLoading ? (
            <div className={styles.grid}>
              {Array(6).fill(0).map((_, i) => (
                <SkeletonCard key={i} lines={3} />
              ))}
            </div>
          ) : displayFiles.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><FileUploadIcon /></div>
              <p className={styles.emptyText}>
                {query ? "No files found" : "No files uploaded yet"}
              </p>
              {!query && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Upload your first file
                </Button>
              )}
            </div>
          ) : (
            <div className={styles.listWrap}>
              {displayFiles.map(file => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          )}
        </ContentArea>
      </div>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        title="Upload File"
        description="Drag and drop or select a file to encrypt and store"
        size="md"
      >
        <div
          className={`${styles.dropZone} ${dragActive ? styles.active : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className={styles.dropIcon}><CloudUploadIcon /></div>
          <p className={styles.dropText}>Drag files here or click to browse</p>
          <p className={styles.dropHint}>Max file size: {formatBytes(MAX_FILE_SIZE)}</p>
          <input
            type="file"
            id="file-input"
            className={styles.hiddenInput}
            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setUploadDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={uploading}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            {uploading ? "Uploading..." : "Select file"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function UploadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function FileUploadIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.6" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function CloudUploadIcon() { return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.4" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>; }
