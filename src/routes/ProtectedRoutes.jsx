import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore.js";
import { FullscreenLoader } from "../components/ui/Loader.jsx";

export default function ProtectedRoutes() {
  const isUnlocked  = useAuthStore(s => s.isUnlocked);
  const vaultExists = useAuthStore(s => s.vaultExists);
  const isLoading   = useAuthStore(s => s.isLoading);
  const location    = useLocation();

  if (isLoading) {
    return <FullscreenLoader message="Checking vault..." />;
  }

  if (!vaultExists) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!isUnlocked) {
    return <Navigate to="/unlock" replace state={{ from: location }} />;
  }

  return <Outlet />;
}