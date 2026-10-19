import {
  endBefore,
  get,
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { auth, database } from "../../lib/firebase";
import { validId, messageText } from "./messageModel";

function currentUid() {
  if (!auth.currentUser) throw new Error("auth/required");
  return auth.currentUser.uid;
}
function rows(snapshot) {
  const result = [];
  snapshot.forEach((child) => {
    result.push({ ...child.val(), id: child.key });
  });
  return result;
}
function target(kind, requestId, applicantUid) {
  const uid = currentUid();
  if (kind === "connection") return ref(database, ".info/connected");
  if (kind === "inbox")
    return query(
      ref(database, `messageInboxes/${uid}`),
      orderByChild("updatedAt"),
      limitToLast(30),
    );
  validId(requestId);
  validId(applicantUid);
  if (kind === "messages")
    return query(
      ref(database, `taskMessages/${requestId}/${applicantUid}`),
      orderByChild("createdAt"),
      limitToLast(50),
    );
  if (kind === "receipt")
    return ref(database, `messageReads/${requestId}/${applicantUid}/${uid}`);
  if (kind === "meta")
    return ref(database, `taskConversations/${requestId}/${applicantUid}`);
  throw new Error("messages/invalid-kind");
}
export function watchMessages(kind, requestId, applicantUid, success, failure) {
  if (kind === "context") {
    validId(requestId);
    validId(applicantUid);
    currentUid();
    const values = {},
      stops = [];
    const paths = {
      requestStatus: `requests/${requestId}/status`,
      requestTitle: `requests/${requestId}/title`,
      requestOwnerUid: `requests/${requestId}/ownerUid`,
      application: `volunteerApplications/${requestId}/${applicantUid}`,
      assignmentState: `requestAssignments/${requestId}/state`,
    };
    for (const [key, path] of Object.entries(paths))
      stops.push(
        onValue(
          ref(database, path),
          (snapshot) => {
            values[key] = snapshot.val();
            if (Object.keys(values).length === Object.keys(paths).length)
              success({ ...values });
          },
          failure,
        ),
      );
    return () => stops.forEach((stop) => stop());
  }
  return onValue(
    target(kind, requestId, applicantUid),
    (snapshot) =>
      success(
        ["messages", "inbox"].includes(kind) ? rows(snapshot) : snapshot.val(),
      ),
    failure,
  );
}
export async function olderMessages(requestId, applicantUid, before) {
  validId(requestId);
  validId(applicantUid);
  currentUid();
  return rows(
    await get(
      query(
        ref(database, `taskMessages/${requestId}/${applicantUid}`),
        orderByChild("createdAt"),
        endBefore(before.createdAt, before.id),
        limitToLast(50),
      ),
    ),
  );
}
export async function olderConversations(before) {
  return rows(
    await get(
      query(
        ref(database, `messageInboxes/${currentUid()}`),
        orderByChild("updatedAt"),
        endBefore(before.updatedAt, before.id),
        limitToLast(30),
      ),
    ),
  );
}
export function newMessageIntent(text) {
  currentUid();
  return {
    id: push(ref(database, "taskMessages")).key,
    text: messageText(text),
  };
}
export async function sendTaskMessage(requestId, applicantUid, intent) {
  validId(requestId);
  validId(applicantUid);
  if (!/^[A-Za-z0-9_-]{20}$/.test(intent?.id || ""))
    throw new Error("messages/invalid-id");
  const who = currentUid(),
    text = messageText(intent.text),
    base = `${requestId}/${applicantUid}`;
  const messageRef = ref(database, `taskMessages/${base}/${intent.id}`),
    metaRef = ref(database, `taskConversations/${base}`);
  const stillSignedIn = () => {
    if (currentUid() !== who) throw new Error("auth/changed");
  };
  const delivered = async () => {
    const found = (await get(messageRef)).val();
    stillSignedIn();
    return found?.senderUid === who && found.text === text;
  };
  if (await delivered()) return;
  const [owner, title, application, initial] = await Promise.all([
    get(ref(database, `requests/${requestId}/ownerUid`)),
    get(ref(database, `requests/${requestId}/title`)),
    get(ref(database, `volunteerApplications/${base}`)),
    get(metaRef),
  ]);
  stillSignedIn();
  if (!owner.exists() || !title.exists() || !application.exists())
    throw new Error("messages/unavailable");
  async function write(existing) {
    stillSignedIn();
    const changes = {
      [`taskMessages/${base}/${intent.id}`]: {
        senderUid: who,
        text,
        createdAt: serverTimestamp(),
      },
      [`taskConversations/${base}`]: {
        requestOwnerUid: owner.val(),
        applicantUid,
        requestTitle: existing?.requestTitle || title.val(),
        applicantName: existing?.applicantName || application.val().displayName,
        createdAt: existing?.createdAt ?? serverTimestamp(),
        lastMessageId: intent.id,
        lastMessageAt: serverTimestamp(),
        lastSenderUid: who,
        lastText: text,
      },
    };
    for (const uid of [owner.val(), applicantUid])
      changes[`messageInboxes/${uid}/${requestId}~${applicantUid}`] = {
        requestId,
        applicantUid,
        updatedAt: serverTimestamp(),
      };
    await update(ref(database), changes);
  }
  try {
    await write(initial.val());
  } catch (error) {
    if (await delivered()) return;
    // Two first messages may race to create the same immutable conversation metadata.
    const latest = (await get(metaRef)).val();
    stillSignedIn();
    if (!initial.exists() && latest) {
      try {
        await write(latest);
      } catch (retryError) {
        if (!(await delivered())) throw retryError;
      }
    } else throw error;
  }
}
export async function markConversationRead(requestId, applicantUid, messageId) {
  validId(requestId);
  validId(applicantUid);
  await set(
    ref(database, `messageReads/${requestId}/${applicantUid}/${currentUid()}`),
    { messageId, readAt: serverTimestamp() },
  );
}
