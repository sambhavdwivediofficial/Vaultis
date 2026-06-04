import React, { useState } from "react";
import Dialog, { DialogFooter } from "../ui/Dialog.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import styles from "./CreateFolderModal.module.css";

const FOLDER_COLORS = [
  "#00d4a0", "#0095ff", "#8b5cf6",
  "#f43f5e", "#f59e0b", "#64748b",
];

export default function CreateFolderModal({ open, onClose, onCreate }) {
  const [name,    setName]    = useState("");
  const [color,   setColor]   = useState(FOLDER_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("Folder name is required"); return; }
    setLoading(true);
    await onCreate?.({ name: name.trim(), color });
    setLoading(false);
    setName("");
    setColor(FOLDER_COLORS[0]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="New Folder" size="sm">
      <div className={styles.body}>
        <Input
          label="Folder name"
          value={name}
          onChange={e => { setName(e.target.value); setError(""); }}
          placeholder="e.g. Work, Finance, Private"
          error={error}
          required
          onKeyDown={e => e.key === "Enter" && handleCreate()}
          autoFocus
        />
        <div className={styles.colorPick}>
          <span className={styles.colorLabel}>Color</span>
          <div className={styles.swatches}>
            {FOLDER_COLORS.map(c => (
              <button
                key={c}
                className={styles.swatch}
                style={{ background: c, outline: color === c ? `2px solid ${c}` : "none" }}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleCreate} loading={loading}>
          Create folder
        </Button>
      </DialogFooter>
    </Dialog>
  );
}