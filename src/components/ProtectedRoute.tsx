// import { Navigate } from "react-router";
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserStore } from "../stores/userStore";
import { Box, CircularProgress } from "@mui/material"; // Added for loading indicator

const ProtectedRoute: React.FC = () => {
  // We rely on the userStore state and checkAuthStatus action (defined in src/stores/userStore.ts)
  const { isAuthenticated, checkAuthStatus } = useUserStore();
  const location = useLocation();

  // Local state to track if the initial asynchronous authentication check is complete
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Run the async token check/verification routine
      await checkAuthStatus();

      // 2. Mark the check as complete, allowing the component to render based on the final isAuthenticated value
      setIsAuthCheckComplete(true);
    };

    if (!isAuthCheckComplete) {
      initializeAuth();
    }
  }, [checkAuthStatus]);

  // ------------------------- Guard Rails -------------------------

  // 1. Show loading spinner while the auth check is in progress
  if (!isAuthCheckComplete) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // 2. If check is complete and NOT authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If check is complete and authenticated, render the nested route content
  return <Outlet />;
};

export default ProtectedRoute;
