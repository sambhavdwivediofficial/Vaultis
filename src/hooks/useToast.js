import { create } from "zustand";

const useToastStore = create((set) => ({
  toasts: [],

  add: ({ message, type = "info", duration = 3500 }) => {
    const id = Math.random().toString(36).slice(2);
    set(s => ({ toasts: [...s.toasts, { id, message, type, duration }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, duration + 400);
  },

  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export function useToast() {
  const { add } = useToastStore();
  return {
    toast:   (msg)  => add({ message: msg, type: "info" }),
    success: (msg)  => add({ message: msg, type: "success" }),
    error:   (msg)  => add({ message: msg, type: "error" }),
    warning: (msg)  => add({ message: msg, type: "warning" }),
  };
}

export { useToastStore };