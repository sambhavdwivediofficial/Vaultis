// import React, { useEffect, useState } from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import useAuthStore from "./store/authStore.js";
// import { useAutoLock } from "./hooks/useAutoLock.js";
// import ToastContainer from "./components/ui/Toast.jsx";
// import { FullscreenLoader } from "./components/ui/Loader.jsx";

// // Pages
// import WelcomePage from "./pages/Welcome/Welcome.jsx";
// import SetupPage from "./pages/Setup/Setup.jsx";
// import UnlockPage from "./pages/Unlock/Unlock.jsx";
// import DashboardPage from "./pages/Dashboard/Dashboard.jsx";
// import NotesPage from "./pages/Notes/Notes.jsx";
// import FilesPage from "./pages/Files/Files.jsx";
// import PasswordsPage from "./pages/Passwords/PasswordVault.jsx";
// import SettingsPage from "./pages/Settings/Settings.jsx";
// import CreateBackup from "./pages/Backup/CreateBackup.jsx";
// import TrashPage from "./pages/Trash/Trash.jsx";
// import TagsPage from "./pages/Tags/Tags.jsx";

// export default function App() {
//   const init = useAuthStore((s) => s.init);
//   const isLoading = useAuthStore((s) => s.isLoading);
//   const vaultExists = useAuthStore((s) => s.vaultExists);
//   const isUnlocked = useAuthStore((s) => s.isUnlocked);
//   const [mounted, setMounted] = useState(false);

//   useAutoLock();

//   // Initialize vault state on mount
//   useEffect(() => {
//     init().then(() => setMounted(true));
//   }, [init]);

//   if (!mounted || isLoading) {
//     return <FullscreenLoader message="Initializing vault..." />;
//   }

//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* ── Pre-vault (no auth guard) ──────────────────────────────── */}
//         <Route path="/" element={<WelcomePage />} />
//         <Route path="/setup" element={<SetupPage />} />
//         <Route path="/unlock" element={<UnlockPage />} />

//         {/* ── Protected routes (require vault + unlock) ────────────────── */}
//         {isUnlocked ? (
//           <>
//             <Route path="/dashboard" element={<DashboardPage />} />
//             <Route path="/notes/:id?" element={<NotesPage />} />
//             <Route path="/files" element={<FilesPage />} />
//             <Route path="/passwords" element={<PasswordsPage />} />
//             <Route path="/tags" element={<TagsPage />} />
//             <Route path="/settings" element={<SettingsPage />} />
//             <Route path="/backup" element={<CreateBackup />} />
//             <Route path="/trash" element={<TrashPage />} />
//             <Route path="*" element={<Navigate to="/dashboard" />} />
//           </>
//         ) : (
//           <>
//             {vaultExists ? (
//               <Route path="*" element={<Navigate to="/unlock" />} />
//             ) : (
//               <Route path="*" element={<Navigate to="/" />} />
//             )}
//           </>
//         )}
//       </Routes>

//       <ToastContainer />
//     </BrowserRouter>
//   );
// }



import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore.js";
import { useAutoLock } from "./hooks/useAutoLock.js";
import ToastContainer from "./components/ui/Toast.jsx";
import { FullscreenLoader } from "./components/ui/Loader.jsx";

// Pages
import WelcomePage from "./pages/Welcome/Welcome.jsx";
import SetupPage from "./pages/Setup/Setup.jsx";
import UnlockPage from "./pages/Unlock/Unlock.jsx";
import DashboardPage from "./pages/Dashboard/Dashboard.jsx";
import NotesPage from "./pages/Notes/Notes.jsx";
import FilesPage from "./pages/Files/Files.jsx";
import PasswordsPage from "./pages/Passwords/PasswordVault.jsx";
import SettingsPage from "./pages/Settings/Settings.jsx";
import CreateBackup from "./pages/Backup/CreateBackup.jsx";
import TrashPage from "./pages/Trash/Trash.jsx";
import TagsPage from "./pages/Tags/Tags.jsx";

export default function App() {
  const init = useAuthStore((s) => s.init);
  const isLoading = useAuthStore((s) => s.isLoading);
  const vaultExists = useAuthStore((s) => s.vaultExists);
  const isUnlocked = useAuthStore((s) => s.isUnlocked);

  const [mounted, setMounted] = useState(false);

  useAutoLock();

  useEffect(() => {
    let active = true;

    (async () => {
      await init();

      if (active) {
        setMounted(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (!mounted || isLoading) {
    return <FullscreenLoader message="Initializing vault..." />;
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* PRE-AUTH ROUTES */}
        {!isUnlocked && (
          <>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/unlock" element={<UnlockPage />} />
          </>
        )}

        {/* PROTECTED ROUTES */}
        {isUnlocked && (
          <>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/notes/:id?" element={<NotesPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/passwords" element={<PasswordsPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/backup" element={<CreateBackup />} />
            <Route path="/trash" element={<TrashPage />} />
          </>
        )}

        {/* FALLBACK */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                isUnlocked
                  ? "/dashboard"
                  : (vaultExists ? "/unlock" : "/")
              }
              replace
            />
          }
        />

      </Routes>

      <ToastContainer />
    </BrowserRouter>
  );
}