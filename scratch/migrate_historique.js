const fs = require('fs');
const os = require('os');
const https = require('https');
const timelineData = require('../data/timeline.json');

const pageData = {
  header: {
    title: "Historique & Analyse du Projet",
    subtitle: "Chronologie des décisions et analyse financière complète basée exclusivement sur les actes officiels de la mairie (procès-verbaux du conseil municipal, arrêtés de subventions, et dossiers de demande à l'État)."
  },
  alerts: [
    {
      type: "warning",
      text: "Ce document de synthèse est **en cours de validation par la communauté**. Les membres du collectif peuvent apporter leurs corrections et débattre en utilisant les boutons \"Commenter\" disponibles à chaque section, ou dans l'espace général en bas de page."
    },
    {
      type: "info",
      title: "📌 Transparence et périmètre de l'analyse",
      text: "L'étude financière et la chronologie présentées ci-dessous s'appuient rigoureusement sur les actes officiels et les contrats validés jusqu'en mars 2026, date de fin de la précédente mandature. Le collectif a désormais pour mission de se rapprocher de l'actuelle municipalité afin d'obtenir les éventuelles factures et délibérations des six derniers mois (d'avril à septembre 2026). Ces documents permettront d'actualiser le chiffrage exact des dépenses déjà engagées, sachant que toute nouvelle facture réglée depuis le printemps ne fera qu'augmenter le montant de la perte sèche estimée aujourd'hui à plus de 70 000 €."
    }
  ],
  lexicon: [
    { title: "AMO (Assistant à Maîtrise d'Ouvrage)", desc: "Expert technique/financier accompagnant la mairie dans le pilotage du projet et la recherche de subventions." },
    { title: "Maîtrise d'Œuvre (Architectes, BET)", desc: "Équipe concevant les plans et dirigeant les travaux." },
    { title: "APS & APD", desc: "**APS :** Avant-Projet Sommaire (Esquisses/1er chiffrage).<br/>**APD :** Avant-Projet Définitif (Plans détaillés/Budget final)." },
    { title: "DETR / DSIL", desc: "Subvention de l'État exigeant des performances énergétiques strictes. L'école est éligible via le Fonds Vert." },
    { title: "BDB (Bâtiment Durable Breton)", desc: "Démarche qualitative valorisant l'écoconstruction, conditionnant les 60 450 € d'aides régionales." },
    { title: "SCIC (Koad COB)", desc: "Réseau local de chaleur au bois." }
  ],
  timeline: timelineData
};

const configPath = `${os.homedir()}/.config/configstore/firebase-tools.json`;
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = config.tokens.access_token;

// Map JS object to Firestore Document format
function jsonToFirestore(obj) {
  if (typeof obj === 'string') return { stringValue: obj };
  if (typeof obj === 'number') return Number.isInteger(obj) ? { integerValue: String(obj) } : { doubleValue: obj };
  if (typeof obj === 'boolean') return { booleanValue: obj };
  if (Array.isArray(obj)) return { arrayValue: { values: obj.map(jsonToFirestore) } };
  if (obj === null) return { nullValue: null };
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = jsonToFirestore(v);
  }
  return { mapValue: { fields } };
}

const firestoreDoc = {
  fields: jsonToFirestore(pageData).mapValue.fields
};

const dataStr = JSON.stringify(firestoreDoc);

const options = {
  hostname: 'firestore.googleapis.com',
  port: 443,
  path: '/v1/projects/collectif-ecole-km/databases/ecole-db/documents/pages/historique',
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(dataStr)
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Migration status:", res.statusCode);
    if (res.statusCode >= 400) console.log(data);
  });
});

req.on('error', e => console.error(e));
req.write(dataStr);
req.end();
