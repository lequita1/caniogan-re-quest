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

export function ResidentHome() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Magandang araw, Alex."
        description="Ano ang kailangan mo ngayon?"
      />
      <Notice
        tone="warning"
        title="May kailangan kang kumpirmahin"
        action={
          <ActionLink to="/resident/requests/completion">
            Tingnan ang gawain
          </ActionLink>
        }
      >
        <p>
          Natapos na ni Sam ang halimbawang gawain. Tingnan muna bago
          kumpirmahin.
        </p>
      </Notice>
      <div className="home-grid">
        <section className="service-section" aria-labelledby="services-heading">
          <h2 id="services-heading">Mga serbisyo</h2>
          <div className="link-list">
            <RowLink
              title="Humingi ng tulong"
              description="Mag-post ng pangangailangan sa komunidad."
              to="/resident/requests/new"
            />
            <RowLink
              title="Mag-apply ng dokumento"
              description="Tingnan ang requirements bago magsimula."
              to="/resident/documents"
            />
            <RowLink
              title="Sumali sa aktibidad"
              description="Makilahok o mag-alok ng tulong."
              to="/resident/events"
            />
          </div>
        </section>
        <section
          className="surface-panel recent-work"
          aria-labelledby="recent-heading"
        >
          <h2 id="recent-heading">Mga kahilingan mo</h2>
          <div className="recent-item">
            <dl>
              <Definition label="Paglilinis ng bakuran">
                May 2 aplikante
              </Definition>
            </dl>
            <ActionLink to="/resident/requests/cleanup">
              Tingnan ang mga aplikante
            </ActionLink>
          </div>
          <div className="recent-item">
            <dl>
              <Definition label="Certificate of Residency">
                May kailangang baguhin
              </Definition>
            </dl>
            <ActionLink to="/resident/requests/residency">
              Basahin ang paliwanag
            </ActionLink>
          </div>
        </section>
      </div>
      <RowLink
        title="Kailangan mo ng gabay?"
        description="Puwedeng magpatulong sa barangay desk."
        to="/resident/help"
      />
    </div>
  );
}

export function RequestsPage() {
  const [filter, setFilter] = useState("all");
  const visible = requests.filter(
    (request) => filter === "all" || request.kind === filter,
  );
  return (
    <div className="page-stack">
      <PageHeading
        title="Mga kahilingan"
        description="Tingnan ang kalagayan at susunod mong gagawin."
      />
      <div className="page-toolbar">
        <SelectField
          label="Ipakita"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">Lahat ng kahilingan</option>
          <option>Tulong sa komunidad</option>
          <option>Dokumento</option>
          <option>Natapos na</option>
        </SelectField>
        <ActionLink variant="primary" to="/resident/requests/new">
          Bagong kahilingan
        </ActionLink>
      </div>
      {visible.length ? (
        <div className="link-list">
          {visible.map((request) => (
            <RowLink
              key={request.id}
              title={request.title}
              description={`${request.status} · ${request.next}`}
              to={`/resident/requests/${request.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Wala pang natapos na kahilingan"
          action={
            <Button variant="secondary" onClick={() => setFilter("all")}>
              Tingnan ang lahat
            </Button>
          }
        >
          <p>
            Dito lalabas ang mga kahilingan kapag nakumpleto na ang proseso.
          </p>
        </EmptyState>
      )}
    </div>
  );
}

export function RequestDetail() {
  const { requestId } = useParams();
  const request =
    requestId === "completion"
      ? {
          id: "completion",
          title: "Paglilinis ng bakuran",
          reference: "ASG-DEMO-004",
          status: "Tapos na ayon sa boluntaryo",
          next: "Kailangan ang kumpirmasyon ng requester",
        }
      : requests.find((item) => item.id === requestId);
  if (!request)
    return (
      <div className="task-column page-stack">
        <PageHeading
          title="Hindi makita ang kahilingan"
          backTo="/resident/requests"
          backLabel="Bumalik sa mga kahilingan"
        />
        <EmptyState title="Suriin ang link">
          <p>Piliin muli ang kahilingan mula sa listahan.</p>
        </EmptyState>
      </div>
    );
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={request.title}
        backTo="/resident/requests"
        backLabel="Bumalik sa mga kahilingan"
      />
      <dl className="definition-list">
        <Definition label="Reference">{request.reference}</Definition>
        <Definition label="Kalagayan">{request.status}</Definition>
      </dl>
      {request.id === "residency" ? (
        <Notice title="Paliwanag ng kawani" tone="warning">
          <p>“Pakilinaw kung para sa anong paaralan ang enrollment.”</p>
        </Notice>
      ) : (
        <Notice title={request.next}>
          <p>
            {request.id === "clearance"
              ? "Personal ang pagkuha. Dalhin ang orihinal na ID at ang application reference."
              : "Halimbawang tala ito para makita ang kalagayan at susunod na hakbang."}
          </p>
        </Notice>
      )}
      <p className="muted">
        Sample lamang ang tala. Hindi pa magagamit ang pagpili, pagkumpirma o
        pagproseso sa halimbawang ito.
      </p>
      <ActionLink to="/resident/help">Kailangan ko ng tulong</ActionLink>
    </div>
  );
}

export function NewRequestPage() {
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
      <PageHeading title="Humingi ng tulong" backTo="/resident" />
      <p className="muted">
        Halimbawa lamang ang form na ito. Walang ipapadalang kahilingan.
      </p>
      {review ? (
        <section className="page-stack" aria-labelledby="review-heading">
          <h2 id="review-heading" tabIndex="-1" ref={reviewHeading}>
            Suriin ang mga detalye
          </h2>
          <dl className="definition-list">
            <Definition label="Pamagat">{values.title}</Definition>
            <Definition label="Kategorya">{values.category}</Definition>
            <Definition label="Anong tulong ang kailangan?">
              {values.description}
            </Definition>
          </dl>
          <Notice title="Hindi pa ito naipapadala">
            <p>
              Puwede mong balikan at baguhin ang mga sagot. Hindi pa magagamit
              ang pagsusumite sa halimbawang ito.
            </p>
          </Notice>
          <div className="action-stack">
            <Button disabled>Isumite ang kahilingan</Button>
            <Button variant="secondary" onClick={() => setReview(false)}>
              Baguhin ang detalye
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
              <h2>May kailangang ayusin</h2>
              <ul>
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>
                    <a href={`#request-${key}`}>{message}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <TextField
            id="request-title"
            label="Pamagat"
            name="title"
            value={values.title}
            onChange={change}
            hint="Maikli at malinaw na pamagat."
            error={errors.title}
            required
            maxLength={100}
            autoComplete="off"
          />
          <SelectField
            label="Kategorya"
            name="category"
            value={values.category}
            onChange={change}
          >
            <option>Paglilinis ng komunidad</option>
            <option>Lost &amp; Found</option>
            <option>Praktikal na tulong</option>
            <option>Aktibidad sa komunidad</option>
          </SelectField>
          <TextField
            id="request-description"
            label="Anong tulong ang kailangan?"
            name="description"
            value={values.description}
            onChange={change}
            multiline
            rows={5}
            hint="Huwag ilagay dito ang numero ng ID o pribadong contact details."
            error={errors.description}
            required
            maxLength={2000}
          />
          <Button type="submit">Suriin ang mga detalye</Button>
        </form>
      )}
    </div>
  );
}

export function DocumentsPage() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Mga dokumento"
        description="Aplikasyon para sa sarili mo. Personal ang pagkuha sa barangay."
      />
      <div className="link-list">
        {documents.map(([id, title]) => (
          <RowLink
            key={id}
            title={title}
            description="Requirements: [kailangang kumpirmahin sa barangay]"
            to={`/resident/documents/${id}`}
          />
        ))}
      </div>
      <Notice
        title="Kailangan ng tulong sa pagpili?"
        action={<ActionLink to="/resident/help">Tingnan ang gabay</ActionLink>}
      >
        <p>Puwedeng magpatulong sa barangay desk.</p>
      </Notice>
    </div>
  );
}

export function DocumentDetail() {
  const { documentId } = useParams();
  const document = documents.find(([id]) => id === documentId);
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={document?.[1] || "Hindi makita ang dokumento"}
        backTo="/resident/documents"
        backLabel="Bumalik sa mga dokumento"
      />
      <Notice title="Kumpirmahin muna ang requirements">
        <p>
          Ang eksaktong requirements, eligibility, bayarin at oras ng pagproseso
          ay placeholder pa.
        </p>
      </Notice>
      <ol className="steps">
        <li>
          <h2>Ihanda ang impormasyon</h2>
          <p>Sarili mong detalye at layunin.</p>
        </li>
        <li>
          <h2>Ipakita ang kinakailangang patunay</h2>
          <p>Eksaktong checklist: [placeholder].</p>
        </li>
        <li>
          <h2>Kunin nang personal</h2>
          <p>Ipakita ang orihinal na ID sa barangay.</p>
        </li>
      </ol>
      <ActionLink to="/resident/help">Magpatulong sa barangay desk</ActionLink>
    </div>
  );
}

export function EventsPage() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Mga aktibidad"
        description="Mga sample na aktibidad; hindi opisyal na schedule."
      />
      <div className="link-list">
        <RowLink
          title="Paglilinis sa komunidad"
          description="24 Oktubre · 8:00 AM · May puwesto sa sample"
          to="/resident/events/cleanup"
        />
        <RowLink
          title="Fun run sa barangay"
          description="Puno na ang sample activity"
          to="/resident/events/fun-run"
        />
      </div>
      <Notice title="Para sa kabataang kalahok">
        <p>
          Supervised activities lamang. Susundin ang age at consent requirements
          na itatakda ng barangay.
        </p>
      </Notice>
    </div>
  );
}

export function EventDetail() {
  const { eventId } = useParams();
  if (!["cleanup", "fun-run"].includes(eventId)) {
    return (
      <div className="task-column page-stack">
        <PageHeading title="Hindi makita ang aktibidad" />
        <EmptyState
          title="Maaaring nagbago ang link"
          action={<ActionLink to="/resident/events">Bumalik sa mga aktibidad</ActionLink>}
        >
          <p>Pumili ng aktibidad mula sa listahan para magpatuloy.</p>
        </EmptyState>
      </div>
    );
  }
  const full = eventId === "fun-run";
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={full ? "Fun run sa barangay" : "Paglilinis sa komunidad"}
        backTo="/resident/events"
        backLabel="Bumalik sa mga aktibidad"
      />
      <Notice
        title={
          full
            ? "Wala nang puwestong available"
            : "Sample activity · Hindi opisyal na anunsyo"
        }
        tone={full ? "warning" : "info"}
      >
        <p>
          {full
            ? "Tingnan ang ibang aktibidad na may puwesto."
            : "Hindi pa magagamit ang registration sa halimbawang ito."}
        </p>
      </Notice>
      {!full && (
        <dl className="definition-list">
          <Definition label="Kailan">
            24 Oktubre 2026 · 8:00–10:00 AM
          </Definition>
          <Definition label="Saan">[Placeholder na tagpuan]</Definition>
          <Definition label="Mga puwesto">
            18 sa 30 participant slots · sample
          </Definition>
        </dl>
      )}
      <ActionLink to="/resident/events">Tingnan ang ibang aktibidad</ActionLink>
    </div>
  );
}

export function CommunityPage() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Tulong sa komunidad"
        description="Mga aprubadong sample request mula sa verified residents."
      />
      <div className="link-list">
        <RowLink
          title="Tulong sa paglilinis ng bakuran"
          description="Community Cleanup · 1 puwesto · Sample 25 puntos"
          to="/resident/requests/cleanup"
        />
      </div>
      <Notice
        title="May pangangailangan ka rin?"
        action={
          <ActionLink to="/resident/requests/new">Humingi ng tulong</ActionLink>
        }
      >
        <p>Maaaring magsumite ng sariling kahilingan para sa pagsusuri.</p>
      </Notice>
    </div>
  );
}

export function MessagesPage() {
  return (
    <div className="task-column page-stack">
      <PageHeading
        title="Mga mensahe"
        description="Sample na usapan sa isang natapos na gawain."
      />
      <h2>Sam · Paglilinis ng bakuran</h2>
      <div className="message message--received">
        <p className="small muted">Sam · 9:10 AM</p>
        <p>Maaari ba sa Sabado, alas-otso?</p>
      </div>
      <div className="message message--sent">
        <p className="small muted">Ikaw · 9:12 AM</p>
        <p>Oo, maghahanda ako ng mga sako.</p>
      </div>
      <Notice title="Sarado na ang usapan">
        <p>
          Mababasa pa ang kasaysayan. Walang bagong mensahe sa halimbawang ito.
        </p>
      </Notice>
      <ActionLink to="/resident/help">Gabay tungkol sa mga usapan</ActionLink>
    </div>
  );
}

export function NotificationsPage() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Mga abiso"
        description="Mga sample update sa iyong mga kahilingan."
      />
      <div className="link-list">
        <RowLink
          title="May kailangang baguhin"
          description="Certificate of Residency · Basahin ang paliwanag"
          to="/resident/requests/residency"
        />
        <RowLink
          title="Kumpirmahin ang tulong"
          description="Tapos na ayon sa boluntaryo"
          to="/resident/requests/completion"
        />
        <RowLink
          title="Maaari nang kunin"
          description="Barangay Clearance · Ihanda ang ID"
          to="/resident/requests/clearance"
        />
      </div>
    </div>
  );
}

export function AccountPage() {
  return (
    <div className="task-column page-stack">
      <PageHeading
        title="Iyong account"
        description="Halimbawang profile para sa pagtingin sa layout."
      />
      <dl className="definition-list">
        <Definition label="Pangalan">Alex Dela Cruz · sample</Definition>
        <Definition label="Account">Beripikadong resident · sample</Definition>
        <Definition label="Wika ng halimbawang interface">Filipino</Definition>
      </dl>
      <Notice title="Halimbawa lamang ang profile">
        <p>
          Hindi ito isang naka-sign in na account. Walang personal na detalye
          ang binabago rito.
        </p>
      </Notice>
      <ActionLink to="/resident/help">Kailangan ko ng tulong</ActionLink>
    </div>
  );
}

export function HelpPage({ home = "/resident" }) {
  return (
    <div className="task-column page-stack">
      <PageHeading title="Gabay at tulong" backTo={home} />
      <h2>Puwede kang magpatulong.</h2>
      <p>
        Sa barangay desk, maaaring tumulong ang kawani sa pagsagot ng
        aplikasyon. Hindi kailangang ibigay ang password mo.
      </p>
      <ol className="steps">
        <li>
          <h2>Sabihin ang kailangan</h2>
          <p>Tulong, dokumento o aktibidad.</p>
        </li>
        <li>
          <h2>Suriin kasama ang kawani</h2>
          <p>Ikaw pa rin ang aplikante.</p>
        </li>
        <li>
          <h2>Ibigay ang pahintulot</h2>
          <p>Itatala kung sino ang tumulong at nagsumite.</p>
        </li>
      </ol>
      <dl>
        <Definition label="Address at oras">
          [Placeholder · kailangang kumpirmahin]
        </Definition>
      </dl>
      <section className="faq">
        <h2>Mga karaniwang tanong</h2>
        <details>
          <summary>Paano kinukuha ang dokumento?</summary>
          <p>
            Personal ang pagkuha ng aplikante. Dalhin ang orihinal na ID at
            application reference kapag handa na ang dokumento.
          </p>
        </details>
        <details>
          <summary>May online payment ba?</summary>
          <p>
            Walang online payment. Kumpirmahin sa barangay ang anumang bayaring
            maaaring kailanganin.
          </p>
        </details>
        <details>
          <summary>Paano makukuha ang community points?</summary>
          <p>
            Kailangang kumpirmahin ng boluntaryo at requester ang gawain.
            Susuriin muna ito ng kawani bago i-finalize ang puntos.
          </p>
        </details>
      </section>
      <Link to={home}>Bumalik sa Tahanan</Link>
    </div>
  );
}
