import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getIdToken,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { ref, runTransaction, serverTimestamp } from "firebase/database";
import { auth, database } from "../../lib/firebase";

export async function createResidentProfile(displayName) {
  if (!auth.currentUser) throw new Error("Sign in required");
  const result = await runTransaction(
    ref(database, `accounts/${auth.currentUser.uid}`),
    (existing) => {
      if (existing) return;
      return {
        role: "resident",
        standing: "active",
        profile: {
          displayName: displayName.trim(),
          createdAt: serverTimestamp(),
        },
      };
    },
    { applyLocally: false },
  );
  return result.snapshot.val();
}

export async function registerResident({ displayName, email, password }) {
  await setPersistence(auth, browserSessionPersistence);
  await createUserWithEmailAndPassword(auth, email.trim(), password);
  await createResidentProfile(displayName);
  // Email delivery can be retried without creating another account.
  try {
    await sendEmailVerification(auth.currentUser);
  } catch {
    return { emailSent: false };
  }
  return { emailSent: true };
}

export async function login({ email, password, remember }) {
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence,
  );
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export const logout = () => signOut(auth);
export const resendVerification = () => sendEmailVerification(auth.currentUser);
export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email.trim());
export async function refreshEmailStatus() {
  await reload(auth.currentUser);
  await getIdToken(auth.currentUser, true);
  return auth.currentUser.emailVerified;
}

export function authError(error) {
  const messages = {
    "auth/invalid-credential":
      "Mali ang email o password. Subukan muli o i-reset ang iyong password.",
    "auth/invalid-login-credentials":
      "Mali ang email o password. Subukan muli o i-reset ang iyong password.",
    "auth/wrong-password":
      "Mali ang email o password. Subukan muli o i-reset ang iyong password.",
    "auth/user-not-found":
      "Mali ang email o password. Subukan muli o i-reset ang iyong password.",
    "auth/email-already-in-use":
      "Hindi magawa ang account gamit ang email na ito. Subukang mag-log in o i-reset ang password.",
    "auth/invalid-email": "Ilagay ang tamang email address.",
    "auth/weak-password":
      "Gumamit ng mas matibay na password na sumusunod sa mga requirement.",
    "auth/password-does-not-meet-requirements":
      "Hindi pasok ang password sa mga requirement ng account. Gumamit ng mas matibay na password.",
    "auth/too-many-requests":
      "Maraming sunod-sunod na pagsubok. Maghintay muna bago subukan muli.",
    "auth/network-request-failed":
      "Hindi makakonekta. Tingnan ang internet at subukan muli.",
    "auth/operation-not-allowed":
      "Hindi pa naka-enable ang pag-log in gamit ang email. Ipaalam ito sa tagapangasiwa ng app.",
    "auth/unauthorized-domain":
      "Hindi pa pinapayagan ang web address na ito. Ipaalam ito sa tagapangasiwa ng app.",
    "auth/user-disabled":
      "Hindi magagamit ang account na ito. Lumapit sa barangay desk para sa tulong.",
    PERMISSION_DENIED:
      "Hindi pinayagan ang pag-save. Subukang muli o lumapit sa tagapangasiwa ng app.",
    "permission-denied":
      "Hindi pinayagan ang pag-save. Subukang muli o lumapit sa tagapangasiwa ng app.",
  };
  return (
    messages[error?.code] ||
    "Hindi natuloy ang aksiyon. Subukan muli. Kung magpatuloy ang problema, lumapit sa barangay desk."
  );
}
