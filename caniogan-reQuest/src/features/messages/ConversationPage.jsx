import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ActionLink,
  Button,
  EmptyState,
  Notice,
  PageHeading,
  TextField,
} from "../../components/ui";
import { useAuth } from "../auth/authContext";
import { useMessageData } from "./useMessageData";
import { canMessage, isUnread, mergeMessages } from "./messageModel";
import {
  markConversationRead,
  newMessageIntent,
  olderMessages,
  sendTaskMessage,
} from "./messageService";
import { MessageTime } from "./MessagesPage";

export function ConversationPage() {
  const { requestId, applicantUid } = useParams(),
    { user } = useAuth();
  return (
    <Conversation
      key={`${user.uid}:${requestId}:${applicantUid}`}
      requestId={requestId}
      applicantUid={applicantUid}
    />
  );
}
function Conversation({ requestId, applicantUid }) {
  const { t } = useTranslation(),
    { user } = useAuth();
  const meta = useMessageData("meta", requestId, applicantUid),
    messages = useMessageData("messages", requestId, applicantUid),
    context = useMessageData("context", requestId, applicantUid),
    receipt = useMessageData("receipt", requestId, applicantUid),
    connection = useMessageData("connection");
  const [text, setText] = useState(""),
    [intent, setIntent] = useState(null),
    [sending, setSending] = useState(false),
    [failed, setFailed] = useState(false),
    [sent, setSent] = useState(false);
  const [older, setOlder] = useState([]),
    [historyBusy, setHistoryBusy] = useState(false),
    [historyError, setHistoryError] = useState(false),
    [end, setEnd] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden),
    [atBottom, setAtBottom] = useState(true),
    [readError, setReadError] = useState(null);
  const log = useRef(null),
    locked = useRef(false),
    readAttempt = useRef(null),
    scrollAnchor = useRef(null);
  const list = mergeMessages(older, messages.data || []);
  const loading = [meta, messages, context, receipt].some(
      (item) => item.loading,
    ),
    error = [meta, messages, context, receipt].some((item) => item.error);
  const writable = canMessage(
    context.data?.requestStatus,
    context.data?.application?.status,
    context.data?.assignmentState,
  );
  const online = connection.data === true;
  const owner = user.uid === context.data?.requestOwnerUid;
  const name = owner
    ? meta.data?.applicantName || context.data?.application?.displayName
    : t("Humihingi ng tulong");
  const lastId = messages.data?.at(-1)?.id;
  useEffect(() => {
    const change = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  useLayoutEffect(() => {
    const node = log.current;
    if (!node) return;
    if (scrollAnchor.current != null) {
      node.scrollTop = node.scrollHeight - scrollAnchor.current;
      scrollAnchor.current = null;
    } else if (atBottom) node.scrollTop = node.scrollHeight;
  }, [lastId, older, atBottom, loading, error]);
  useEffect(() => {
    const id = meta.data?.lastMessageId;
    if (
      !online ||
      !visible ||
      !atBottom ||
      loading ||
      error ||
      !isUnread(meta.data, receipt.data, user.uid) ||
      !messages.data?.some((item) => item.id === id) ||
      readAttempt.current === id
    )
      return;
    readAttempt.current = id;
    markConversationRead(requestId, applicantUid, id)
      .then(() =>
        setReadError((previous) => (previous === id ? null : previous)),
      )
      .catch(() => setReadError(id));
  }, [
    online,
    visible,
    atBottom,
    loading,
    error,
    meta.data,
    receipt.data,
    messages.data,
    user.uid,
    requestId,
    applicantUid,
  ]);
  function retryReads() {
    readAttempt.current = null;
    receipt.retry();
  }
  function retryLoad() {
    for (const item of [meta, messages, context, receipt]) item.retry();
  }
  async function more() {
    if (historyBusy) return;
    setHistoryBusy(true);
    setHistoryError(false);
    try {
      const items = await olderMessages(requestId, applicantUid, list[0]);
      scrollAnchor.current = log.current.scrollHeight - log.current.scrollTop;
      setOlder((previous) =>
        mergeMessages(previous, messages.data || [], items),
      );
      setEnd(items.length < 50);
    } catch {
      setHistoryError(true);
    } finally {
      setHistoryBusy(false);
    }
  }
  async function send(event) {
    event.preventDefault();
    if (locked.current || !writable || !online) return;
    let next;
    try {
      next = intent || newMessageIntent(text);
    } catch {
      setFailed(true);
      return;
    }
    locked.current = true;
    setIntent(next);
    setSending(true);
    setFailed(false);
    setSent(false);
    setAtBottom(true);
    try {
      await sendTaskMessage(requestId, applicantUid, next);
      setText("");
      setIntent(null);
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      locked.current = false;
      setSending(false);
    }
  }
  return (
    <div className="task-column page-stack message-page">
      <PageHeading
        title={t("Pag-uusap")}
        backTo="/resident/messages"
        backLabel="Bumalik sa mga mensahe"
      />
      {error ? (
        <Notice
          tone="error"
          title={t("Hindi available ang pag-uusap")}
          action={<Button onClick={retryLoad}>{t("Subukan muli")}</Button>}
        >
          <p>
            {t(
              "Tingnan ang koneksiyon at subukang muli. Maaaring wala kang access sa pag-uusap na ito.",
            )}
          </p>
        </Notice>
      ) : loading ? (
        <p role="status">{t("Binubuksan ang pag-uusap…")}</p>
      ) : (
        <>
          <div className="conversation-context">
            <div>
              <h2>{name}</h2>
              <p>{meta.data?.requestTitle || context.data?.requestTitle}</p>
            </div>
            {context.data?.requestStatus === "open" && (
              <ActionLink
                to={
                  owner
                    ? `/resident/requests/${requestId}`
                    : `/resident/community/${requestId}`
                }
              >
                {t("Tingnan ang kahilingan")}
              </ActionLink>
            )}
          </div>
          <p className="muted message-privacy">
            {t(
              "Ikaw at ang kausap mo lamang ang may access sa pag-uusap na ito. Huwag magpadala ng password o ID number.",
            )}
          </p>
          {!writable && (
            <Notice title={t("Sarado ang pag-uusap")}>
              <p>
                {t(
                  "Mababasa pa ang mga mensahe, ngunit hindi na maaaring magpadala dahil nagbago ang aplikasyon, napiling boluntaryo, o katayuan ng kahilingan.",
                )}
              </p>
            </Notice>
          )}
          {!online && (
            <Notice title={t("Walang koneksiyon")} tone="warning">
              <p>
                {t(
                  "Mananatili rito ang iyong mensahe habang bukas ang pahina. Kumonekta muli para makapagpadala.",
                )}
              </p>
            </Notice>
          )}
          {!end && (messages.data?.length >= 50 || older.length > 0) && (
            <Button
              variant="secondary"
              loading={historyBusy}
              disabled={sending}
              onClick={more}
            >
              {t("Mas lumang mga mensahe")}
            </Button>
          )}
          {historyError && (
            <p role="alert">
              {t("Hindi mabuksan ang mas lumang mga mensahe. Subukan muli.")}
            </p>
          )}
          <div
            ref={log}
            className="conversation-log"
            role="log"
            aria-label={t("Mga mensahe sa pag-uusap")}
            aria-live="polite"
            aria-relevant="additions"
            tabIndex={0}
            onScroll={(event) => {
              const node = event.currentTarget;
              setAtBottom(
                node.scrollHeight - node.scrollTop - node.clientHeight < 60,
              );
            }}
          >
            {list.length ? (
              <ol className="conversation-list">
                {list.map((message) => (
                  <li
                    key={message.id}
                    className={`message-bubble ${message.senderUid === user.uid ? "message-bubble--own" : ""}`}
                  >
                    <span className="message-bubble__author">
                      {message.senderUid === user.uid ? t("Ikaw") : name}
                    </span>
                    <p>{message.text}</p>
                    <div className="message-bubble__meta">
                      <MessageTime value={message.createdAt} />
                      {sending && intent?.id === message.id && (
                        <span>{t("Ipinapadala…")}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title={t("Wala pang mensahe")}>
                <p>
                  {t(
                    "Pag-usapan ang iskedyul at kung paano makatutulong sa kahilingan.",
                  )}
                </p>
              </EmptyState>
            )}
          </div>
          {!atBottom && (
            <Button
              variant="secondary"
              onClick={() => {
                if (log.current)
                  log.current.scrollTop = log.current.scrollHeight;
                setAtBottom(true);
              }}
            >
              {t("Pumunta sa pinakabagong mensahe")}
            </Button>
          )}
          {readError === meta.data?.lastMessageId &&
            isUnread(meta.data, receipt.data, user.uid) && (
              <p role="status">
                {t("Hindi na-update ang katayuang nabasa.")}{" "}
                <Button variant="secondary" onClick={retryReads}>
                  {t("Subukan muli")}
                </Button>
              </p>
            )}
          {writable ? (
            <form
              className="message-composer page-stack"
              onSubmit={send}
              noValidate
            >
              {failed && (
                <Notice
                  title={t("Hindi naipadala ang mensahe")}
                  tone="error"
                  role="alert"
                >
                  <p>
                    {t(
                      "Nasa text box pa ang iyong mensahe. Tingnan ang koneksiyon at katayuan ng kahilingan bago subukang muli.",
                    )}
                  </p>
                </Notice>
              )}
              <TextField
                label={t("Isulat ang mensahe")}
                multiline
                rows={3}
                maxLength={2000}
                disabled={sending}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setIntent(null);
                  setFailed(false);
                  setSent(false);
                }}
                hint={t(
                  "Hanggang 2,000 character. Pindutin ang Ipadala kapag handa na.",
                )}
              />
              <div className="message-composer__actions">
                <p className="muted" role="status">
                  {sending
                    ? t("Ipinapadala…")
                    : sent
                      ? t("Naipadala ang mensahe")
                      : t("{{count}} / 2,000 character", {
                          count: text.length,
                        })}
                </p>
                <Button
                  type="submit"
                  disabled={sending || !online || !text.trim()}
                  aria-busy={sending}
                >
                  {t(failed ? "Ipadala muli" : "Ipadala")}
                </Button>
              </div>
            </form>
          ) : (
            text && (
              <p className="muted">
                {t("Hindi naipadala ang mensaheng ito:")}{" "}
                <span className="request-prose">{text}</span>
              </p>
            )
          )}
        </>
      )}
    </div>
  );
}
