export function validId(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value))
    throw new Error("messages/invalid-id");
  return value;
}
export function messageLink(requestId, applicantUid) {
  return `/resident/messages/${validId(requestId)}/${validId(applicantUid)}`;
}
export function messageText(value) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 2000)
    throw new Error("messages/invalid-text");
  return value.trim();
}
export function canMessage(requestStatus, applicationStatus, assignmentState) {
  if (requestStatus !== "open") return false;
  if (applicationStatus === "selected")
    return ["offered", "inProgress"].includes(assignmentState);
  return (
    applicationStatus === "pending" &&
    !["offered", "inProgress"].includes(assignmentState)
  );
}
export function mergeMessages(...windows) {
  return [
    ...new Map(windows.flat().map((item) => [item.id, item])).values(),
  ].sort((a, b) => compareMessages(a, b));
}
export function isUnread(meta, receipt, uid) {
  return Boolean(
    meta &&
      meta.lastSenderUid !== uid &&
      meta.lastMessageId !== receipt?.messageId,
  );
}

function compareMessages(a, b) {
  return a.createdAt - b.createdAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
export function retainMessageWindow(previous, current) {
  if (!current.length) return [];
  return mergeMessages(
    previous.filter((item) => compareMessages(item, current[0]) < 0),
    current,
  );
}
export function retainInboxWindow(previous, current) {
  if (!current.length) return [];
  const first = current[0];
  const older = previous.filter(
    (item) =>
      item.updatedAt < first.updatedAt ||
      (item.updatedAt === first.updatedAt && item.id < first.id),
  );
  return [
    ...new Map([...older, ...current].map((item) => [item.id, item])).values(),
  ].sort(
    (a, b) =>
      a.updatedAt - b.updatedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}
