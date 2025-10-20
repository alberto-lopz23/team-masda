/*
 Simple migration script to copy existing id/doc id into numeroID in the usuarios collection.
 WARNING: This script uses the Firebase Admin SDK and must be run in a secure environment with service account credentials.
 Usage:
 1) Place your serviceAccountKey.json in the project root (or set GOOGLE_APPLICATION_CREDENTIALS env var).
 2) npm install firebase-admin
 3) node scripts/migrate_id_to_numeroID.js
*/

const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} catch (e) {
  // already initialized
}

const db = admin.firestore();

async function migrate() {
  console.log("Starting migration: copiar id/docId -> numeroID");
  const usuariosRef = db.collection("usuarios");
  const snapshot = await usuariosRef.get();
  console.log(`Found ${snapshot.size} usuarios`);
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const current = data.numeroID;
    if (typeof current === "undefined" || current === null || current === "") {
      const newVal = data.id ?? doc.id;
      await usuariosRef.doc(doc.id).update({ numeroID: String(newVal) });
      updated++;
      if (updated % 50 === 0) console.log(`Updated ${updated} docs so far...`);
    }
  }
  console.log(`Migration complete. Updated ${updated} documents.`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
