import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import {
  ActionLink,
  Definition,
  EmptyState,
  Notice,
  PageHeading,
  RowLink,
} from "../../components/ui";
import { documents } from "./sampleData";

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
