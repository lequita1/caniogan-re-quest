import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionLink, Button, Notice, TextField } from "../../components/ui";
import { useAuth } from "../auth/authContext";
import { FormErrors } from "../auth/AuthControls";
import {
  applyToVolunteer,
  respondToSelection,
  selectVolunteer,
  updateApplication,
} from "./volunteerService";
import { useVolunteering } from "./useVolunteering";
import { APPLICATION_STATUS, ASSIGNMENT_STATUS } from "./volunteerModel";

import { messageLink } from "../messages/messageModel";

export function VolunteerPanel({ record }) {
  return <VolunteerCase key={record.id} record={record} />;
}
function VolunteerCase({ record }) {
  const { t } = useTranslation(),
    { user } = useAuth();
  const owner = user.uid === record.ownerUid;
  const own = useVolunteering("ownApplication", record.id, !owner);
  const applications = useVolunteering("applications", record.id, owner);
  const state = useVolunteering("state", record.id);
  const commitment = useVolunteering("commitment");
  const assignment = useVolunteering(
    "assignment",
    record.id,
    owner || own.data?.status === "selected",
  );
  const [introduction, setIntroduction] = useState(""),
    [availability, setAvailability] = useState("");
  const [confirm, setConfirm] = useState(null),
    [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false),
    [errors, setErrors] = useState(null),
    [saved, setSaved] = useState("");
  const sending = useRef(false),
    confirmHeading = useRef(null);
  const active = ["offered", "inProgress"].includes(state.data);
  const source = owner ? applications : own;
  const readError = [source, state, commitment, assignment].find(
    (value) => value.error,
  );
  const loading = [source, state, commitment, assignment].some(
    (value) => value.loading,
  );
  const open = record.status === "open";
  async function run(action, success) {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setErrors(null);
    setSaved("");
    try {
      await action();
      setSaved(success);
      setConfirm(null);
      setReason("");
    } catch {
      setErrors({
        form: "Hindi natuloy ang pagbabago. Maaaring nagbago ang kahilingan o may kasalukuyang gawain ang boluntaryo. Subukan muli matapos suriin ang katayuan.",
      });
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  function ask(value) {
    setConfirm(value);
    setErrors(null);
    setSaved("");
    setTimeout(() => confirmHeading.current?.focus(), 0);
  }
  function apply(event) {
    event.preventDefault();
    const next = {};
    if (introduction.trim().length < 10 || introduction.trim().length > 500)
      next.introduction = "Magpakilala gamit ang 10–500 character.";
    if (availability.trim().length < 3 || availability.trim().length > 200)
      next.availability =
        "Ilagay ang oras na maaari ka gamit ang 3–200 character.";
    setErrors(Object.keys(next).length ? next : null);
    if (!Object.keys(next).length)
      run(
        () => applyToVolunteer(record.id, { introduction, availability }),
        "Naipadala ang iyong aplikasyon. Ang humihingi ng tulong ang pipili ng boluntaryo.",
      );
  }
  const applicants = Object.entries(applications.data || {}).sort(
    (a, b) => b[1].createdAt - a[1].createdAt,
  );
  const selected = applicants.find(
    ([id]) => id === assignment.data?.volunteerUid,
  )?.[1];
  return (
    <section
      className="volunteer-section page-stack"
      aria-label={t(owner ? "Mga boluntaryo" : "Pagboboluntaryo")}
    >
      <div className="section-heading">
        <h2>{t(owner ? "Mga boluntaryo" : "Pagboboluntaryo")}</h2>
        <ActionLink to="/resident/volunteering">
          {t("Mga sinalihan ko")}
        </ActionLink>
      </div>
      <FormErrors errors={errors} />
      {saved && (
        <p className="volunteer-feedback" role="status">
          {t(saved)}
        </p>
      )}
      {readError ? (
        <Notice
          title={t("Hindi mabuksan ang mga aplikasyon")}
          tone="error"
          action={
            <Button onClick={() => readError.retry()}>
              {t("Subukan muli")}
            </Button>
          }
        >
          <p>
            {t(
              "Tingnan ang koneksiyon at subukang muli. Kung nagpapatuloy ito, ipasuri ang access sa kawani.",
            )}
          </p>
        </Notice>
      ) : loading ? (
        <p role="status">{t("Binubuksan ang mga aplikasyon…")}</p>
      ) : (
        <>
          {active && (
            <Notice title={t(ASSIGNMENT_STATUS[state.data])}>
              <p>
                {t(
                  owner
                    ? state.data === "offered"
                      ? "Naipadala na ang alok. Kailangang tanggapin ito ng napiling boluntaryo bago magsimula."
                      : "Tinanggap na ng boluntaryo ang gawain."
                    : "May napili nang boluntaryo para sa kahilingang ito.",
                )}
              </p>
              {owner && selected && <p>{selected.displayName}</p>}
            </Notice>
          )}
          {owner &&
            assignment.data?.state === "declined" &&
            assignment.data.reason && (
              <Notice title={t("Dahilan ng hindi pagtanggap")}>
                <p className="request-prose">{assignment.data.reason}</p>
              </Notice>
            )}
          {!open && (
            <p>
              {t(
                "Sarado na ang kahilingan. Hindi na tumatanggap ng aplikasyon.",
              )}
            </p>
          )}
          {owner ? (
            <>
              <p className="muted">
                {t(
                  "Piliin ang taong angkop sa gawain. Isang boluntaryo muna ang maaaring piliin; pribado ang pagpapakilala at oras na maaari nilang ilaan.",
                )}
              </p>
              {!applicants.length ? (
                <p>
                  {t(
                    "Wala pang nag-aaplay. Makikita rito ang mga aplikante kapag may gustong tumulong.",
                  )}
                </p>
              ) : (
                <ul className="volunteer-list">
                  {applicants.map(([id, app]) => (
                    <li key={id}>
                      <div className="section-heading">
                        <h3>{app.displayName}</h3>
                        <span className="status-chip">
                          {t(APPLICATION_STATUS[app.status])}
                        </span>
                      </div>
                      <p className="request-prose">{app.introduction}</p>
                      <p className="request-prose">
                        <strong>{t("Oras na maaari:")}</strong>{" "}
                        {app.availability}
                      </p>
                      <ActionLink to={messageLink(record.id, id)}>
                        {t("Magpadala ng mensahe")}
                      </ActionLink>
                      {open && app.status === "pending" && (
                        <div className="request-actions">
                          <Button
                            disabled={busy || active}
                            onClick={() =>
                              ask({
                                kind: "select",
                                uid: id,
                                name: app.displayName,
                              })
                            }
                          >
                            {t("Piliin bilang boluntaryo")}
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              ask({
                                kind: "decline",
                                uid: id,
                                name: app.displayName,
                              })
                            }
                          >
                            {t("Hindi piliin")}
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {applicants.length === 50 && (
                <p className="muted">
                  {t("Ipinapakita ang pinakabagong 50 aplikasyon.")}
                </p>
              )}
            </>
          ) : own.data ? (
            <>
              <p>
                <strong>{t("Aking aplikasyon:")}</strong>{" "}
                {t(APPLICATION_STATUS[own.data.status])}
              </p>
              <p className="request-prose">{own.data.introduction}</p>
              <p className="request-prose">
                <strong>{t("Oras na maaari:")}</strong> {own.data.availability}
              </p>
              <ActionLink to={messageLink(record.id, user.uid)}>
                {t("Magpadala ng mensahe")}
              </ActionLink>
              {open && own.data.status === "pending" && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => ask({ kind: "withdraw" })}
                >
                  {t("Bawiin ang aplikasyon")}
                </Button>
              )}
              {open &&
                own.data.status === "selected" &&
                assignment.data?.volunteerUid === user.uid && (
                  <>
                    {state.data === "offered" && (
                      <Notice title={t("Napili ka para tumulong")}>
                        <p>
                          {t(
                            "Tiyaking kaya mong gawin ang kahilingan bago tanggapin. Isang aktibong gawain lamang ang maaari mong hawakan.",
                          )}
                        </p>
                        <div className="request-actions">
                          <Button
                            disabled={busy}
                            onClick={() => ask({ kind: "accept" })}
                          >
                            {t("Tanggapin ang gawain")}
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={busy}
                            onClick={() => ask({ kind: "declineOffer" })}
                          >
                            {t("Hindi tanggapin")}
                          </Button>
                        </div>
                      </Notice>
                    )}
                    {state.data === "inProgress" && (
                      <ActionLink
                        variant="primary"
                        to={`/resident/requests/${record.id}`}
                      >
                        {t("Tingnan ang detalye ng gawain")}
                      </ActionLink>
                    )}
                  </>
                )}
            </>
          ) : open && !active ? (
            <>
              {commitment.data ? (
                <Notice title={t("May nakalaan ka nang gawain")}>
                  <p>
                    {t(
                      "Maaari kang mag-apply sa ibang kahilingan, ngunit kailangan munang matapos o makansela ang kasalukuyang gawain bago ka mapili muli.",
                    )}
                  </p>
                </Notice>
              ) : null}
              <form onSubmit={apply} className="page-stack" noValidate>
                <p>
                  {t(
                    "Magpakilala at ilagay kung kailan ka maaaring tumulong. Hindi awtomatikong mapapasaiyo ang gawain kapag nag-apply ka.",
                  )}
                </p>
                <TextField
                  label={t("Maikling pagpapakilala")}
                  value={introduction}
                  onChange={(e) => setIntroduction(e.target.value)}
                  multiline
                  rows={3}
                  minLength={10}
                  maxLength={500}
                  required
                  error={errors?.introduction}
                  hint={t(
                    "Sabihin kung paano ka makatutulong. Huwag maglagay ng ID number o pribadong contact details.",
                  )}
                />
                <TextField
                  label={t("Kailan ka maaaring tumulong?")}
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  minLength={3}
                  maxLength={200}
                  required
                  error={errors?.availability}
                />
                <Button type="submit" loading={busy}>
                  {t("Mag-apply bilang boluntaryo")}
                </Button>
              </form>
            </>
          ) : null}
          {confirm && (
            <section
              className="request-confirm page-stack"
              aria-label={t("Kumpirmahin ang pagpili")}
            >
              <h3 ref={confirmHeading} tabIndex={-1}>
                {t(
                  {
                    select: "Piliin si {{name}}?",
                    decline: "Hindi piliin si {{name}}?",
                    withdraw: "Bawiin ang iyong aplikasyon?",
                    accept: "Tanggapin at simulan ang gawain?",
                    declineOffer: "Hindi tanggapin ang gawain?",
                  }[confirm.kind],
                  { name: confirm.name },
                )}
              </h3>
              <p>
                {t(
                  confirm.kind === "select"
                    ? "Maghihintay muna sa pagtanggap ng boluntaryo. Hindi ka makapipili ng iba habang may nakabinbing alok."
                    : confirm.kind === "accept"
                      ? "Makikita mo ang pribadong tagubilin pagkatapos mong tanggapin ang gawain."
                      : "Mananatili ang tala ng aplikasyon at ang bagong katayuan nito.",
                )}
              </p>
              {confirm.kind === "declineOffer" && (
                <TextField
                  label={t("Dahilan ng hindi pagtanggap")}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  multiline
                  maxLength={500}
                  hint={t(
                    "Magbigay ng maikling dahilan na may 10–500 character.",
                  )}
                />
              )}
              <div className="request-actions">
                <Button
                  loading={busy}
                  disabled={
                    confirm.kind === "declineOffer" && reason.trim().length < 10
                  }
                  onClick={() =>
                    run(() => {
                      if (confirm.kind === "select")
                        return selectVolunteer(record.id, confirm.uid);
                      if (confirm.kind === "decline")
                        return updateApplication(
                          record.id,
                          confirm.uid,
                          "declined",
                        );
                      if (confirm.kind === "withdraw")
                        return updateApplication(
                          record.id,
                          user.uid,
                          "withdrawn",
                        );
                      return respondToSelection(
                        record.id,
                        confirm.kind === "accept",
                        reason,
                      );
                    }, "Na-save ang pagbabago.")
                  }
                >
                  {t("Kumpirmahin")}
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setConfirm(null)}
                >
                  {t("Bumalik")}
                </Button>
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
