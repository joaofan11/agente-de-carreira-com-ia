import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Landing from "@/pages/Landing";

export default function Index() {
  const { isAuthenticated, authChecked } = useAuth();
  if (authChecked && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Landing />;
}