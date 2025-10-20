/*
  Server-side helper to reset usuarios.visitado flags daily.

  Two ways to use this file:
  1) Deploy as a Google Cloud Function (scheduled via Cloud Scheduler / PubSub) - see the exported `resetVisitado` function.
  2) Run manually from a secure environment with a service account by executing `node scripts/reset_visitado_cron.js`.

  WARNING: This script requires firebase-admin credentials with write access to Firestore.
*/

const admin = require("firebase-admin");

// If you run locally, set GOOGLE_APPLICATION_CREDENTIALS env var to the service account JSON.
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function resetVisitadoOnce() {
  console.log("Reset visitado: start");
  try {
    const usuariosRef = db.collection("usuarios");
    const q = usuariosRef.where("visitado", "==", true).limit(500);

    // We will page through matching docs and reset visitado to false
    let total = 0;
    let snapshot = await q.get();
    while (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { visitado: false });
      });
      await batch.commit();
      total += snapshot.docs.length;
      console.log(`Reset ${snapshot.docs.length} docs in batch`);

      // get next page (if any) -- re-query to find more docs
      snapshot = await usuariosRef
        .where("visitado", "==", true)
        .limit(500)
        .get();
    }

    console.log(`Reset visitado completed. Total documents updated: ${total}`);
  } catch (err) {
    console.error("Error resetting visitado flags:", err);
    throw err;
  }
}

// Exported for Cloud Functions (HTTP trigger or scheduled Pub/Sub trigger)
exports.resetVisitado = async (req, res) => {
  try {
    await resetVisitadoOnce();
    if (res) res.status(200).send("visitado reset done");
  } catch (e) {
    if (res) res.status(500).send("error");
  }
};

// If executed directly (node scripts/reset_visitado_cron.js)
if (require.main === module) {
  resetVisitadoOnce()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
