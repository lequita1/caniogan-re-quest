import { useParams } from "react-router";
import {
  ActionLink,
  Definition,
  Notice,
  PageHeading,
  RowLink,
} from "../../components/ui";
import { queues } from "./sampleData";

export function StaffHome() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Mga kailangang asikasuhin"
        description="Operational Admin · Mga sample queue para sa sakop mong tungkulin"
      />
      <div className="link-list">
        {queues.map((queue) => (
          <RowLink
            key={queue.id}
            title={queue.title}
            description={queue.description}
            to={`/staff/${queue.id}`}
          />
        ))}
      </div>
      <Notice title="Saklaw ng access">
        <p>
          Suriin lamang ang nakatalagang gawain. Walang self-approval; limitado
          ang pagtingin sa sensitibong detalye.
        </p>
      </Notice>
    </div>
  );
}

export function StaffQueue() {
  const { queueId } = useParams();
  const queue = queues.find((item) => item.id === queueId);
  return (
    <div className="task-column page-stack">
      <PageHeading
        title={queue?.title || "Hindi makita ang queue"}
        description={queue?.detail}
        backTo="/staff"
        backLabel="Bumalik sa mga queue"
      />
      <Notice title="Halimbawang queue">
        <p>
          {queue?.description || "Piliin muli ang queue mula sa listahan."}{" "}
          Walang totoong aplikasyon o pribadong record na binubuksan sa pahinang
          ito.
        </p>
      </Notice>
      {queueId === "points" && (
        <dl className="definition-list">
          <Definition label="Assignment">ASG-DEMO-004 · Sam</Definition>
          <Definition label="Boluntaryo">
            May completion confirmation
          </Definition>
          <Definition label="Requester">May acceptance confirmation</Definition>
          <Definition label="Naka-lock na tier">25 puntos · sample</Definition>
        </dl>
      )}
      <p className="muted">
        Hindi pa magagamit ang pag-apruba o pagproseso sa halimbawang ito.
      </p>
      <ActionLink to="/staff">Tingnan ang ibang queue</ActionLink>
    </div>
  );
}

export function CaptainHome() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Pangkalahatang ulat"
        description="Captain · Read-only overview · Sample records"
      />
      <section className="page-stack">
        <h2>Kalagayan ng serbisyo</h2>
        <dl className="definition-list">
          <Definition label="Mga kahilingang bukas">12 · sample</Definition>
          <Definition label="Nakumpletong community tasks">
            18 · sample
          </Definition>
          <Definition label="Dokumentong ready for pickup">
            6 · sample
          </Definition>
        </dl>
      </section>
      <section className="page-stack">
        <h2>Mga dapat pagtuunan</h2>
        <p>
          Cleanup ang pinakamaraming sample request. May 3 overdue tasks na
          kailangang tingnan ng operational team.
        </p>
      </section>
      <Notice title="Aggregate lamang">
        <p>
          Walang ID documents o pribadong usapan sa dashboard na ito. Hindi
          predictive analytics ang sample summary.
        </p>
      </Notice>
    </div>
  );
}
