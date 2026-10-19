import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import {
  ActionLink,
  Button,
  Definition,
  EmptyState,
  Notice,
  PageHeading,
  RowLink,
  SelectField,
  TextField,
} from "../../components/ui";
import { useAuth } from "../auth/authContext";
import { FormErrors } from "../auth/AuthControls";
import {
  REQUEST_CATEGORIES,
  REQUEST_STATUSES,
  validateRequest,
} from "./requestModel";
import {
  addRequestImage,
  beginRequestImageUpload,
  cancelRequest,
  createRequestDraft,
  deleteRequestDraft,
  completeRequestImageDeletion,
  removeRequestImage,
  reviewRequest,
  saveRequestDraft,
  submitRequest,
} from "./requestService";
import {
  deleteRequestImage,
  mediaErrorMessage,
  uploadRequestImage,
} from "./mediaService";
import PrivateImage from "./PrivateImage";
import { VolunteerPanel } from "./VolunteerPanel";
import { ClosedVolunteerRequest } from "./VolunteeringPage";
import { useRequestData } from "./useRequestData";
import "./requests.css";

const LocationPicker = lazy(() => import("../maps/LocationPicker"));
const CommunityMap = lazy(() => import("../maps/CommunityMap"));
const editable = (record) => ["draft", "needsChanges"].includes(record?.status);
const errorLabels = {
  photoVisibility: "Sino ang makakakita ng mga larawan?",
  title: "Gumamit ng 5 hanggang 100 character para sa pamagat.",
  description:
    "Ilarawan ang kailangan mong tulong sa 20 hanggang 2,000 character.",
  areaLabel:
    "Ilagay ang lugar o palatandaang makikita ng komunidad (3–120 character).",
  category: "Pumili ng uri ng kahilingan.",
  rewardType: "Pumili ng uri ng pabuya.",
  rewardDetails: "Ilagay ang detalye ng pabuya, hanggang 200 character.",
  meetingDetails: "Paikliin ang pribadong tagubilin sa hanggang 300 character.",
  location: "Pumili ng wastong lokasyon.",
};
const rewardLabels = {
  none: "Walang pabuya",
  cash: "Cash",
  gift: "Regalo o gift card",
  coupon: "Kupon",
};
function categoryLabel(category) {
  return (
    REQUEST_CATEGORIES.find((item) => item.value === category)?.label ||
    "Iba pa"
  );
}
function requestError(error) {
  if (
    error?.message?.includes("not-editable") ||
    error?.message?.includes("changed")
  )
    return "Nagbago na ang kahilingan. Buksan muli ito bago magpatuloy.";
  if (
    error?.code === "PERMISSION_DENIED" ||
    /permission.denied/i.test(error?.message || "")
  )
    return "Hindi pinayagan ang pagbabagong ito. Suriin ang status ng kahilingan o makipag-ugnayan sa kawani.";
  return "Hindi ma-save ang pagbabago. Suriin ang koneksyon at subukang muli.";
}
function formError(error) {
  return /^[a-z]+(?:_[a-z]+)+$/.test(error?.code || "")
    ? mediaErrorMessage(error)
    : requestError(error);
}
function DateText({ value }) {
  const { i18n } = useTranslation();
  if (typeof value !== "number") return null;
  return (
    <time dateTime={new Date(value).toISOString()}>
      {new Intl.DateTimeFormat(
        i18n.resolvedLanguage === "en" ? "en-PH" : "fil-PH",
        { dateStyle: "medium", timeStyle: "short" },
      ).format(value)}
    </time>
  );
}
function Status({ code }) {
  const { t } = useTranslation();
  return (
    <span className={`request-status request-status--${code}`}>
      {t(REQUEST_STATUSES[code] || "Hindi matukoy ang status")}
    </span>
  );
}
function Resource({ resource, children }) {
  const { t } = useTranslation();
  if (resource.loading)
    return <p role="status">{t("Kinukuha ang mga kahilingan…")}</p>;
  if (resource.error)
    return (
      <Notice
        title={t("Hindi makuha ang mga kahilingan")}
        tone="warning"
        action={<Button onClick={resource.retry}>{t("Subukang muli")}</Button>}
      >
        <p>
          {t(
            "Suriin ang koneksyon o ang iyong access, pagkatapos ay subukang muli.",
          )}
        </p>
      </Notice>
    );
  return children;
}
function RequestList({ items, board = false, selectedId, onSelect }) {
  const { t } = useTranslation();
  return (
    <ul className="request-list">
      {items.map((item) => (
        <li
          key={item.id}
          className={
            selectedId === item.id ? "request-list__selected" : undefined
          }
        >
          <Link
            className="request-list__link"
            to={`${board ? "/resident/community" : "/resident/requests"}/${item.id}`}
          >
            <span className="request-list__title">{item.title}</span>
            <span className="muted">
              {t(categoryLabel(item.category))} · {item.areaLabel}
            </span>
            <span className="request-list__meta">
              <Status code={item.status} />
              <DateText value={item.publishedAt || item.updatedAt} />
            </span>
          </Link>
          {onSelect && item.location && (
            <button
              className="text-button request-list__locate"
              type="button"
              aria-pressed={selectedId === item.id}
              onClick={() => onSelect(item.id)}
            >
              {t("Ipakita sa mapa")}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
export function RequestHome() {
  const { t } = useTranslation(),
    { account } = useAuth();
  const resource = useRequestData("own");
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Magandang araw, {{name}}.", {
          name: account?.profile?.displayName || "ka-barangay",
        })}
        description={t("Ano ang kailangan mo ngayon?")}
      />
      <div className="home-grid">
        <section className="service-section">
          <h2>{t("Mga serbisyo")}</h2>
          <div className="link-list">
            <RowLink
              title={t("Humingi ng tulong")}
              description={t("Mag-post ng pangangailangan sa komunidad.")}
              to="/resident/requests/new"
            />
            <RowLink
              title={t("Mag-apply ng dokumento")}
              description={t("Tingnan ang requirements bago magsimula.")}
              to="/resident/documents"
            />
            <RowLink
              title={t("Sumali sa aktibidad")}
              description={t("Makilahok o mag-alok ng tulong.")}
              to="/resident/events"
            />
          </div>
        </section>
        <section className="request-recent page-stack">
          <h2>{t("Mga kahilingan mo")}</h2>
          <Resource resource={resource}>
            {resource.data?.length ? (
              <RequestList items={resource.data.slice(0, 3)} />
            ) : (
              <p className="muted">
                {t(
                  "Wala ka pang kahilingan. Magsimula kapag may kailangan kang tulong.",
                )}
              </p>
            )}
          </Resource>
          <Link to="/resident/requests">
            {t("Tingnan ang lahat ng kahilingan")}
          </Link>
        </section>
      </div>
      <RowLink
        title={t("Kailangan mo ng gabay?")}
        description={t("Puwedeng magpatulong sa barangay desk.")}
        to="/resident/help"
      />
    </div>
  );
}
export function MyRequestsPage() {
  const { t } = useTranslation(),
    resource = useRequestData("own");
  const [filter, setFilter] = useState("all");
  const visible = (resource.data || []).filter(
    (item) => filter === "all" || item.status === filter,
  );
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Mga kahilingan")}
        description={t(
          "Mga kamakailang kahilingan mo at ang susunod na hakbang.",
        )}
      />
      <div className="page-toolbar">
        <SelectField
          label={t("Ipakita")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">{t("Lahat ng status")}</option>
          {Object.entries(REQUEST_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {t(label)}
            </option>
          ))}
        </SelectField>
        <ActionLink variant="primary" to="/resident/requests/new">
          {t("Bagong kahilingan")}
        </ActionLink>
      </div>
      <Resource resource={resource}>
        {visible.length ? (
          <RequestList items={visible} />
        ) : (
          <EmptyState title={t("Walang kahilingan sa listahang ito")}>
            <p>{t("Gumawa ng kahilingan o pumili ng ibang status.")}</p>
          </EmptyState>
        )}
      </Resource>
    </div>
  );
}
function LocalPhoto({ file }) {
  const { t } = useTranslation(),
    image = useRef(null);
  useEffect(() => {
    const url = URL.createObjectURL(file),
      node = image.current;
    node.src = url;
    return () => {
      node.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [file]);
  return <img ref={image} alt={t("Larawang idadagdag sa kahilingan")} />;
}
function PhotoGallery({ record, onRemove, busy }) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState(null);
  const images = Object.keys(record?.images || {});
  if (!images.length) return null;
  return (
    <ul className="request-photos">
      {images.map((imageId) => (
        <li key={imageId}>
          <PrivateImage
            requestId={record.id}
            imageId={imageId}
            alt={t("Larawan ng kahilingan")}
          />
          {onRemove &&
            (confirm === imageId ? (
              <div className="page-stack">
                <p>{t("Alisin nang permanente ang larawang ito?")}</p>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={async () => {
                    if (await onRemove(imageId)) setConfirm(null);
                  }}
                >
                  {t("Oo, alisin ang larawan")}
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setConfirm(null)}
                >
                  {t("Panatilihin ang larawan")}
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setConfirm(imageId)}
              >
                {t("Alisin ang larawan")}
              </Button>
            ))}
        </li>
      ))}
    </ul>
  );
}
function Summary({ record, privateDetails = false }) {
  const { t } = useTranslation();
  return (
    <div className="page-stack">
      <dl className="definition-list">
        <Definition label={t("Uri ng kahilingan")}>
          {t(categoryLabel(record.category))}
        </Definition>
        <Definition label={t("Lugar na makikita sa komunidad")}>
          {record.areaLabel}
        </Definition>
        <Definition label={t("Pabuya")}>
          {t(rewardLabels[record.rewardType])}
          {record.rewardDetails ? ` · ${record.rewardDetails}` : ""}
        </Definition>
      </dl>
      <section className="page-stack request-prose">
        <h2>{t("Kailangan na tulong")}</h2>
        <p>{record.description}</p>
      </section>
      {privateDetails && (
        <section className="request-private page-stack">
          <h2>{t("Pribadong detalye ng pagkikita")}</h2>
          <p className="muted">
            {t(
              "Makikita ito ng may-ari, awtorisadong tagasuri at napiling boluntaryong tumanggap ng gawain.",
            )}
          </p>
          {record.meetingDetails ? (
            <p className="request-prose">{record.meetingDetails}</p>
          ) : (
            <p>{t("Walang karagdagang tagubilin.")}</p>
          )}
          {record.location && (
            <p>{t("May pribadong pin ng lugar na kasama sa kahilingan.")}</p>
          )}
        </section>
      )}
      {(Object.keys(record.images || {}).length > 0 ||
        record.hasPrivatePhotos) && (
        <section className="page-stack">
          <h2>{t("Mga larawan")}</h2>
          {record.hasPrivatePhotos ? (
            <Notice title={t("Pribado ang mga larawan")}>
              <p>
                {t(
                  "Makikita lamang ng napiling boluntaryo ang mga larawan matapos niyang tanggapin ang gawain. Pagkatapos tanggapin, buksan ang detalye ng gawain upang makita ang mga ito.",
                )}
              </p>
            </Notice>
          ) : (
            <>
              <p className="muted">
                {t(
                  record.photoVisibility === "acceptedVolunteer"
                    ? "Pribado ang mga larawan sa may-ari at awtorisadong kawani. Makikita rin ito ng napiling boluntaryo matapos niyang tanggapin ang gawain."
                    : "Makikita ng mga beripikadong residente ang mga larawan kapag naaprubahan ang kahilingan.",
                )}
              </p>
              <PhotoGallery record={record} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
const emptyInput = {
  photoVisibility: "acceptedVolunteer",
  title: "",
  category: "cleanup",
  description: "",
  areaLabel: "",
  meetingDetails: "",
  location: null,
  rewardType: "none",
  rewardDetails: "",
};
function RequestEditor({ initial = null }) {
  const { t } = useTranslation(),
    navigate = useNavigate();
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      Object.keys(emptyInput).map((key) => [
        key,
        key === "photoVisibility" && initial
          ? (initial.photoVisibility ?? "community")
          : (initial?.[key] ?? emptyInput[key]),
      ]),
    ),
  );
  const [id, setId] = useState(initial?.id || null),
    [pending, setPending] = useState([]),
    [errors, setErrors] = useState(null),
    [busy, setBusy] = useState(false),
    [review, setReview] = useState(false),
    [saved, setSaved] = useState(false),
    [consent, setConsent] = useState(false),
    [showMap, setShowMap] = useState(Boolean(initial?.location));
  const resource = useRequestData("request", id),
    heading = useRef(null),
    inputFile = useRef(null),
    active = useRef(true);
  const record = resource.data || initial || { id, images: {} };
  const cleanup = record.pendingImageDeletion
    ? { requestId: id, imageId: record.pendingImageDeletion }
    : record.pendingImageUpload
      ? { requestId: id, imageId: record.pendingImageUpload, upload: true }
      : null;
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (review) heading.current?.focus();
  }, [review]);
  function change(e) {
    setValues((previous) => ({ ...previous, [e.target.name]: e.target.value }));
    setErrors(null);
    setSaved(false);
  }
  function validate() {
    const fields = validateRequest(values);
    const messages = Object.fromEntries(
      Object.keys(fields).map((key) => [key, errorLabels[key]]),
    );
    setErrors(Object.keys(messages).length ? messages : null);
    return !Object.keys(messages).length;
  }
  function selectFiles(event) {
    const files = [...event.target.files];
    event.target.value = "";
    if (
      files.length + pending.length + Object.keys(record.images || {}).length >
      3
    ) {
      setErrors({
        photos: "Hanggang tatlong larawan lamang ang maaaring idagdag.",
      });
      return;
    }
    if (
      files.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          !file.size ||
          file.size > 5 * 1024 * 1024,
      )
    ) {
      setErrors({
        photos: "Pumili ng JPEG, PNG o WebP na hanggang 5 MB bawat isa.",
      });
      return;
    }
    setErrors(null);
    setPending((previous) => [
      ...previous,
      ...files.map((file) => ({ key: crypto.randomUUID(), file })),
    ]);
    setSaved(false);
  }
  async function persist() {
    let target = id;
    if (!target) {
      target = await createRequestDraft(values);
      if (active.current) setId(target);
    } else await saveRequestDraft(target, values);
    for (const item of pending) {
      if (!active.current) break;
      const imageId = await beginRequestImageUpload(target);
      try {
        const uploaded = await uploadRequestImage(target, item.file, {
          imageId,
        });
        if (uploaded.imageId !== imageId)
          throw new Error("media_upload_mismatch");
        await addRequestImage(target, imageId, uploaded);
      } catch (error) {
        try {
          await removeRequestImage(target, imageId);
          await deleteRequestImage(target, imageId);
          await completeRequestImageDeletion(target, imageId);
        } catch {
          throw new Error("media_cleanup_failed");
        }
        throw error;
      }
      if (active.current)
        setPending((previous) =>
          previous.filter((file) => file.key !== item.key),
        );
    }
    return target;
  }
  async function save(forReview) {
    if (cleanup || !validate()) return;
    setBusy(true);
    setErrors(null);
    setSaved(false);
    try {
      await persist();
      if (active.current) {
        setSaved(true);
        setReview(forReview);
      }
    } catch (error) {
      if (active.current) setErrors({ form: formError(error) });
    } finally {
      if (active.current) setBusy(false);
    }
  }
  async function retryCleanup() {
    setBusy(true);
    setErrors(null);
    try {
      if (cleanup.upload)
        await removeRequestImage(cleanup.requestId, cleanup.imageId);
      await deleteRequestImage(cleanup.requestId, cleanup.imageId);
      await completeRequestImageDeletion(cleanup.requestId, cleanup.imageId);
      if (active.current) setErrors(null);
    } catch (error) {
      if (active.current) setErrors({ form: formError(error) });
    } finally {
      if (active.current) setBusy(false);
    }
  }
  async function removePhoto(imageId) {
    setBusy(true);
    setErrors(null);
    try {
      await removeRequestImage(id, imageId);
      await deleteRequestImage(id, imageId);
      await completeRequestImageDeletion(id, imageId);
      return true;
    } catch (error) {
      setErrors({ form: formError(error) });
      return false;
    } finally {
      if (active.current) setBusy(false);
    }
  }
  async function send(event) {
    event.preventDefault();
    if (!consent) {
      setErrors({ consent: "Kumpirmahin muna na nasuri mo ang mga detalye." });
      return;
    }
    setBusy(true);
    setErrors(null);
    try {
      await submitRequest(id);
      navigate(`/resident/requests/${id}`, { replace: true });
    } catch (error) {
      setErrors({ form: requestError(error) });
      setBusy(false);
    }
  }
  if (resource.data && !editable(resource.data))
    return (
      <div className="page-stack">
        <Notice title={t("Nagbago na ang kahilingan")}>
          <p>{t("Buksan ang kasalukuyang tala upang makita ang status.")}</p>
        </Notice>
        <ActionLink to={`/resident/requests/${id}`}>
          {t("Tingnan ang kahilingan")}
        </ActionLink>
      </div>
    );
  return (
    <div className="request-editor page-stack">
      <PageHeading
        title={
          review
            ? t("Suriin ang iyong kahilingan")
            : t(initial ? "Baguhin ang kahilingan" : "Humingi ng tulong")
        }
        backTo="/resident/requests"
        backLabel={t("Bumalik sa mga kahilingan")}
        description={t(
          "Malinaw na detalye ang makakatulong para makahanap ng angkop na tulong.",
        )}
      />
      <FormErrors errors={errors} />
      {cleanup && (!busy || !cleanup.upload) && (
        <Notice
          title={t(
            cleanup.upload
              ? "May nakabinbing pag-upload"
              : "Hindi pa natatapos ang pag-alis ng larawan",
          )}
          tone="warning"
        >
          <p>
            {t(
              cleanup.upload
                ? "Hintaying matapos ang pag-upload sa ibang tab o device. Kung hindi na ito tumutuloy, alisin ito at subukang muli."
                : "Subukang alisin muli ang larawan bago mag-save o magsumite.",
            )}
          </p>
          <Button loading={busy} onClick={retryCleanup}>
            {t(
              cleanup.upload
                ? "Alisin ang nakabinbing pag-upload"
                : "Subukang alisin muli ang larawan",
            )}
          </Button>
        </Notice>
      )}
      {saved && !review && (
        <p className="request-success" role="status">
          {t("Na-save ang draft.")}
        </p>
      )}
      {record.review?.reason && (
        <Notice title={t("Paliwanag ng kawani")} tone="warning">
          <p>{record.review.reason}</p>
        </Notice>
      )}
      {review ? (
        <form className="page-stack" onSubmit={send} noValidate>
          <h2 tabIndex="-1" ref={heading}>
            {values.title}
          </h2>
          <Summary record={{ ...record, ...values, id }} privateDetails />
          <Notice title={t("Ano ang makikita sa komunidad?")}>
            <p>
              {t(
                "Kapag naaprubahan, makikita ang pamagat, paglalarawan, lugar at pabuya. Hindi kasama ang pribadong tagubilin o eksaktong pin.",
              )}
            </p>
            <p>
              {t(
                values.photoVisibility === "acceptedVolunteer"
                  ? "Ang mga larawan ay pribado hanggang tanggapin ng napiling boluntaryo ang gawain. Makikita pa rin ito ng may-ari at awtorisadong kawani."
                  : "Ang mga larawan ay makikita ng mga beripikadong residente kapag naaprubahan ang kahilingan.",
              )}
            </p>
          </Notice>
          <label className="checkbox-row" htmlFor="consent">
            <input
              id="consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={busy}
            />
            {t(
              "Nasuri ko ang mga detalye at nauunawaan ko kung ano ang makikita ng komunidad.",
            )}
          </label>
          <div className="request-actions">
            <Button type="submit" loading={busy}>
              {t("Isumite para sa pagsusuri")}
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setReview(false)}
            >
              {t("Bumalik sa pag-edit")}
            </Button>
          </div>
        </form>
      ) : (
        <form
          className="page-stack"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            save(true);
          }}
        >
          <fieldset
            className="request-fieldset"
            disabled={busy || Boolean(cleanup)}
          >
            <legend>{t("Tungkol sa kahilingan")}</legend>
            <TextField
              id="title"
              name="title"
              label={t("Pamagat ng kahilingan")}
              value={values.title}
              onChange={change}
              required
              maxLength={100}
              error={errors?.title}
              hint={t(
                "Maikli at tiyak, halimbawa: Tulong sa paglilinis ng daanan.",
              )}
            />
            <SelectField
              id="category"
              name="category"
              label={t("Uri ng kahilingan")}
              value={values.category}
              onChange={change}
            >
              {REQUEST_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.label)}
                </option>
              ))}
            </SelectField>
            <TextField
              id="description"
              name="description"
              label={t("Anong tulong ang kailangan mo?")}
              value={values.description}
              onChange={change}
              multiline
              rows={5}
              required
              maxLength={2000}
              error={errors?.description}
              hint={t(
                "Ilarawan ang gawain at kailan kailangan ang tulong. Huwag isama ang ID number, telepono o eksaktong tirahan.",
              )}
            />
          </fieldset>
          <fieldset
            className="request-fieldset"
            disabled={busy || Boolean(cleanup)}
          >
            <legend>{t("Saan kailangan ang tulong?")}</legend>
            <TextField
              id="areaLabel"
              name="areaLabel"
              label={t("Lugar o palatandaan para sa komunidad")}
              value={values.areaLabel}
              onChange={change}
              required
              maxLength={120}
              error={errors?.areaLabel}
              hint={t(
                "Kalye, purok o pampublikong palatandaan lamang; huwag ilagay ang house number.",
              )}
            />
            <TextField
              id="meetingDetails"
              name="meetingDetails"
              label={t("Pribadong tagubilin sa pagkikita")}
              value={values.meetingDetails}
              onChange={change}
              multiline
              rows={3}
              maxLength={300}
              error={errors?.meetingDetails}
              hint={t(
                "Opsyonal. Makikita ito ng may-ari, awtorisadong kawani at napiling boluntaryong tumanggap ng gawain.",
              )}
            />
            <Button
              variant="secondary"
              aria-expanded={showMap}
              aria-controls="location-picker"
              onClick={() => setShowMap((value) => !value)}
            >
              {t(showMap ? "Itago ang mapa" : "Magdagdag ng pin sa mapa")}
            </Button>
            {showMap && (
              <div id="location-picker">
                <Suspense
                  fallback={<p role="status">{t("Binubuksan ang mapa…")}</p>}
                >
                  <LocationPicker
                    value={values.location}
                    disabled={busy}
                    onChange={(location) => {
                      setValues((previous) => ({ ...previous, location }));
                      setSaved(false);
                    }}
                  />
                </Suspense>
              </div>
            )}
          </fieldset>
          <fieldset
            className="request-fieldset"
            disabled={busy || Boolean(cleanup)}
          >
            <legend>{t("Mga larawan (opsyonal)")}</legend>
            <SelectField
              label={t("Sino ang makakakita ng mga larawan?")}
              name="photoVisibility"
              value={values.photoVisibility}
              onChange={change}
              aria-describedby="photo-visibility-help"
            >
              <option value="acceptedVolunteer">
                {t("Kapag tinanggap ang gawain")}
              </option>
              <option value="community">
                {t("Mga beripikadong residente")}
              </option>
            </SelectField>
            <p id="photo-visibility-help" className="muted">
              {t(
                values.photoVisibility === "acceptedVolunteer"
                  ? "Pribado muna ang mga larawan. Makikita ito ng napiling boluntaryo matapos niyang tanggapin ang gawain. Laging may access ang may-ari at awtorisadong kawani."
                  : "Makikita ng mga beripikadong residente ang mga larawan kapag naaprubahan ang kahilingan. Piliin ito kung makatutulong ang larawan sa pagpapasya kung magboboluntaryo.",
              )}
            </p>
            <p className="muted">
              {t(
                "Hanggang 3 larawan, tig-5 MB. Huwag magsama ng ID, pribadong dokumento o sensitibong detalye.",
              )}
            </p>
            <label className="field" htmlFor="photos">
              {t("Pumili ng mga larawan")}
              <input
                ref={inputFile}
                id="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={selectFiles}
                disabled={
                  busy ||
                  pending.length + Object.keys(record.images || {}).length >= 3
                }
              />
            </label>
            <PhotoGallery record={record} onRemove={removePhoto} busy={busy} />
            {pending.length > 0 && (
              <ul className="request-photos">
                {pending.map((item) => (
                  <li key={item.key}>
                    <LocalPhoto file={item.file} />
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        setPending((previous) =>
                          previous.filter((file) => file.key !== item.key),
                        )
                      }
                    >
                      {t("Alisin ang napiling larawan")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="small muted">
              {t(
                "Maa-upload ang mga napiling larawan kapag nag-save o nagsuri ka ng draft.",
              )}
            </p>
          </fieldset>
          <fieldset
            className="request-fieldset"
            disabled={busy || Boolean(cleanup)}
          >
            <legend>{t("Pabuya (opsyonal)")}</legend>
            <SelectField
              id="rewardType"
              name="rewardType"
              label={t("Uri ng pabuya")}
              value={values.rewardType}
              onChange={change}
            >
              {Object.entries(rewardLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </SelectField>
            {values.rewardType !== "none" && (
              <TextField
                id="rewardDetails"
                name="rewardDetails"
                label={t("Detalye ng pabuya")}
                value={values.rewardDetails}
                onChange={change}
                maxLength={200}
                required
                error={errors?.rewardDetails}
              />
            )}
            <p className="small muted">
              {t(
                "Kusang ibinibigay ang pabuya. Walang online na bayad o paglipat ng pera sa app.",
              )}
            </p>
          </fieldset>
          <div className="request-actions">
            <Button type="submit" loading={busy} disabled={Boolean(cleanup)}>
              {t("Suriin ang kahilingan")}
            </Button>
            <Button
              variant="secondary"
              disabled={busy || Boolean(cleanup)}
              onClick={() => save(false)}
            >
              {t("I-save ang draft")}
            </Button>
          </div>
          {busy && (
            <p role="status">
              {t(
                "Hinihintay ang kumpirmasyon. Panatilihing bukas ang pahina habang nagsa-save.",
              )}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
export function NewHelpRequest() {
  return <RequestEditor />;
}
export function EditHelpRequest() {
  const { requestId } = useParams(),
    resource = useRequestData("request", requestId),
    { t } = useTranslation();
  return (
    <Resource resource={resource}>
      {resource.data && editable(resource.data) ? (
        <RequestEditor key={requestId} initial={resource.data} />
      ) : (
        <EmptyState
          title={t("Hindi maaaring i-edit ang kahilingan")}
          action={
            <ActionLink to="/resident/requests">
              {t("Bumalik sa mga kahilingan")}
            </ActionLink>
          }
        >
          <p>{t("Maaaring naisumite o nabago na ang status nito.")}</p>
        </EmptyState>
      )}
    </Resource>
  );
}
export function HelpRequestDetail({ board = false }) {
  const { requestId } = useParams(),
    { t } = useTranslation(),
    navigate = useNavigate();
  const resource = useRequestData(board ? "boardItem" : "request", requestId);
  const [confirm, setConfirm] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const record = resource.data;
  const { user } = useAuth();
  const owned = record?.ownerUid === user?.uid;
  async function perform() {
    setBusy(true);
    setError(null);
    try {
      if (confirm === "delete") {
        await deleteRequestDraft(requestId);
        navigate("/resident/requests");
      } else {
        await cancelRequest(requestId);
        setConfirm(null);
      }
    } catch (e) {
      setError(requestError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={record?.title || t("Detalye ng kahilingan")}
        backTo={board ? "/resident/community" : "/resident/requests"}
        backLabel={t("Bumalik sa listahan")}
      />
      <Resource resource={resource}>
        {record ? (
          <>
            <div className="request-list__meta">
              <Status code={record.status} />
              <DateText value={record.updatedAt || record.publishedAt} />
            </div>
            {record.status === "submitted" && (
              <Notice title={t("Naghihintay ng pagsusuri ng kawani")}>
                <p>
                  {t(
                    "Lalabas sa komunidad ang kahilingan kapag naaprubahan. Makikita rito ang resulta ng pagsusuri.",
                  )}
                </p>
              </Notice>
            )}
            {record.review?.reason && (
              <Notice
                title={t("Paliwanag ng kawani")}
                tone={record.status === "open" ? "info" : "warning"}
              >
                <p>{record.review.reason}</p>
              </Notice>
            )}
            <Summary record={record} privateDetails={!board} />
            {(record.status === "open" || record.status === "cancelled") && (
              <VolunteerPanel record={record} />
            )}
            {!board && owned && editable(record) && (
              <ActionLink
                variant="primary"
                to={`/resident/requests/${requestId}/edit`}
              >
                {t("Baguhin ang kahilingan")}
              </ActionLink>
            )}
            {!board && error && (
              <Notice
                title={t("Hindi natuloy ang pagbabago")}
                tone="warning"
                role="alert"
              >
                <p>{t(error)}</p>
              </Notice>
            )}
            {!board && owned && confirm && (
              <section
                className="request-confirm page-stack"
                aria-label={t("Kumpirmahin ang pagbabago")}
              >
                <h2>
                  {t(
                    confirm === "delete"
                      ? "Burahin ang draft?"
                      : "Kanselahin ang kahilingan?",
                  )}
                </h2>
                <p>
                  {t(
                    confirm === "delete"
                      ? "Mawawala nang permanente ang naka-save na draft."
                      : "Aalisin ang kahilingan sa community board. Mananatili ito sa mga tala mo.",
                  )}
                </p>
                <div className="request-actions">
                  <Button loading={busy} onClick={perform}>
                    {t(
                      confirm === "delete"
                        ? "Oo, burahin ang draft"
                        : "Oo, kanselahin ang kahilingan",
                    )}
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
            {!board && owned && !confirm && record.status === "open" && (
              <Button variant="secondary" onClick={() => setConfirm("cancel")}>
                {t("Kanselahin ang kahilingan")}
              </Button>
            )}
            {!board && owned && !confirm && record.status === "draft" && (
              <>
                <Button
                  variant="secondary"
                  disabled={
                    Object.keys(record.images || {}).length > 0 ||
                    Boolean(
                      record.pendingImageDeletion || record.pendingImageUpload,
                    )
                  }
                  onClick={() => setConfirm("delete")}
                >
                  {t("Burahin ang draft")}
                </Button>
                {Object.keys(record.images || {}).length > 0 && (
                  <p className="muted">
                    {t(
                      "Alisin muna ang mga larawan sa pag-edit bago burahin ang draft.",
                    )}
                  </p>
                )}
              </>
            )}
          </>
        ) : board ? (
          <ClosedVolunteerRequest requestId={requestId} />
        ) : (
          <EmptyState title={t("Hindi makita ang kahilingan")}>
            <p>
              {t("Maaaring hindi na ito bukas o wala kang access sa tala.")}
            </p>
          </EmptyState>
        )}
      </Resource>
    </div>
  );
}
export function CommunityBoard() {
  const { t } = useTranslation(),
    resource = useRequestData("board");
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("all"),
    [view, setView] = useState("list"),
    [selected, setSelected] = useState(null);
  const visible = (resource.data || []).filter(
    (item) =>
      (category === "all" || item.category === category) &&
      `${item.title} ${item.description} ${item.areaLabel}`
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Tulong sa komunidad")}
        description={t(
          "Mga naaprubahang kahilingan sa ating barangay. Hanapin ang lugar at uri ng tulong na kaya mong ibigay.",
        )}
      />
      <div className="request-filters">
        <TextField
          id="request-search"
          type="search"
          label={t("Maghanap sa mga nakalistang kahilingan")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SelectField
          label={t("Uri ng tulong")}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">{t("Lahat ng uri")}</option>
          {REQUEST_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {t(item.label)}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="request-board-toolbar">
        <p className="muted" role="status">
          {t("{{count}} kahilingan", { count: visible.length })}
        </p>
        <div
          className="request-view-switch"
          role="group"
          aria-label={t("Paraan ng pagtingin")}
        >
          <Button
            variant="secondary"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            {t("Listahan")}
          </Button>
          <Button
            variant="secondary"
            aria-pressed={view === "map"}
            onClick={() => setView("map")}
          >
            {t("Mapa at listahan")}
          </Button>
        </div>
      </div>
      <Resource resource={resource}>
        <div className={view === "map" ? "request-board-grid" : ""}>
          {view === "map" && (
            <Suspense
              fallback={<p role="status">{t("Binubuksan ang mapa…")}</p>}
            >
              <CommunityMap
                items={visible}
                selectedId={selected}
                onSelect={setSelected}
              />
            </Suspense>
          )}
          <section className="page-stack">
            <h2>{t("Mga kamakailang kahilingan")}</h2>
            {visible.length ? (
              <RequestList
                items={visible}
                board
                selectedId={selected}
                onSelect={view === "map" ? setSelected : undefined}
              />
            ) : (
              <EmptyState title={t("Walang tumugma sa paghahanap")}>
                <p>
                  {t(
                    "Subukang baguhin ang salita o uri ng tulong. Dito lalabas ang mga naaprubahang kahilingan.",
                  )}
                </p>
              </EmptyState>
            )}
            <p className="small muted">
              {t(
                "Hanggang 100 pinakabagong inilathalang kahilingan ang nakalista rito.",
              )}
            </p>
          </section>
        </div>
      </Resource>
    </div>
  );
}
export function RequestReviewQueue() {
  const { t } = useTranslation(),
    resource = useRequestData("queue");
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Pagsusuri ng mga kahilingan")}
        description={t(
          "Suriin ang kaligtasan, kalinawan at mga larawan bago ilathala.",
        )}
        backTo="/staff"
      />
      <Resource resource={resource}>
        {resource.data?.length ? (
          <div className="link-list">
            {resource.data.map((record) => (
              <RowLink
                key={record.id}
                title={record.title}
                description={`${t(categoryLabel(record.category))} · ${record.areaLabel}`}
                to={`/staff/moderation/${record.id}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState title={t("Walang naghihintay na kahilingan")}>
            <p>
              {t("Babalik dito ang mga bagong isinumite para sa pagsusuri.")}
            </p>
          </EmptyState>
        )}
      </Resource>
    </div>
  );
}
function ReviewDecision({ record, onComplete }) {
  const { t } = useTranslation();
  const [decision, setDecision] = useState("open"),
    [reason, setReason] = useState(""),
    [errors, setErrors] = useState(null),
    [busy, setBusy] = useState(false);
  const decisions = {
    open: "Aprubahan at ilathala",
    needsChanges: "Ibalik para baguhin",
    rejected: "Huwag aprubahan",
  };
  async function submit(event) {
    event.preventDefault();
    if (reason.trim().length < 10) {
      setErrors({
        reason:
          "Magbigay ng malinaw na paliwanag na may 10 hanggang 500 character.",
      });
      return;
    }
    setErrors(null);
    setBusy(true);
    try {
      await reviewRequest(record.id, {
        decision,
        reason,
        expectedUpdatedAt: record.updatedAt,
      });
      onComplete(decision);
    } catch (error) {
      setErrors({ form: requestError(error) });
      setBusy(false);
    }
  }
  return (
    <form className="page-stack request-review" onSubmit={submit} noValidate>
      <h2>{t("Desisyon sa pagsusuri")}</h2>
      <p>
        {t(
          "Tiyaking walang sensitibong dokumento, ID number o pribadong detalye sa pampublikong teksto at mga larawan.",
        )}
      </p>
      <FormErrors errors={errors} />
      <SelectField
        label={t("Desisyon")}
        value={decision}
        onChange={(e) => setDecision(e.target.value)}
        disabled={busy}
      >
        {Object.entries(decisions).map(([value, label]) => (
          <option key={value} value={value}>
            {t(label)}
          </option>
        ))}
      </SelectField>
      <TextField
        id="reason"
        label={t("Paliwanag sa pagsusuri")}
        multiline
        rows={4}
        maxLength={500}
        required
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={errors?.reason}
        disabled={busy}
        hint={t("Makikita ng humiling ang paliwanag na ito.")}
      />
      <Button type="submit" loading={busy}>
        {t(decisions[decision])}
      </Button>
    </form>
  );
}
export function RequestReviewPage() {
  const { requestId } = useParams(),
    { t } = useTranslation(),
    { user } = useAuth(),
    resource = useRequestData("request", requestId);
  const [done, setDone] = useState(null);
  const record = resource.data;
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={record?.title || t("Suriin ang kahilingan")}
        backTo="/staff/moderation"
        backLabel={t("Bumalik sa mga susuriin")}
      />
      <Resource resource={resource}>
        {record ? (
          <>
            <Status code={record.status} />
            <Summary record={record} privateDetails />
            {done && (
              <p role="status" className="request-success">
                {t(
                  done === "open"
                    ? "Nailathala na sa community board."
                    : "Naipadala na ang resulta ng pagsusuri.",
                )}
              </p>
            )}
            {record.status === "submitted" && record.ownerUid !== user.uid ? (
              <ReviewDecision
                key={`${record.id}-${record.updatedAt}`}
                record={record}
                onComplete={setDone}
              />
            ) : (
              !done && (
                <Notice title={t("Hindi maaaring mag-review ngayon")}>
                  <p>
                    {t(
                      "Maaaring nasuri na ang kahilingan o sarili mong tala ito.",
                    )}
                  </p>
                </Notice>
              )
            )}
          </>
        ) : (
          <EmptyState title={t("Hindi makita ang kahilingan")}>
            <p>{t("Suriin ang link at ang iyong access.")}</p>
          </EmptyState>
        )}
      </Resource>
    </div>
  );
}
export function RequestUpdatesPage() {
  const { t } = useTranslation(),
    resource = useRequestData("own");
  const items = (resource.data || [])
    .filter((item) => item.review)
    .sort((a, b) => b.review.reviewedAt - a.review.reviewedAt);
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Mga abiso")}
        description={t(
          "Pinakabagong resulta ng pagsusuri sa mga kahilingan mo.",
        )}
      />
      <Resource resource={resource}>
        {items.length ? (
          <RequestList items={items} />
        ) : (
          <EmptyState title={t("Wala pang bagong resulta")}>
            <p>
              {t(
                "Makikita rito ang paliwanag kapag nasuri na ng kawani ang kahilingan mo.",
              )}
            </p>
          </EmptyState>
        )}
      </Resource>
    </div>
  );
}
