import { ref, runTransaction, serverTimestamp } from "firebase/database";
import { auth, database } from "../../lib/firebase";

export async function submitVerification({ fullName, address }) {
  const result = await runTransaction(
    ref(database, `accounts/${auth.currentUser.uid}/verification`),
    (current) => {
      if (current && current.status !== "needsChanges") return;
      return {
        ...current,
        fullName: fullName.trim(),
        address: address.trim(),
        method: "inPerson",
        consent: true,
        status: "submitted",
        submittedAt: serverTimestamp(),
      };
    },
    { applyLocally: false },
  );
  if (!result.committed) throw new Error("case-changed");
}

export async function reviewVerification(
  uid,
  { decision, reason, evidenceChecked },
) {
  const result = await runTransaction(
    ref(database, `accounts/${uid}/verification`),
    (current) => {
      // Transactions initially receive null before fetching the server value.
      if (!current) return current;
      if (current.status !== "submitted") return;
      return {
        ...current,
        status: decision,
        review: {
          decision,
          reason: reason.trim(),
          evidenceChecked,
          reviewerUid: auth.currentUser.uid,
          reviewedAt: serverTimestamp(),
        },
      };
    },
    { applyLocally: false },
  );
  if (!result.committed) throw new Error("case-changed");
}
