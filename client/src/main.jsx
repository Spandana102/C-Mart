
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "./index.css";
import App from "./App.jsx";

// ========================================
// GOOGLE OAUTH CONFIGURATION
// ========================================

const GOOGLE_CLIENT_ID = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
).trim();

// ========================================
// GOOGLE OAUTH STATUS
// ========================================

if (GOOGLE_CLIENT_ID) {
  console.log("Google OAuth configured successfully.");
} else {
  console.warn(
    "Google Client ID is missing. Google Login is disabled. Email and Password Login will still work."
  );
}

// ========================================
// MAIN APPLICATION
// ========================================

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    {GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);
