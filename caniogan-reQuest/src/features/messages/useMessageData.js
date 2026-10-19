import { useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";
import { retainMessageWindow, retainInboxWindow } from "./messageModel";
import { watchMessages } from "./messageService";

export function useMessageData(kind, requestId, applicantUid) {
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(0),
    [result, setResult] = useState(null);
  const key = `${user?.uid}:${kind}:${requestId || ""}:${applicantUid || ""}:${attempt}`;
  useEffect(() => {
    if (!user) return;
    let live = true,
      stop;
    const failure = (error) => {
      if (live) setResult({ key, error });
    };
    try {
      stop = watchMessages(
        kind,
        requestId,
        applicantUid,
        (data) => {
          if (live)
            setResult((previous) => ({
              key,
              data:
                previous?.key === key && ["messages", "inbox"].includes(kind)
                  ? (kind === "messages"
                      ? retainMessageWindow
                      : retainInboxWindow)(previous.data || [], data)
                  : data,
            }));
        },
        failure,
      );
    } catch (error) {
      failure(error);
    }
    return () => {
      live = false;
      stop?.();
    };
  }, [kind, requestId, applicantUid, user, key]);
  const current = result?.key === key ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: !current,
    retry: () => setAttempt((n) => n + 1),
  };
}
