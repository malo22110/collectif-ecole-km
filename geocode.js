const fs = require("node:fs/promises");
const path = require("node:path");

// [SPEC-GEOCODE-01] Geocode the commune's household sectors with the official BAN API.
const postcode = "22110";
const delayMs = 100;
const outputPath = path.join(__dirname, "lieux-dits-geolocalises.json");

const lieuxDits = [
  { nom: "Goasven", foyers: 2 },
  { nom: "Kerver", foyers: 2 },
  { nom: "coad trenk", foyers: 1, lat: 48.255391, lon: -3.323758 },
  { nom: "Kergreis", foyers: 1 },
  { nom: "Kerfloc'h an dreff", foyers: 3 },
  { nom: "Coat an bars", foyers: 2 },
  { nom: "Minez du", foyers: 2 },
  { nom: "Kerbriou", foyers: 1 },
  { nom: "Kerjoly", foyers: 1 },
  { nom: "Kerberry", foyers: 0 },
  { nom: "toulazen", foyers: 2 },
  { nom: "Park quiminal", foyers: 5 },
  { nom: "Languiniou", foyers: 1 },
  { nom: "La croix madeleine", foyers: 1 },
  { nom: "Le croasty", foyers: 6 },
  { nom: "Menez vadel", foyers: 2 },
  { nom: "Kerdourc'h", foyers: 9 },
  { nom: "Noguellou", foyers: 3 },
  { nom: "L'isle", foyers: 2 },
  { nom: "Moustermeur", foyers: 13 },
  { nom: "Lan vras", foyers: 0 },
  { nom: "Parcou yeod", foyers: 1 },
  { nom: "Scuberiou", foyers: 4 },
  { nom: "Rescostiou", foyers: 8 },
  { nom: "St Lubin", foyers: 28 },
  { nom: "Kermellec", foyers: 1 },
  { nom: "Lustruyen", foyers: 6 },
  { nom: "Keranglas", foyers: 0 },
  { nom: "Kermarcel yves", foyers: 1 },
  { nom: "Pen ar groas", foyers: 1 },
  { nom: "Baroder", foyers: 2 },
  { nom: "Lostiteau", foyers: 1 },
  { nom: "St coudan", foyers: 3 },
  { nom: "Vergus", foyers: 1 },
  { nom: "Kermabeven", foyers: 2 },
  { nom: "Prat gestin", foyers: 2 },
  { nom: "Kermarec", foyers: 4 },
  { nom: "Kerodou", foyers: 3 },
  { nom: "La garenne blanche", foyers: 2 },
  { nom: "Kermablouze", foyers: 2 },
  { nom: "Ker avel", foyers: 1 },
  { nom: "crec'h naon", foyers: 1 },
  { nom: "Garz en ogel", foyers: 1 },
  { nom: "Kerguiffiou vras", foyers: 2 },
  { nom: "Kerfrezour", foyers: 5 },
  { nom: "Pouloupry", foyers: 1 },
  { nom: "Kernevez an argoat", foyers: 2 },
  { nom: "Kervezegan", foyers: 1 },
  { nom: "La salle", foyers: 2 },
  { nom: "Kernon an argoat", foyers: 1 },
  { nom: "garzuel", foyers: 1 },
  { nom: "kervran", foyers: 2 },
  { nom: "Penhoat vihan", foyers: 2 },
  { nom: "Kerstephan", foyers: 1 },
  { nom: "Kerbanel an argoat", foyers: 2 },
  { nom: "Kervoulouzen", foyers: 1 },
  { nom: "Le golven", foyers: 2 },
  { nom: "Penker", foyers: 1 },
  { nom: "Coat moelou", foyers: 3 },
  { nom: "La civiere", foyers: 1 },
  { nom: "Le moulin de la civiere", foyers: 1 },
  { nom: "Route de rostrenen guillaume le caroff", foyers: 9 },
  { nom: "Rue de l'eglise", foyers: 4 },
  { nom: "Route de l'argoat", foyers: 2 },
  { nom: "Rue traversière", foyers: 3 },
  { nom: "Rue etienne le meur", foyers: 17 },
  { nom: "Lotissement helene le chevalier", foyers: 8 },
  { nom: "Rue des anciens combattants", foyers: 4 },
  { nom: "Route de tremargat", foyers: 7 },
  { nom: "rue du lavoir", foyers: 3 },
  { nom: "rue du capitaine le gloan", foyers: 3 },
  { nom: "rue du chêne", foyers: 5 },
  { nom: "rue de l'ecole", foyers: 5 },
  { nom: "route des quatres vents", foyers: 9 },
  { nom: "les isles", foyers: 2 },
  { nom: "crec'h moelou", foyers: 1 },
  { nom: "le coat", foyers: 1 },
  { nom: "bel air", foyers: 1 },
  { nom: "coat ar pan", foyers: 1 },
  { nom: "kerlopin", foyers: 1 },
  { nom: "kervillou", foyers: 1 },
  { nom: "beauval", foyers: 1 },
  { nom: "toul roc'h", foyers: 1 },
  { nom: "pen ar ster", foyers: 1 },
  { nom: "ponton mein", foyers: 1 },
  { nom: "le vuch", foyers: 2 },
  { nom: "kerguiffiou vihan", foyers: 1 },
  { nom: "Quinquis leurou", foyers: 2 },
  { nom: "Petit paris", foyers: 5 },
  { nom: "Kermorou", foyers: 3 },
  { nom: "Kerguelezen", foyers: 2 },
  { nom: "Kervenal", foyers: 3 },
  { nom: "St guillaume", foyers: 3 },
  { nom: "Kermorvan", foyers: 2 },
  { nom: "Moulin de kermorvan", foyers: 1 },
  { nom: "Kerhenry", foyers: 0 },
  { nom: "Pempoulrot", foyers: 4 },
  { nom: "Kerfloc'h an dour", foyers: 2 },
  { nom: "Crec'h an guel", foyers: 1 },
  { nom: "Pouligou", foyers: 2 },
  { nom: "Kerscaven", foyers: 1 },
  { nom: "gouledic", foyers: 3 },
  { nom: "quinquiziou", foyers: 1 },
  { nom: "Kerbiquet", foyers: 4 },
  { nom: "Toul ar soudard", foyers: 1 },
  { nom: "Kernevezlan", foyers: 2 }
];

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function geocodeLieuDit(lieuDit) {
  if (Number.isFinite(lieuDit.lat) && Number.isFinite(lieuDit.lon)) {
    return lieuDit;
  }

  const url = new URL("https://api-adresse.data.gouv.fr/search/");
  url.search = new URLSearchParams({
    q: lieuDit.nom,
    postcode,
    limit: "1"
  }).toString();

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "KergristMoelou-Collectif-Geocoder/1.0" },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.error(`HTTP ${response.status} pour « ${lieuDit.nom} »`);
      return { ...lieuDit, lat: null, lon: null };
    }

    const result = await response.json();
    const coordinates = result.features?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      console.warn(`Aucun résultat pour « ${lieuDit.nom} »`);
      return { ...lieuDit, lat: null, lon: null };
    }

    const [lon, lat] = coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      console.warn(`Coordonnées invalides pour « ${lieuDit.nom} »`);
      return { ...lieuDit, lat: null, lon: null };
    }

    return { ...lieuDit, lat, lon };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Erreur pour « ${lieuDit.nom} » : ${message}`);
    return { ...lieuDit, lat: null, lon: null };
  }
}

async function main() {
  const results = [];

  for (let index = 0; index < lieuxDits.length; index++) {
    if (index > 0) await wait(delayMs);

    const lieuDit = lieuxDits[index];
    const result = await geocodeLieuDit(lieuDit);
    results.push(result);
    console.log(`[${index + 1}/${lieuxDits.length}] ${lieuDit.nom}: ${result.lat ?? "introuvable"}, ${result.lon ?? "introuvable"}`);
  }

  const temporaryPath = `${outputPath}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
  await fs.rename(temporaryPath, outputPath);

  const foundCount = results.filter(item => item.lat !== null && item.lon !== null).length;
  console.log(`\nTerminé : ${foundCount}/${results.length} lieux géolocalisés.`);
  console.log(`Résultat enregistré dans : ${outputPath}`);
  if (foundCount < results.length) {
    console.log("Les lieux non trouvés ont lat et lon à null; relisez-les manuellement avant de planifier une tournée.");
  }
}

main().catch(error => {
  console.error("Échec du géocodage :", error);
  process.exitCode = 1;
});
