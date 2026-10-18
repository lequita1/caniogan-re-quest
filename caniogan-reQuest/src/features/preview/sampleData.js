// Fictional display records for the responsive-layout phase. No database writes.
export const requests = [
  {
    id: "cleanup",
    title: "Paglilinis ng bakuran",
    status: "May 2 aplikante",
    next: "Pumili ng makatutulong",
    kind: "Tulong sa komunidad",
    reference: "RQ-DEMO-024",
  },
  {
    id: "hauling",
    title: "Tulong sa paghahakot",
    status: "Sinusuri ng kawani",
    next: "Maghintay ng update",
    kind: "Tulong sa komunidad",
    reference: "RQ-DEMO-025",
  },
  {
    id: "residency",
    title: "Certificate of Residency",
    status: "May kailangang baguhin",
    next: "Basahin ang paliwanag",
    kind: "Dokumento",
    reference: "DOC-DEMO-018",
  },
  {
    id: "clearance",
    title: "Barangay Clearance",
    status: "Maaari nang kunin",
    next: "Ihanda ang orihinal na ID",
    kind: "Dokumento",
    reference: "DOC-DEMO-019",
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
    title: "Residency verification",
    description: "3 naghihintay · sample",
    detail: "Mga aplikasyon para sa pagpapatunay ng residency.",
  },
  {
    id: "moderation",
    title: "Community moderation",
    description: "2 bagong kahilingan · sample",
    detail: "Mga kahilingang susuriin bago ilathala sa community board.",
  },
  {
    id: "documents",
    title: "Mga dokumento",
    description: "4 para sa pagsusuri · sample",
    detail: "Mga aplikasyon at pagproseso ng dokumento.",
  },
  {
    id: "points",
    title: "Points review",
    description: "1 may dalawang kumpirmasyon · sample",
    detail: "Mga gawaing kinumpirma ng boluntaryo at requester.",
  },
  {
    id: "reports",
    title: "Mga iniulat na isyu",
    description: "1 nakatalagang case · sample",
    detail: "Mga iniulat na problemang nakatalaga sa reviewer.",
  },
];
