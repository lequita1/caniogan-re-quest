import { useEffect, useState } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, database } from "../../lib/firebase";
import { AuthContext } from "./authContext";

const initialState = { user: null, account: null, loading: true, error: null };

export function AuthProvider({ children }) {
  const [session, setSession] = useState(initialState);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let stopAccount = () => {};
    let accountTimeout;
    let generation = 0;
    const stopAuth = onIdTokenChanged(
      auth,
      (user) => {
        const current = ++generation;
        stopAccount();
        clearTimeout(accountTimeout);
        if (!user) {
          setSession({
            user: null,
            account: null,
            loading: false,
            error: null,
          });
          return;
        }
        setSession((previous) =>
          previous.user?.uid === user.uid && previous.account && !previous.error
            ? { ...previous, user }
            : { user, account: null, loading: true, error: null },
        );
        accountTimeout = setTimeout(() => {
          if (current === generation)
            setSession({
              user,
              account: null,
              loading: false,
              error: new Error("account-connection-timeout"),
            });
        }, 12000);
        stopAccount = onValue(
          ref(database, `accounts/${user.uid}`),
          (snapshot) => {
            if (current !== generation) return;
            clearTimeout(accountTimeout);
            setSession({
              user,
              account: snapshot.val(),
              loading: false,
              error: null,
            });
          },
          (error) => {
            if (current !== generation) return;
            clearTimeout(accountTimeout);
            setSession({ user, account: null, loading: false, error });
          },
        );
      },
      (error) => setSession({ ...initialState, loading: false, error }),
    );
    return () => {
      generation++;
      clearTimeout(accountTimeout);
      stopAccount();
      stopAuth();
    };
  }, [attempt]);
  return (
    <AuthContext
      value={{ ...session, retry: () => setAttempt((value) => value + 1) }}
    >
      {children}
    </AuthContext>
  );
}
