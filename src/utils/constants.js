export const APP_NAME = "Vaultis";
export const APP_VERSION = "0.1.0";
export const APP_AUTHOR = "Sambhav Dwivedi";

export const AUTO_LOCK_OPTIONS = [
  { label: "1 minute",  value: 60 },
  { label: "5 minutes", value: 300 },
  { label: "15 minutes",value: 900 },
  { label: "30 minutes",value: 1800 },
  { label: "1 hour",   value: 3600 },
  { label: "Never",    value: 0 },
];

export const PASSWORD_STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong", "Excellent"];
export const PASSWORD_STRENGTH_COLORS = [
  "var(--accent-danger)",
  "var(--accent-warning)",
  "#f5c842",
  "#7ed56f",
  "var(--accent-primary)",
];

export const NOTE_COLORS = [
  { label: "Default",  value: null },
  { label: "Teal",     value: "#00d4a0" },
  { label: "Blue",     value: "#0095ff" },
  { label: "Purple",   value: "#8b5cf6" },
  { label: "Rose",     value: "#f43f5e" },
  { label: "Amber",    value: "#f59e0b" },
  { label: "Slate",    value: "#64748b" },
];

export const MIME_ICONS = {
  "image/":        "image",
  "video/":        "video",
  "audio/":        "audio",
  "application/pdf": "pdf",
  "application/zip": "archive",
  "application/x-tar": "archive",
  "text/":         "text",
  "default":       "file",
};

export const ROUTES = {
  WELCOME:   "/",
  SETUP:     "/setup",
  UNLOCK:    "/unlock",
  DASHBOARD: "/dashboard",
  NOTES:     "/notes",
  NOTE_NEW:  "/notes/new",
  NOTE_EDIT: "/notes/:id/edit",
  NOTE_VIEW: "/notes/:id",
  FILES:     "/files",
  FILE_VIEW: "/files/:id",
  PASSWORDS: "/passwords",
  TAGS:      "/tags",
  SETTINGS:  "/settings",
  BACKUP:    "/backup",
  TRASH:     "/trash",
};