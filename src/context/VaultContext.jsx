import React, { createContext, useContext, useEffect } from "react";
import useNoteStore from "../store/noteStore.js";
import usePasswordStore from "../store/passwordStore.js";
import useFileStore from "../store/fileStore.js";
import useSettingsStore from "../store/settingsStore.js";
import useAuthStore from "../store/authStore.js";

const VaultContext = createContext(null);

export function VaultProvider({ children }) {
  const isUnlocked = useAuthStore(s => s.isUnlocked);

  const fetchNotes     = useNoteStore(s => s.fetch);
  const fetchPasswords = usePasswordStore(s => s.fetch);
  const fetchFiles     = useFileStore(s => s.fetch);
  const fetchSettings  = useSettingsStore(s => s.fetch);

  // Fetch all vault data when unlocked
  useEffect(() => {
    if (isUnlocked) {
      fetchNotes();
      fetchPasswords();
      fetchFiles();
      fetchSettings();
    }
  }, [isUnlocked, fetchNotes, fetchPasswords, fetchFiles, fetchSettings]);

  const value = {
    isUnlocked,
    notes:     useNoteStore(s => s.notes),
    passwords: usePasswordStore(s => s.passwords),
    files:     useFileStore(s => s.files),
    settings:  useSettingsStore(s => s.settings),
  };

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVaultContext() {
  const ctx = useContext(VaultContext);
  if (!ctx) {
    throw new Error("useVaultContext must be used inside <VaultProvider>");
  }
  return ctx;
}

export default VaultContext;