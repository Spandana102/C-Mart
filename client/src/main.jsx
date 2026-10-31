
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

// Check Google Client ID
if (!GOOGLE_CLIENT_ID) {
  console.error(
    "Google Client ID is missing. Add VITE_GOOGLE_CLIENT_ID to client/.env"
  );
}

// ========================================
// MAIN APPLICATION
// ========================================

const root = createRoot(
  document.getElementById("root")
);

root.render(
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

const googleClientId = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
).trim();

console.log("Frontend Google OAuth:", {
  configured: Boolean(googleClientId),
  clientIdFingerprint: googleClientId
    ? "configured"
    : "missing",
});
