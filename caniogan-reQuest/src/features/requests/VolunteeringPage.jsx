import { useTranslation } from "react-i18next";
import {
  ActionLink,
  Button,
  EmptyState,
  Notice,
  PageHeading,
} from "../../components/ui";
import { useVolunteering } from "./useVolunteering";
import { useRequestData } from "./useRequestData";
import { APPLICATION_STATUS, ASSIGNMENT_STATUS } from "./volunteerModel";

import { useAuth } from "../auth/authContext";
import { messageLink } from "../messages/messageModel";

function ActivityItem({ id, record }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const application = useVolunteering("ownApplication", id),
    state = useVolunteering("state", id),
    board = useRequestData("boardItem", id);
  return (
    <li>
      <h2>{record.title}</h2>
      {application.loading || state.loading || board.loading ? (
        <p role="status">{t("Binubuksan ang mga aplikasyon…")}</p>
      ) : application.error || state.error || board.error ? (
        <p>
          {t(
            "Hindi mabuksan ang katayuan. Buksan ang kahilingan o subukang muli.",
          )}
        </p>
      ) : (
        <p>
          {t(
            (!board.data && application.data?.status === "pending"
              ? "Sarado na ang kahilingan"
              : APPLICATION_STATUS[application.data?.status]) ||
              "Hindi makita ang aplikasyon",
          )}
          {application.data?.status === "selected" && state.data
            ? ` · ${t(ASSIGNMENT_STATUS[state.data])}`
            : ""}
        </p>
      )}
      <div className="request-actions">
        <ActionLink to={`/resident/community/${id}`}>
          {t("Buksan ang kahilingan")}
        </ActionLink>
        {application.data && (
          <ActionLink to={messageLink(id, user.uid)}>
            {t("Magpadala ng mensahe")}
          </ActionLink>
        )}
      </div>
    </li>
  );
}
export function ClosedVolunteerRequest({ requestId }) {
  const { t } = useTranslation(),
    activity = useVolunteering("activity");
  const record = activity.data?.[requestId];
  return (
    <EmptyState
      title={record?.title || t("Hindi makita ang kahilingan")}
      action={
        <ActionLink to="/resident/volunteering">
          {t("Mga sinalihan ko")}
        </ActionLink>
      }
    >
      <p>
        {t(
          "Sarado na o hindi available ang kahilingan. Mananatili ang iyong aplikasyon sa mga sinalihan mo.",
        )}
      </p>
    </EmptyState>
  );
}
export function VolunteeringPage() {
  const { t } = useTranslation(),
    activity = useVolunteering("activity"),
    commitment = useVolunteering("commitment");
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={t("Mga sinalihan ko")}
        backTo="/resident/requests"
        backLabel={t("Bumalik sa mga kahilingan")}
      />
      <p className="page-intro">
        {t("Subaybayan ang iyong mga aplikasyon at napiling gawain.")}
      </p>
      {commitment.data && (
        <Notice
          title={t("May nakalaan ka nang gawain")}
          action={
            <ActionLink to={`/resident/community/${commitment.data.requestId}`}>
              {t("Buksan ang nakalaang gawain")}
            </ActionLink>
          }
        >
          <p>
            {t(
              "Tingnan kung naghihintay ito ng pagtanggap o kasalukuyan nang ginagawa.",
            )}
          </p>
        </Notice>
      )}
      {activity.loading ? (
        <p role="status">{t("Binubuksan ang mga aplikasyon…")}</p>
      ) : activity.error ? (
        <Notice
          title={t("Hindi mabuksan ang mga aplikasyon")}
          tone="error"
          action={<Button onClick={activity.retry}>{t("Subukan muli")}</Button>}
        >
          <p>{t("Tingnan ang koneksiyon at subukang muli.")}</p>
        </Notice>
      ) : !activity.data ? (
        <EmptyState
          title={t("Wala ka pang sinalihang kahilingan")}
          action={
            <ActionLink to="/resident/community">
              {t("Maghanap ng matutulungan")}
            </ActionLink>
          }
        >
          <p>
            {t(
              "Pumili ng kahilingan sa komunidad at mag-apply bilang boluntaryo.",
            )}
          </p>
        </EmptyState>
      ) : (
        <ul className="volunteer-list">
          {Object.entries(activity.data)
            .sort((a, b) => b[1].createdAt - a[1].createdAt)
            .map(([id, record]) => (
              <ActivityItem key={id} id={id} record={record} />
            ))}
        </ul>
      )}
    </div>
  );
}
