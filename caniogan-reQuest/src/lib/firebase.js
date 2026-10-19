import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const missingFields = Object.entries(firebaseConfig)
  .filter(([, value]) => !value?.trim())
  .map(([name]) => name);

if (missingFields.length > 0) {
  throw new Error(
    `Missing Firebase configuration: ${missingFields.join(", ")}. ` +
      "Copy .env.example to .env.local, fill in the web app settings, and restart Vite.",
  );
}

export const firebaseApp = getApps().some((app) => app.name === "[DEFAULT]")
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const database = getDatabase(firebaseApp);

// Explicit opt-in only: development tests never fall back to production writes.
if (
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true"
) {
  if (!globalThis.__requestEmulatorsConnected) {
    const authEmulatorUrl = import.meta.env.VITE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099";
    if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(authEmulatorUrl).hostname)) {
      throw new Error("Use a local Firebase Auth emulator address.");
    }
    connectAuthEmulator(auth, authEmulatorUrl);
    connectDatabaseEmulator(database, "127.0.0.1", 9000);
    globalThis.__requestEmulatorsConnected = true;
  }
}
