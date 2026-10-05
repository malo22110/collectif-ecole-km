const fs = require("node:fs/promises");
const path = require("node:path");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");

const dataPath = path.join(__dirname, "..", "lieux-dits-geolocalises.json");
const serviceAccountPath = path.join(__dirname, "..", "secrets", "firebase-service-account.json");
const collectionName = "lieuxDits";
const shouldApply = process.argv.includes("--apply");

function makeDocumentId(name, index) {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `lieu-${index + 1}`;
  return `${base}-${String(index + 1).padStart(3, "0")}`;
}

async function main() {
  const locations = JSON.parse(await fs.readFile(dataPath, "utf8"));
  if (!Array.isArray(locations) || locations.length === 0) {
    throw new Error("Le fichier geolocalisé doit contenir un tableau de lieux-dits.");
  }

  const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, "utf8"));
  const app =
    getApps()[0] ||
    initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
  const db = getFirestore(app, "ecole-db");
  const collection = db.collection(collectionName);
  const existingSnapshot = await collection.get();
  const existingIds = new Set(existingSnapshot.docs.map((document) => document.id));

  const planned = locations.map((location, index) => {
    if (typeof location.nom !== "string" || !location.nom.trim()) {
      throw new Error(`Nom de lieu invalide à l'index ${index}.`);
    }
    if (!Number.isInteger(location.foyers) || location.foyers < 0) {
      throw new Error(`Nombre de foyers invalide pour ${location.nom}.`);
    }
    const hasCoordinates = Number.isFinite(location.lat) && Number.isFinite(location.lon);
    if (
      hasCoordinates &&
      (location.lat < -90 || location.lat > 90 || location.lon < -180 || location.lon > 180)
    ) {
      throw new Error(`Coordonnées hors limites pour ${location.nom}.`);
    }

    return {
      id: makeDocumentId(location.nom, index),
      data: {
        nom: location.nom.trim(),
        foyers: location.foyers,
        lat: hasCoordinates ? location.lat : null,
        lon: hasCoordinates ? location.lon : null,
        geocodeStatus: hasCoordinates ? "located" : "unlocated",
        householdStatus: location.foyers === 0 ? "zero" : "positive",
        source: "base-adresse-nationale",
        updatedAt: FieldValue.serverTimestamp(),
      },
    };
  });

  const toCreate = planned.filter((item) => !existingIds.has(item.id));
  const locatedCount = toCreate.filter((item) => item.data.geocodeStatus === "located").length;
  const zeroHouseholdCount = toCreate.filter((item) => item.data.householdStatus === "zero").length;

  console.log(
    `Lieux fournis: ${locations.length}; déjà présents: ${planned.length - toCreate.length}; à ajouter: ${toCreate.length}.`,
  );
  console.log(
    `Coordonnées disponibles: ${locatedCount}; lieux à zéro foyer: ${zeroHouseholdCount}.`,
  );

  if (!shouldApply) {
    console.log(
      "Simulation seulement. Relancez avec --apply pour ajouter les documents manquants.",
    );
    await app.delete();
    return;
  }

  for (let offset = 0; offset < toCreate.length; offset += 450) {
    const batch = db.batch();
    for (const item of toCreate.slice(offset, offset + 450)) {
      batch.create(collection.doc(item.id), item.data);
    }
    await batch.commit();
  }

  console.log(
    `Ajout terminé : ${toCreate.length} document(s) créé(s) dans ${collectionName}. Les documents déjà présents n'ont pas été modifiés.`,
  );
  await app.delete();
}

main().catch((error) => {
  console.error("Échec du seed des lieux-dits :", error.message);
  process.exitCode = 1;
});
