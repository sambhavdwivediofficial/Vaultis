import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Public pages
import WelcomePage  from "../pages/Welcome/Welcome.jsx";
import SetupPage    from "../pages/Setup/Setup.jsx";
import UnlockPage   from "../pages/Unlock/Unlock.jsx";

// Protected pages
import ProtectedRoutes from "./ProtectedRoutes.jsx";
import DashboardPage   from "../pages/Dashboard/Dashboard.jsx";
import NotesPage       from "../pages/Notes/Notes.jsx";
import NoteEditor      from "../pages/Notes/NoteEditor.jsx";
import FilesPage       from "../pages/Files/Files.jsx";
import PasswordVault   from "../pages/Passwords/PasswordVault.jsx";
import TagsPage        from "../pages/Tags/Tags.jsx";
import SettingsPage    from "../pages/Settings/Settings.jsx";
import BackupPage      from "../pages/Backup/Backup.jsx";
import TrashPage       from "../pages/Trash/Trash.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ───────────────────────────────────────────────────── */}
      <Route path="/"       element={<WelcomePage />} />
      <Route path="/setup"  element={<SetupPage />} />
      <Route path="/unlock" element={<UnlockPage />} />

      {/* ── Protected ────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoutes />}>
        <Route path="/dashboard"         element={<DashboardPage />} />
        <Route path="/notes"             element={<NotesPage />} />
        <Route path="/notes/new"         element={<NoteEditor noteId={null} />} />
        <Route path="/notes/:id"         element={<NotesPage />} />
        <Route path="/notes/:id/edit"    element={<NoteEditor />} />
        <Route path="/files"             element={<FilesPage />} />
        <Route path="/passwords"         element={<PasswordVault />} />
        <Route path="/tags"              element={<TagsPage />} />
        <Route path="/settings"          element={<SettingsPage />} />
        <Route path="/backup"            element={<BackupPage />} />
        <Route path="/trash"             element={<TrashPage />} />
        <Route path="*"                  element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}