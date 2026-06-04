import { useEffect } from "react";
import useAuthStore from "../store/authStore.js";

export function useAutoLock() {
  const lock         = useAuthStore(s => s.lock);
  const listenForLock = useAuthStore(s => s.listenForLock);

  // Listen for backend lock events
  useEffect(() => {
    const unlisten = listenForLock();
    return unlisten;
  }, [listenForLock]);

  // Emergency lock keyboard shortcut: Ctrl+Shift+L
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "L") {
        e.preventDefault();
        lock();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lock]);
}