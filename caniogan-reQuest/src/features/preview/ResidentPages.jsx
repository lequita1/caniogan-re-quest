import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router";
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
import { documents, requests } from "./sampleData";
import { useAuth } from "../auth/authContext";

export function ResidentHome() {
  const { t } = useTranslation();
  const { account } = useAuth();
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Magandang araw, {{name}}.", {
          name: account?.profile?.displayName || "ka-barangay",
        })}
        description={t("Ano ang kailangan mo ngayon?")}
      />
      <Notice
        tone="warning"
        title={t("May kailangan kang kumpirmahin")}
        action={
          <ActionLink to="/resident/requests/completion">
            {"Tingnan ang gawain"}{" "}
          </ActionLink>
        }
      >
        <p>
          {t(
            "Natapos na ni Sam ang gawain. Suriin ang resulta bago kumpirmahin.",
          )}{" "}
        </p>
      </Notice>
      <div className="home-grid">
        <section className="service-section" aria-labelledby="services-heading">
          <h2 id="services-heading">{t("Mga serbisyo")}</h2>
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
        <section
          className="surface-panel recent-work"
          aria-labelledby="recent-heading"
        >
          <h2 id="recent-heading">{t("Mga kahilingan mo")}</h2>
          <div className="recent-item">
            <dl>
              <Definition label={t("Paglilinis ng bakuran")}>
                {t("2 boluntaryo ang nag-apply")}{" "}
              </Definition>
            </dl>
            <ActionLink to="/resident/requests/cleanup">
              {t("Tingnan ang mga aplikante")}{" "}
            </ActionLink>
          </div>
          <div className="recent-item">
            <dl>
              <Definition label={t("Certificate of Residency")}>
                {t("May kailangang baguhin")}{" "}
              </Definition>
            </dl>
            <ActionLink to="/resident/requests/residency">
              {t("Basahin ang paliwanag")}{" "}
            </ActionLink>
          </div>
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

export function RequestsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");
  const visible = requests.filter(
    (request) => filter === "all" || request.kind === filter,
  );
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Mga kahilingan")}
        description={t("Tingnan ang kalagayan at susunod mong gagawin.")}
      />
      <div className="page-toolbar">
        <SelectField
          label={t("Ipakita")}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">{t("Lahat ng kahilingan")}</option>
          <option value="Tulong sa komunidad">
            {t("Tulong sa komunidad")}
          </option>
          <option value="Dokumento">{t("Dokumento")}</option>
          <option value="Natapos na">{t("Natapos na")}</option>
        </SelectField>
        <ActionLink variant="primary" to="/resident/requests/new">
          {t("Bagong kahilingan")}{" "}
        </ActionLink>
      </div>
      {visible.length ? (
        <div className="link-list">
          {visible.map((request) => (
            <RowLink
              key={request.id}
              title={t(request.title)}
              description={`${t(request.status)} · ${t(request.next)}`}
              to={`/resident/requests/${request.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("Wala pang natapos na kahilingan")}
          action={
            <Button variant="secondary" onClick={() => setFilter("all")}>
              {t("Tingnan ang lahat")}
            </Button>
          }
        >
          <p>
            {t(
              "Dito lalabas ang mga kahilingan kapag nakumpleto na ang proseso.",
            )}{" "}
          </p>
        </EmptyState>
      )}
    </div>
  );
}

export function RequestDetail() {
  const { t } = useTranslation();
  const { requestId } = useParams();
  const request =
    requestId === "completion"
      ? {
          id: "completion",
          title: "Paglilinis ng bakuran",
          reference: "ASG-2026-004",
          status: "Tapos na ayon sa boluntaryo",
          next: "Kailangan ang kumpirmasyon ng requester",
        }
      : requests.find((item) => item.id === requestId);
  if (!request)
    return (
      <div className="task-column page-stack">
        <PageHeading
          title={t("Hindi makita ang kahilingan")}
          backTo="/resident/requests"
          backLabel={t("Bumalik sa mga kahilingan")}
        />
        <EmptyState title={t("Suriin ang link")}>
          <p>{t("Piliin muli ang kahilingan mula sa listahan.")}</p>
        </EmptyState>
      </div>
    );
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={t(request.title)}
        backTo="/resident/requests"
        backLabel={t("Bumalik sa mga kahilingan")}
      />
      <dl className="definition-list">
        <Definition label={t("Reference")}>{request.reference}</Definition>
        <Definition label={t("Kalagayan")}>{t(request.status)}</Definition>
      </dl>
      {request.id === "residency" ? (
        <Notice title={t("Paliwanag ng kawani")} tone="warning">
          <p>{t("“Pakilinaw kung para sa anong paaralan ang enrollment.”")}</p>
        </Notice>
      ) : (
        <Notice title={t(request.next)}>
          <p>
            {request.id === "clearance"
              ? t(
                  "Personal ang pagkuha. Dalhin ang orihinal na ID at ang application reference.",
                )
              : t(
                  "Tingnan ang status ng kahilingan at ang susunod na hakbang.",
                )}
          </p>
        </Notice>
      )}
      <p className="muted">
        {t(
          "Para sa tulong tungkol sa kahilingang ito, makipag-ugnayan sa tanggapan ng barangay.",
        )}{" "}
      </p>
      <ActionLink to="/resident/help">{t("Kailangan ko ng tulong")}</ActionLink>
    </div>
  );
}

export function NewRequestPage() {
  const { t } = useTranslation();
  const [values, setValues] = useState({
    title: "",
    category: "Paglilinis ng komunidad",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [review, setReview] = useState(false);
  const errorSummary = useRef(null);
  const reviewHeading = useRef(null);
  function change(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }
  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!values.title.trim())
      nextErrors.title = "Ilagay ang pamagat ng kahilingan.";
    if (!values.description.trim())
      nextErrors.description = "Ilarawan kung anong tulong ang kailangan.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length)
      requestAnimationFrame(() => errorSummary.current?.focus());
    else {
      setReview(true);
      requestAnimationFrame(() => reviewHeading.current?.focus());
    }
  }
  return (
    <div className="task-column page-stack">
      <PageHeading title={t("Humingi ng tulong")} backTo="/resident" />
      <p className="muted">
        {t(
          "Ilarawan ang kailangan mong tulong. Suriin ang mga detalye bago magpatuloy.",
        )}{" "}
      </p>
      {review ? (
        <section className="page-stack" aria-labelledby="review-heading">
          <h2 id="review-heading" tabIndex="-1" ref={reviewHeading}>
            {t("Suriin ang mga detalye")}{" "}
          </h2>
          <dl className="definition-list">
            <Definition label={t("Pamagat")}>{values.title}</Definition>
            <Definition label={t("Kategorya")}>{t(values.category)}</Definition>
            <Definition label={t("Anong tulong ang kailangan?")}>
              {values.description}
            </Definition>
          </dl>
          <Notice title={t("Hindi pa ito naipapadala")}>
            <p>
              {t(
                "Hindi pa available ang online na pagsusumite. Maaari mong baguhin ang mga detalye o humingi ng tulong sa tanggapan ng barangay.",
              )}{" "}
            </p>
          </Notice>
          <div className="action-stack">
            <Button disabled>{t("Isumite ang kahilingan")}</Button>
            <Button variant="secondary" onClick={() => setReview(false)}>
              {t("Baguhin ang detalye")}{" "}
            </Button>
          </div>
        </section>
      ) : (
        <form className="page-stack" noValidate onSubmit={handleSubmit}>
          {Object.keys(errors).length > 0 && (
            <div
              className="error-summary"
              role="alert"
              ref={errorSummary}
              tabIndex="-1"
            >
              <h2>{t("May kailangang ayusin")}</h2>
              <ul>
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>
                    <a href={`#request-${key}`}>{t(message)}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <TextField
            id="request-title"
            label={t("Pamagat")}
            name="title"
            value={values.title}
            onChange={change}
            hint={t("Maikli at malinaw na pamagat.")}
            error={errors.title}
            required
            maxLength={100}
            autoComplete="off"
          />
          <SelectField
            label={t("Kategorya")}
            name="category"
            value={values.category}
            onChange={change}
          >
            <option value="Paglilinis ng komunidad">
              {t("Paglilinis ng komunidad")}
            </option>
            <option value="Lost & Found">{t("Lost & Found")}</option>
            <option value="Praktikal na tulong">
              {t("Praktikal na tulong")}
            </option>
            <option value="Aktibidad sa komunidad">
              {t("Aktibidad sa komunidad")}
            </option>
          </SelectField>
          <TextField
            id="request-description"
            label={t("Anong tulong ang kailangan?")}
            name="description"
            value={values.description}
            onChange={change}
            multiline
            rows={5}
            hint={t(
              "Huwag ilagay dito ang numero ng ID o pribadong contact details.",
            )}
            error={errors.description}
            required
            maxLength={2000}
          />
          <Button type="submit">{t("Suriin ang mga detalye")}</Button>
        </form>
      )}
    </div>
  );
}

export function DocumentsPage() {
  const { t } = useTranslation();
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Mga dokumento")}
        description={t(
          "Aplikasyon para sa sarili mo. Personal ang pagkuha sa barangay.",
        )}
      />
      <div className="link-list">
        {documents.map(([id, title]) => (
          <RowLink
            key={id}
            title={title}
            description={t(
              "Tingnan ang mga kinakailangan at paraan ng pagkuha",
            )}
            to={`/resident/documents/${id}`}
          />
        ))}
      </div>
      <Notice
        title={t("Kailangan ng tulong sa pagpili?")}
        action={
          <ActionLink to="/resident/help">{"Tingnan ang gabay"}</ActionLink>
        }
      >
        <p>{t("Puwedeng magpatulong sa barangay desk.")}</p>
      </Notice>
    </div>
  );
}

export function DocumentDetail() {
  const { t } = useTranslation();
  const { documentId } = useParams();
  const document = documents.find(([id]) => id === documentId);
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={document?.[1] || t("Hindi makita ang dokumento")}
        backTo="/resident/documents"
        backLabel={t("Bumalik sa mga dokumento")}
      />
      <Notice title={t("Kumpirmahin muna ang requirements")}>
        <p>
          {t(
            "Makipag-ugnayan sa tanggapan ng barangay para sa mga kinakailangan, kwalipikasyon, bayarin at oras ng pagproseso.",
          )}{" "}
        </p>
      </Notice>
      <ol className="steps">
        <li>
          <h2>{t("Ihanda ang impormasyon")}</h2>
          <p>{t("Sarili mong detalye at layunin.")}</p>
        </li>
        <li>
          <h2>{t("Ipakita ang kinakailangang patunay")}</h2>
          <p>
            {t(
              "Kumpirmahin sa tanggapan ng barangay ang mga dokumentong kailangang dalhin.",
            )}
          </p>
        </li>
        <li>
          <h2>{t("Kunin nang personal")}</h2>
          <p>{t("Ipakita ang orihinal na ID sa barangay.")}</p>
        </li>
      </ol>
      <ActionLink to="/resident/help">
        {t("Magpatulong sa barangay desk")}
      </ActionLink>
    </div>
  );
}

export function EventsPage() {
  const { t } = useTranslation();
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Mga aktibidad")}
        description={t("Mga programa at aktibidad sa ating barangay.")}
      />
      <div className="link-list">
        <RowLink
          title={t("Paglilinis sa komunidad")}
          description={t("24 Oktubre · 8:00 AM · May bakanteng puwesto")}
          to="/resident/events/cleanup"
        />
        <RowLink
          title={t("Fun run sa barangay")}
          description={t("Puno na ang mga puwesto")}
          to="/resident/events/fun-run"
        />
      </div>
      <Notice title={t("Para sa kabataang kalahok")}>
        <p>
          {t(
            "Kumpirmahin sa tagapag-organisa ang itinakdang edad, pahintulot ng magulang at pangangasiwa sa mga kabataang kalahok.",
          )}{" "}
        </p>
      </Notice>
    </div>
  );
}

export function EventDetail() {
  const { t } = useTranslation();
  const { eventId } = useParams();
  if (!["cleanup", "fun-run"].includes(eventId)) {
    return (
      <div className="task-column page-stack">
        <PageHeading title={t("Hindi makita ang aktibidad")} />
        <EmptyState
          title={t("Maaaring nagbago ang link")}
          action={
            <ActionLink to="/resident/events">
              {"Bumalik sa mga aktibidad"}{" "}
            </ActionLink>
          }
        >
          <p>{t("Pumili ng aktibidad mula sa listahan para magpatuloy.")}</p>
        </EmptyState>
      </div>
    );
  }
  const full = eventId === "fun-run";
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={full ? t("Fun run sa barangay") : t("Paglilinis sa komunidad")}
        backTo="/resident/events"
        backLabel={t("Bumalik sa mga aktibidad")}
      />
      <Notice
        title={
          full
            ? t("Wala nang puwestong available")
            : t("Pakikilahok sa aktibidad")
        }
        tone={full ? "warning" : "info"}
      >
        <p>
          {full
            ? t("Tingnan ang ibang aktibidad na may puwesto.")
            : t(
                "Makipag-ugnayan sa tagapag-organisa para sa pagpaparehistro at iba pang detalye.",
              )}
        </p>
      </Notice>
      {!full && (
        <dl className="definition-list">
          <Definition label={t("Kailan")}>
            {t("24 Oktubre 2026 · 8:00–10:00 AM")}{" "}
          </Definition>
          <Definition label={t("Saan")}>
            {t("Kumpirmahin ang lugar sa tagapag-organisa")}
          </Definition>
          <Definition label={t("Mga puwesto")}>
            {t("18 sa 30 puwesto ang nakalaan")}{" "}
          </Definition>
        </dl>
      )}
      <ActionLink to="/resident/events">
        {t("Tingnan ang ibang aktibidad")}
      </ActionLink>
    </div>
  );
}

export function CommunityPage() {
  const { t } = useTranslation();
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Tulong sa komunidad")}
        description={t("Mga aprubadong kahilingan ng mga residente.")}
      />
      <div className="link-list">
        <RowLink
          title={t("Tulong sa paglilinis ng bakuran")}
          description={t("Paglilinis · 1 bakanteng puwesto · 25 puntos")}
          to="/resident/requests/cleanup"
        />
      </div>
      <Notice
        title={t("May pangangailangan ka rin?")}
        action={
          <ActionLink to="/resident/requests/new">
            {"Humingi ng tulong"}
          </ActionLink>
        }
      >
        <p>
          {t("Maaaring magsumite ng sariling kahilingan para sa pagsusuri.")}
        </p>
      </Notice>
    </div>
  );
}

export function MessagesPage() {
  const { t } = useTranslation();
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={t("Mga mensahe")}
        description={t("Mga usapan tungkol sa iyong mga kahilingan at gawain.")}
      />
      <h2>{t("Sam · Paglilinis ng bakuran")}</h2>
      <div className="message message--received">
        <p className="small muted">{t("Sam · 9:10 AM")}</p>
        <p>{t("Maaari ba sa Sabado, alas-otso?")}</p>
      </div>
      <div className="message message--sent">
        <p className="small muted">{t("Ikaw · 9:12 AM")}</p>
        <p>{t("Oo, maghahanda ako ng mga sako.")}</p>
      </div>
      <Notice title={t("Sarado na ang usapan")}>
        <p>
          {t(
            "Maaari mo pa ring basahin ang mga mensahe. Hindi na maaaring magpadala ng bagong mensahe sa saradong usapan.",
          )}{" "}
        </p>
      </Notice>
      <ActionLink to="/resident/help">
        {t("Gabay tungkol sa mga usapan")}
      </ActionLink>
    </div>
  );
}

export function NotificationsPage() {
  const { t } = useTranslation();
  return (
    <div className="page-stack">
      <PageHeading
        title={t("Mga abiso")}
        description={t(
          "Mga bagong impormasyon tungkol sa iyong mga kahilingan.",
        )}
      />
      <div className="link-list">
        <RowLink
          title={t("May kailangang baguhin")}
          description={t("Certificate of Residency · Basahin ang paliwanag")}
          to="/resident/requests/residency"
        />
        <RowLink
          title={t("Kumpirmahin ang tulong")}
          description={t("Tapos na ayon sa boluntaryo")}
          to="/resident/requests/completion"
        />
        <RowLink
          title={t("Maaari nang kunin")}
          description={t("Barangay Clearance · Ihanda ang ID")}
          to="/resident/requests/clearance"
        />
      </div>
    </div>
  );
}

export function HelpPage({ home = "/resident" }) {
  const { t } = useTranslation();
  return (
    <div className="task-column page-stack">
      <PageHeading title={t("Gabay at tulong")} backTo={home} />
      <h2>{t("Puwede kang magpatulong.")}</h2>
      <p>
        {t(
          "Sa barangay desk, maaaring tumulong ang kawani sa pagsagot ng aplikasyon. Hindi kailangang ibigay ang password mo.",
        )}{" "}
      </p>
      <ol className="steps">
        <li>
          <h2>{t("Sabihin ang kailangan")}</h2>
          <p>{t("Tulong, dokumento o aktibidad.")}</p>
        </li>
        <li>
          <h2>{t("Suriin kasama ang kawani")}</h2>
          <p>{t("Ikaw pa rin ang aplikante.")}</p>
        </li>
        <li>
          <h2>{t("Ibigay ang pahintulot")}</h2>
          <p>{t("Suriin ang mga detalye bago ipasa ang aplikasyon.")}</p>
        </li>
      </ol>
      <dl>
        <Definition label={t("Address at oras")}>
          {t(
            "Makipag-ugnayan sa tanggapan ng Barangay Caniogan para sa address at oras ng opisina.",
          )}{" "}
        </Definition>
      </dl>
      <section className="faq">
        <h2>{t("Mga karaniwang tanong")}</h2>
        <details>
          <summary>{t("Paano kinukuha ang dokumento?")}</summary>
          <p>
            {t(
              "Personal ang pagkuha ng aplikante. Dalhin ang orihinal na ID at application reference kapag handa na ang dokumento.",
            )}{" "}
          </p>
        </details>
        <details>
          <summary>{t("May online payment ba?")}</summary>
          <p>
            {t(
              "Walang online payment. Kumpirmahin sa barangay ang anumang bayaring maaaring kailanganin.",
            )}{" "}
          </p>
        </details>
        <details>
          <summary>{t("Paano makukuha ang community points?")}</summary>
          <p>
            {t(
              "Kailangang kumpirmahin ng boluntaryo at humiling na tapos na ang gawain. Susuriin ito ng kawani bago idagdag ang puntos.",
            )}{" "}
          </p>
        </details>
      </section>
      <Link to={home}>{t("Bumalik sa Home")}</Link>
    </div>
  );
}
