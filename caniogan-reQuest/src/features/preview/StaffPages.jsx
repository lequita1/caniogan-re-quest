import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import {
  ActionLink,
  Definition,
  Notice,
  PageHeading,
  RowLink,
} from "../../components/ui";
import { queues } from "./sampleData";
import { useAuth } from "../auth/authContext";

export function StaffHome() {
  const { t } = useTranslation();
  const { account } = useAuth();
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Mga susuriin")}
        description={t(
          "Pamahalaan ang mga aplikasyon, kahilingan at ulat ng mga residente.",
        )}
      />
      <div className="link-list">
        {queues
          .filter(
            (queue) =>
              queue.id !== "verification" ||
              account?.capabilities?.reviewResidents === true,
          )
          .map((queue) => (
            <RowLink
              key={queue.id}
              title={t(queue.title)}
              description={
                queue.id === "verification"
                  ? t("Buksan ang mga aplikasyon para sa pagsusuri")
                  : t(queue.description)
              }
              to={`/staff/${queue.id}`}
            />
          ))}
      </div>
      <Notice title={t("Paalala sa pagsusuri")}>
        <p>
          {t(
            "Suriin lamang ang mga aplikasyong sakop ng iyong tungkulin. Ipa-review sa ibang awtorisadong kawani ang sarili mong aplikasyon.",
          )}
        </p>
      </Notice>
    </div>
  );
}

export function StaffQueue() {
  const { t } = useTranslation();
  const { queueId } = useParams();
  const queue = queues.find((item) => item.id === queueId);
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={t(queue?.title || "Hindi makita ang listahan")}
        description={queue?.detail ? t(queue.detail) : undefined}
        backTo="/staff"
        backLabel={t("Bumalik sa mga susuriin")}
      />
      <Notice title={t("Status ng mga tala")}>
        <p>{t(queue?.description || "Pumili ng listahan upang magpatuloy.")}</p>
      </Notice>
      {queueId === "points" && (
        <dl className="definition-list">
          <Definition label={t("Gawain")}>{t("ASG-2026-004 · Sam")}</Definition>
          <Definition label={t("Boluntaryo")}>
            {t("Kinumpirma nang tapos na ang gawain")}
          </Definition>
          <Definition label={t("Humiling")}>
            {t("Kinumpirma ang natapos na gawain")}
          </Definition>
          <Definition label={t("Puntos")}>{t("25 puntos")}</Definition>
        </dl>
      )}
      <p className="muted">
        {t("Hindi pa available ang pagproseso sa pahinang ito.")}
      </p>
      <ActionLink to="/staff">{t("Bumalik sa mga susuriin")}</ActionLink>
    </div>
  );
}

export function CaptainHome() {
  const { t } = useTranslation();
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Pangkalahatang ulat")}
        description={t(
          "Buod ng mga serbisyo, kahilingan at gawain sa barangay.",
        )}
      />
      <section className="page-stack">
        <h2>{t("Status ng mga serbisyo")}</h2>
        <dl className="definition-list">
          <Definition label={t("Bukas na kahilingan")}>12</Definition>
          <Definition label={t("Natapos na gawain")}>18</Definition>
          <Definition label={t("Dokumentong maaari nang kunin")}>6</Definition>
        </dl>
      </section>
      <section className="page-stack">
        <h2>{t("Mga dapat pagtuunan")}</h2>
        <p>
          {t(
            "Paglilinis ang pinakamaraming kahilingan. May 3 gawaing lumampas sa nakatakdang petsa na kailangang suriin ng kawani.",
          )}
        </p>
      </section>
      <Notice title={t("Tungkol sa ulat")}>
        <p>
          {t(
            "Buod lamang ang ipinapakita rito. Hindi kasama ang mga ID, pribadong address o personal na usapan ng mga residente.",
          )}
        </p>
      </Notice>
    </div>
  );
}
