import { useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";
import {
  subscribeBoard,
  subscribeBoardRequest,
  subscribeOwnRequests,
  subscribeRequest,
  subscribeRequestQueue,
} from "./requestService";

export function useRequestData(kind, id) {
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const key = `${kind}:${user?.uid}:${id || ""}:${attempt}`;
  const enabled = Boolean(
    user && (!(kind === "request" || kind === "boardItem") || id),
  );
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const success = (data) => {
      if (active) setResult({ key, data, error: null });
    };
    const failure = (error) => {
      if (active) setResult({ key, data: null, error });
    };
    let stop;
    try {
      if (kind === "own")
        stop = subscribeOwnRequests(user.uid, success, failure);
      else if (kind === "request")
        stop = subscribeRequest(id, success, failure);
      else if (kind === "boardItem")
        stop = subscribeBoardRequest(id, success, failure);
      else if (kind === "queue") stop = subscribeRequestQueue(success, failure);
      else stop = subscribeBoard(success, failure);
    } catch (error) {
      failure(error);
    }
    return () => {
      active = false;
      stop?.();
    };
  }, [key, enabled, kind, id, user]);
  const current = result?.key === key ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: enabled && !current,
    retry: () => setAttempt((value) => value + 1),
  };
}
