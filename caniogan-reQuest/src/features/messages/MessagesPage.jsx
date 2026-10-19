import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ActionLink,
  Button,
  EmptyState,
  Notice,
  PageHeading,
} from "../../components/ui";
import { useAuth } from "../auth/authContext";
import { useMessageData } from "./useMessageData";
import { olderConversations } from "./messageService";
import { isUnread, messageLink } from "./messageModel";
import "./messages.css";

export function MessageTime({ value }) {
  const { i18n } = useTranslation();
  if (!Number.isFinite(value)) return null;
  return (
    <time dateTime={new Date(value).toISOString()}>
      {new Intl.DateTimeFormat(
        i18n.resolvedLanguage === "fil" ? "fil-PH" : "en-PH",
        { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
      ).format(value)}
    </time>
  );
}
export function MessageLoadError({ retry }) {
  const { t } = useTranslation();
  return (
    <Notice
      tone="error"
      title={t("Hindi mabuksan ang pag-uusap")}
      action={<Button onClick={retry}>{t("Subukan muli")}</Button>}
    >
      <p>
        {t(
          "Tingnan ang koneksiyon at subukang muli. Maaaring wala kang access sa pag-uusap na ito.",
        )}
      </p>
    </Notice>
  );
}
function InboxRow({ item }) {
  const { t } = useTranslation(),
    { user } = useAuth();
  const meta = useMessageData("meta", item.requestId, item.applicantUid),
    receipt = useMessageData("receipt", item.requestId, item.applicantUid);
  if (meta.error || receipt.error)
    return (
      <li>
        <MessageLoadError
          retry={() => {
            meta.retry();
            receipt.retry();
          }}
        />
      </li>
    );
  if (meta.loading || receipt.loading)
    return (
      <li className="inbox-loading" role="status">
        {t("Binubuksan ang pag-uusap…")}
      </li>
    );
  if (!meta.data) return null;
  const unread = isUnread(meta.data, receipt.data, user.uid);
  return (
    <li>
      <Link
        className={`inbox-row ${unread ? "inbox-row--unread" : ""}`}
        to={messageLink(item.requestId, item.applicantUid)}
      >
        <div className="inbox-row__heading">
          <strong>
            {user.uid === item.applicantUid
              ? t("Humihingi ng tulong")
              : meta.data.applicantName}
          </strong>
          <MessageTime value={meta.data.lastMessageAt} />
        </div>
        <span className="inbox-row__request">{meta.data.requestTitle}</span>
        <span className="inbox-row__preview">
          {meta.data.lastSenderUid === user.uid ? `${t("Ikaw:")} ` : ""}
          {meta.data.lastText}
        </span>
        {unread && (
          <span className="message-unread">{t("Hindi pa nababasa")}</span>
        )}
      </Link>
    </li>
  );
}
export function MessagesPage() {
  const { user } = useAuth();
  return <Inbox key={user.uid} />;
}
function Inbox() {
  const { t } = useTranslation();
  const inbox = useMessageData("inbox");
  const [older, setOlder] = useState([]),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false),
    [end, setEnd] = useState(false);
  const entries = [
    ...new Map(
      [...older, ...(inbox.data || [])].map((item) => [item.id, item]),
    ).values(),
  ].sort(
    (a, b) =>
      b.updatedAt - a.updatedAt || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0),
  );
  async function more() {
    setBusy(true);
    setFailed(false);
    try {
      const items = await olderConversations(entries.at(-1));
      setOlder((previous) => [...previous, ...items]);
      setEnd(items.length < 30);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={t("Mga mensahe")}
        description={t(
          "Makipag-ugnayan tungkol sa iyong kahilingan o aplikasyon. Hiwalay ang bawat pag-uusap.",
        )}
      />
      {inbox.error ? (
        <MessageLoadError retry={inbox.retry} />
      ) : inbox.loading ? (
        <p role="status">{t("Binubuksan ang mga mensahe…")}</p>
      ) : entries.length ? (
        <>
          <ul className="message-inbox" aria-label={t("Mga pag-uusap")}>
            {entries.map((item) => (
              <InboxRow key={item.id} item={item} />
            ))}
          </ul>
          {failed && (
            <p role="alert">
              {t("Hindi mabuksan ang mas lumang mga mensahe. Subukan muli.")}
            </p>
          )}
          {!end && inbox.data.length >= 30 && (
            <Button variant="secondary" loading={busy} onClick={more}>
              {t("Mas lumang mga pag-uusap")}
            </Button>
          )}
        </>
      ) : (
        <EmptyState
          title={t("Wala ka pang mensahe")}
          action={
            <ActionLink to="/resident/volunteering">
              {t("Mga sinalihan ko")}
            </ActionLink>
          }
        >
          <p>
            {t(
              "Buksan ang isang aplikasyon at piliin ang Mensahe para magsimula. Lalabas dito ang pag-uusap kapag may naipadalang mensahe.",
            )}
          </p>
        </EmptyState>
      )}
    </div>
  );
}
