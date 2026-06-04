import React, { createContext, useContext } from "react";
import useAuthStore from "../store/authStore.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuthStore();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

export default AuthContext;