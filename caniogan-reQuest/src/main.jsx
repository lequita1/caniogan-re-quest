import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@fontsource-variable/public-sans";
import "./index.css";
import "./locales/i18n";
import "./lib/firebase.js";
import App from "./App.jsx";
import { AuthProvider } from "./features/auth/AuthProvider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
