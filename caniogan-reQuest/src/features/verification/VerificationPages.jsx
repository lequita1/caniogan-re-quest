import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";
import {
  equalTo,
  limitToFirst,
  onValue,
  orderByChild,
  query,
  ref,
} from "firebase/database";
import { database } from "../../lib/firebase";
import {
  ActionLink,
  Button,
  Definition,
  EmptyState,
  Notice,
  PageHeading,
  RowLink,
  TextField,
} from "../../components/ui";
import { useAuth } from "../auth/authContext";
import { authError } from "../auth/authService";
import { SignOutButton } from "../auth/AuthPages";
import { FormErrors } from "../auth/AuthControls";
import { reviewVerification, submitVerification } from "./verificationService";

export function VerificationPage() {
  const { t } = useTranslation();
  const { account } = useAuth();
  const verification = account?.verification;
  const [errors, setErrors] = useState(null),
    [busy, setBusy] = useState(false);
  if (account?.standing !== "active")
    return <Navigate to="/account-status" replace />;
  if (account?.role !== "resident") return <Navigate to="/" replace />;
  if (verification?.status === "approved")
    return <Navigate to="/resident" replace />;
  const canSubmit = !verification || verification.status === "needsChanges";
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const fullName = values.get("fullName").trim(),
      address = values.get("address").trim(),
      next = {};
    if (fullName.length < 2 || fullName.length > 120)
      next.fullName = "Ilagay ang buong pangalan na may 2–120 character.";
    if (address.length < 10 || address.length > 300)
      next.address = "Ilagay ang malinaw na address na may 10–300 character.";
    if (!values.get("consent"))
      next.consent =
        "Kumpirmahin ang pagpapasa para sa pagsusuri ng paninirahan.";
    setErrors(Object.keys(next).length ? next : null);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await submitVerification({ fullName, address });
    } catch (error) {
      setErrors({
        form:
          error.message === "case-changed"
            ? "Nagbago na ang aplikasyon. I-refresh ang pahina bago magpatuloy."
            : authError(error),
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-card auth-card--wide page-stack">
      <PageHeading
        title={
          canSubmit
            ? t("Patunayan ang paninirahan")
            : t("Status ng pagpapatunay")
        }
        description={t(
          "Na-verify na ang iyong email. Kumpletuhin ang pagpapatunay ng paninirahan para magamit ang mga serbisyo.",
        )}
      />
      <Notice title={t("Personal na pagpapatunay")}>
        <p>
          {t(
            "Ihanda ang iyong ID para sa personal na pagsusuri sa tanggapan ng barangay. Hindi kailangang mag-upload ng ID sa form na ito.",
          )}{" "}
        </p>
      </Notice>
      {verification && (
        <Notice
          title={
            verification.status === "submitted"
              ? t("Naipasa na · Naghihintay sa pagsusuri")
              : verification.status === "needsChanges"
                ? t("May kailangang baguhin")
                : t("Hindi naaprubahan")
          }
          tone={verification.status === "submitted" ? "info" : "warning"}
          role="status"
        >
          <p>
            {verification.status === "submitted"
              ? t(
                  "Makikita rito ang desisyon kapag natapos ng kawani ang review. Hindi mo kailangang magpasa muli.",
                )
              : verification.review?.reason}
          </p>
          {verification.status === "rejected" && (
            <p>
              {t(
                "Lumapit sa barangay desk para sa paglilinaw. Hindi pa bukas ang online appeal.",
              )}{" "}
            </p>
          )}
        </Notice>
      )}
      <FormErrors errors={errors} />
      {canSubmit ? (
        <form className="page-stack" onSubmit={submit} noValidate>
          <TextField
            id="fullName"
            name="fullName"
            label={t("Buong pangalan")}
            defaultValue={verification?.fullName || ""}
            maxLength={120}
            required
            error={errors?.fullName}
            hint={t("Gamitin ang buong pangalan na nasa iyong ID.")}
          />
          <TextField
            id="address"
            name="address"
            label={t("Address sa Caniogan")}
            multiline
            rows={3}
            defaultValue={verification?.address || ""}
            maxLength={300}
            required
            error={errors?.address}
            hint={t(
              "Isama ang house number, street at purok sa Caniogan, Malolos, Bulacan.",
            )}
          />
          <label className="check-field">
            <input
              id="consent"
              name="consent"
              type="checkbox"
              aria-invalid={!!errors?.consent}
            />
            <span>
              {t(
                "Pinapayagan ko ang awtorisadong kawani na suriin ang aking detalye para sa pagpapatunay ng paninirahan.",
              )}{" "}
            </span>
          </label>
          <Button type="submit" loading={busy}>
            {t("Ipasa para sa pagsusuri")}{" "}
          </Button>
        </form>
      ) : (
        <dl className="definition-list review-details">
          <Definition label={t("Pangalan")}>{verification.fullName}</Definition>
          <Definition label={t("Address")}>{verification.address}</Definition>
          <Definition label={t("Paraan ng pagpapatunay")}>
            {t("Personal na pagsusuri sa tanggapan ng barangay")}{" "}
          </Definition>
        </dl>
      )}
      <SignOutButton />
      <ActionLink to="/help">{t("Gabay at tulong")}</ActionLink>
    </div>
  );
}

export function VerificationQueue() {
  const { t } = useTranslation();
  const [state, setState] = useState({
    loading: true,
    records: [],
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(
    () =>
      onValue(
        query(
          ref(database, "accounts"),
          orderByChild("verification/status"),
          equalTo("submitted"),
          limitToFirst(50),
        ),
        (snapshot) => {
          const records = [];
          snapshot.forEach((child) => {
            records.push({ uid: child.key, ...child.val() });
          });
          setState({ loading: false, records, error: null });
        },
        (error) => setState({ loading: false, records: [], error }),
      ),
    [attempt],
  );
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={t("Pagpapatunay ng paninirahan")}
        backTo="/staff"
        backLabel={t("Bumalik sa mga susuriin")}
        description={t(
          "Hanggang 50 naghihintay na aplikasyon. Awtomatikong naa-update ang listahan.",
        )}
      />
      {state.loading ? (
        <p role="status">{t("Binubuksan ang mga aplikasyon…")}</p>
      ) : state.error ? (
        <Notice
          title={t("Hindi mabuksan ang listahan")}
          tone="error"
          action={
            <Button onClick={() => setAttempt((value) => value + 1)}>
              {"Subukan muli"}{" "}
            </Button>
          }
        >
          <p>{t(authError(state.error))}</p>
        </Notice>
      ) : state.records.length ? (
        <div className="link-list">
          {state.records.map((record) => (
            <RowLink
              key={record.uid}
              title={record.verification.fullName}
              description={t("Naghihintay ng pagsusuri ng paninirahan")}
              to={`/staff/verification/${record.uid}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState title={t("Walang naghihintay na aplikasyon")}>
          <p>{t("Lilitaw dito ang bagong ipinasa para sa pagsusuri.")}</p>
        </EmptyState>
      )}
    </div>
  );
}

export function VerificationReview() {
  const { uid } = useParams();
  return <VerificationReviewCase key={uid} uid={uid} />;
}

function VerificationReviewCase({ uid }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [state, setState] = useState({
    uid: null,
    loading: true,
    account: null,
    error: null,
  });
  const [errors, setErrors] = useState(null),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(
    () =>
      onValue(
        ref(database, `accounts/${uid}`),
        (snapshot) =>
          setState({
            uid,
            loading: false,
            account: snapshot.val(),
            error: null,
          }),
        (error) => setState({ uid, loading: false, account: null, error }),
      ),
    [uid],
  );
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget),
      decision = data.get("decision"),
      reason = data.get("reason").trim(),
      evidenceChecked = data.get("evidenceChecked") === "on",
      next = {};
    if (reason.length < 10 || reason.length > 500)
      next.reason = "Magbigay ng malinaw na paliwanag na may 10–500 character.";
    if (decision === "approved" && !evidenceChecked)
      next.evidenceChecked =
        "Kumpirmahing nasuri mo nang personal ang patunay ng paninirahan.";
    setErrors(Object.keys(next).length ? next : null);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await reviewVerification(uid, { decision, reason, evidenceChecked });
      setSaved(true);
    } catch (error) {
      setErrors({
        form:
          error.message === "case-changed"
            ? "Nasuri o nabago na ang aplikasyon. Tingnan ang pinakabagong katayuan."
            : authError(error),
      });
    } finally {
      setBusy(false);
    }
  }
  const verification = state.account?.verification;
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={t("Suriin ang paninirahan")}
        backTo="/staff/verification"
        backLabel={t("Bumalik sa listahan ng mga aplikasyon")}
      />
      {state.loading || state.uid !== uid ? (
        <p role="status">{t("Binubuksan ang aplikasyon…")}</p>
      ) : state.error ? (
        <Notice title={t("Hindi mabuksan ang aplikasyon")} tone="error">
          <p>{t(authError(state.error))}</p>
        </Notice>
      ) : !verification ? (
        <EmptyState title={t("Walang aplikasyon sa pagpapatunay")}>
          <p>{t("Piliin ang aplikasyon mula sa queue.")}</p>
        </EmptyState>
      ) : (
        <>
          <dl className="definition-list review-details">
            <Definition label={t("Pangalan")}>
              {verification.fullName}
            </Definition>
            <Definition label={t("Address")}>{verification.address}</Definition>
            <Definition label={t("Katayuan")}>
              {t(
                {
                  submitted: "Naghihintay ng pagsusuri",
                  approved: "Aprubado",
                  needsChanges: "May kailangang baguhin",
                  rejected: "Hindi naaprubahan",
                }[verification.status],
              )}
            </Definition>
            <Definition label={t("Patunay")}>
              {t("Personal na pagsusuri sa tanggapan ng barangay")}{" "}
            </Definition>
          </dl>
          <FormErrors errors={errors} />
          {saved && verification.status !== "submitted" && (
            <Notice
              title={t("Na-save ang desisyon")}
              tone="success"
              role="status"
            >
              <p>
                {t(
                  "Makikita ng aplikante ang kasalukuyang desisyon at paliwanag.",
                )}{" "}
              </p>
            </Notice>
          )}
          {uid === user.uid ? (
            <Notice
              title={t("Hindi puwedeng suriin ang sariling aplikasyon")}
              tone="warning"
            >
              <p>{t("Ipa-review sa ibang awtorisadong kawani.")}</p>
            </Notice>
          ) : verification.status === "submitted" ? (
            <form className="page-stack" onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="decision">{t("Desisyon")}</label>
                <select
                  id="decision"
                  name="decision"
                  className="input"
                  defaultValue="needsChanges"
                >
                  <option value="needsChanges">
                    {t("Ibalik para sa pagwawasto")}{" "}
                  </option>
                  <option value="approved">{t("Aprubahan")}</option>
                  <option value="rejected">{t("Hindi aprubahan")}</option>
                </select>
              </div>
              <TextField
                id="reason"
                name="reason"
                label={t("Paliwanag para sa aplikante")}
                multiline
                rows={3}
                maxLength={500}
                required
                error={errors?.reason}
                hint={t(
                  "Ipaliwanag ang dapat baguhin o ang batayan ng desisyon.",
                )}
              />
              <label className="check-field">
                <input
                  id="evidenceChecked"
                  name="evidenceChecked"
                  type="checkbox"
                  aria-invalid={!!errors?.evidenceChecked}
                />
                <span>
                  {t(
                    "Personal kong nasuri ang patunay ng paninirahan. Kailangan ito bago mag-apruba.",
                  )}{" "}
                </span>
              </label>
              <Button type="submit" loading={busy}>
                {t("I-save ang desisyon")}{" "}
              </Button>
            </form>
          ) : (
            <Notice title={t("May desisyon na ang aplikasyon")}>
              <p>{verification.review?.reason}</p>
            </Notice>
          )}
        </>
      )}
    </div>
  );
}
