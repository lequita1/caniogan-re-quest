import {
  get,
  limitToLast,
  onValue,
  orderByChild,
  query,
  ref,
  serverTimestamp,
  update,
} from "firebase/database";
import { auth, database } from "../../lib/firebase";

function uid() {
  if (!auth.currentUser) throw new Error("auth/required");
  return auth.currentUser.uid;
}
function path(id) {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id))
    throw new Error("volunteers/invalid-id");
  return id;
}
function text(value, min, max) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new Error("volunteers/invalid-input");
  return value.trim();
}
export async function applyToVolunteer(id, { introduction, availability }) {
  path(id);
  const who = uid();
  const [account, board] = await Promise.all([
    get(ref(database, `accounts/${who}`)),
    get(ref(database, `requestBoard/${id}`)),
  ]);
  if (!board.exists() || board.val().ownerUid === who)
    throw new Error("volunteers/not-available");
  await update(ref(database), {
    [`volunteerApplications/${id}/${who}`]: {
      displayName: account.val().profile.displayName,
      introduction: text(introduction, 10, 500),
      availability: text(availability, 3, 200),
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    [`volunteerActivity/${who}/${id}`]: {
      title: board.val().title,
      createdAt: serverTimestamp(),
    },
  });
}
export async function updateApplication(id, applicantUid, status) {
  path(id);
  path(applicantUid);
  uid();
  if (!["withdrawn", "declined"].includes(status))
    throw new Error("volunteers/invalid-input");
  await update(ref(database, `volunteerApplications/${id}/${applicantUid}`), {
    status,
    updatedAt: serverTimestamp(),
  });
}
export async function selectVolunteer(id, volunteerUid) {
  path(id);
  path(volunteerUid);
  await update(ref(database), {
    [`requestAssignments/${id}`]: {
      ownerUid: uid(),
      volunteerUid,
      state: "offered",
      selectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      actorUid: uid(),
    },
    [`volunteerApplications/${id}/${volunteerUid}/status`]: "selected",
    [`volunteerApplications/${id}/${volunteerUid}/updatedAt`]:
      serverTimestamp(),
    [`activeVolunteers/${volunteerUid}`]: { requestId: id },
  });
}
export async function respondToSelection(id, accept, reason = "") {
  path(id);
  const who = uid();
  const changes = {
    [`requestAssignments/${id}/state`]: accept ? "inProgress" : "declined",
    [`requestAssignments/${id}/updatedAt`]: serverTimestamp(),
    [`requestAssignments/${id}/actorUid`]: who,
  };
  if (!accept)
    Object.assign(changes, {
      [`requestAssignments/${id}/reason`]: text(reason, 10, 500),
      [`volunteerApplications/${id}/${who}/status`]: "declined",
      [`volunteerApplications/${id}/${who}/updatedAt`]: serverTimestamp(),
      [`activeVolunteers/${who}`]: null,
    });
  await update(ref(database), changes);
}
export function watchVolunteering(kind, id, onData, onError) {
  const who = uid();
  if (id) path(id);
  let target;
  if (kind === "applications")
    target = query(
      ref(database, `volunteerApplications/${id}`),
      orderByChild("createdAt"),
      limitToLast(50),
    );
  else if (kind === "ownApplication")
    target = ref(database, `volunteerApplications/${id}/${who}`);
  else if (kind === "assignment")
    target = ref(database, `requestAssignments/${id}`);
  else if (kind === "state")
    target = ref(database, `requestAssignments/${id}/state`);
  else if (kind === "commitment")
    target = ref(database, `activeVolunteers/${who}`);
  else if (kind === "activity")
    target = query(
      ref(database, `volunteerActivity/${who}`),
      orderByChild("createdAt"),
      limitToLast(50),
    );
  else throw new Error("volunteers/invalid-input");
  return onValue(target, (snapshot) => onData(snapshot.val()), onError);
}
