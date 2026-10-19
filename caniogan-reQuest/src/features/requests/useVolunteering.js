import { useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";
import { watchVolunteering } from "./volunteerService";

export function useVolunteering(kind, id, enabled = true) {
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(0),
    [result, setResult] = useState(null);
  const key = `${kind}:${id || ""}:${user?.uid}:${attempt}`;
  useEffect(() => {
    if (!enabled || !user) return;
    let live = true;
    const success = (data) => {
      if (live) setResult({ key, data });
    };
    const failure = (error) => {
      if (live) setResult({ key, error });
    };
    let stop;
    try {
      stop = watchVolunteering(kind, id, success, failure);
    } catch (error) {
      failure(error);
    }
    return () => {
      live = false;
      stop?.();
    };
  }, [kind, id, enabled, user, key]);
  return {
    data: enabled && result?.key === key ? result.data : null,
    error: enabled && result?.key === key ? result.error : null,
    loading: enabled && result?.key !== key,
    retry: () => setAttempt((n) => n + 1),
  };
}
