// Fictional display records for the responsive-layout phase. No database writes.
export const requests = [
  {
    id: "cleanup",
    title: "Paglilinis ng bakuran",
    status: "2 boluntaryo ang nag-apply",
    next: "Pumili ng boluntaryo",
    kind: "Tulong sa komunidad",
    reference: "RQ-2026-024",
  },
  {
    id: "hauling",
    title: "Tulong sa paghahakot",
    status: "Sinusuri ng kawani",
    next: "Hintayin ang resulta ng pagsusuri",
    kind: "Tulong sa komunidad",
    reference: "RQ-2026-025",
  },
  {
    id: "residency",
    title: "Certificate of Residency",
    status: "May kailangang baguhin",
    next: "Basahin ang paliwanag",
    kind: "Dokumento",
    reference: "DOC-2026-018",
  },
  {
    id: "clearance",
    title: "Barangay Clearance",
    status: "Maaari nang kunin",
    next: "Ihanda ang orihinal na ID",
    kind: "Dokumento",
    reference: "DOC-2026-019",
  },
];
export const documents = [
  ["residency", "Certificate of Residency"],
  ["clearance", "Barangay Clearance"],
  ["indigency", "Barangay Indigency Certificate"],
  ["conduct", "Good Moral Character / Good Conduct"],
  ["business", "Barangay Business Clearance"],
  ["cohabitation", "Certificate of Cohabitation"],
  ["solo-parent", "Solo Parent Residency Certification"],
  ["general", "General Barangay Certification"],
];
export const queues = [
  {
    id: "verification",
    title: "Pagpapatunay ng paninirahan",
    description: "3 naghihintay",
    detail: "Mga aplikasyon para sa pagpapatunay ng paninirahan.",
  },
  {
    id: "moderation",
    title: "Pagsusuri ng mga kahilingan",
    description: "2 bagong kahilingan",
    detail: "Mga kahilingang susuriin bago ilathala sa komunidad.",
  },
  {
    id: "documents",
    title: "Mga dokumento",
    description: "4 para sa pagsusuri",
    detail: "Mga aplikasyon at pagproseso ng dokumento.",
  },
  {
    id: "points",
    title: "Pagsusuri ng puntos",
    description: "1 may dalawang kumpirmasyon",
    detail: "Mga gawaing kinumpirma ng boluntaryo at humiling.",
  },
  {
    id: "reports",
    title: "Mga iniulat na isyu",
    description: "1 nakatalagang ulat",
    detail: "Mga iniulat na problemang nakatalaga sa tagasuri.",
  },
];
