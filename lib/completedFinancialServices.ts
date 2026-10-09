// [SPEC-FIN-01] Décompte HT des prestations réalisées, arrêté à la dernière date fournie.
export const completedFinancialServices = [
  {
    title: "Diagnostics et études techniques préalables",
    description: "Obligations légales avant intervention sur le bâtiment",
    items: [
      { date: "13/06/2025", provider: "Roux & Jankowski", service: "Relevé topographique géomètre", amount: 2500 },
      { date: "21/07/2025", provider: "ADX Groupe", service: "Repérage amiante, plomb et parasites", amount: 1580 },
      { date: "29/09/2025", provider: "ECR Environnement", service: "Études géotechniques des sols", amount: 5110 },
      { date: "24/10/2025", provider: "BTP Consultants", service: "Coordination sécurité SPS", amount: 540 },
      { date: "25/03/2026", provider: "BTP Consultants", service: "Contrôle technique initial", amount: 1550 },
    ],
  },
  {
    title: "Assistance à maîtrise d’ouvrage (AMO)",
    description: "Accompagnement administratif, financier et recherche de subventions",
    items: [
      { date: "02/06/2025", provider: "Kerlotec", service: "Diagnostic, programme et montage du dossier", amount: 10300 },
      { date: "16/03/2026", provider: "Kerlotec", service: "Relecture des études, validation des budgets et optimisation", amount: 3200 },
    ],
  },
  {
    title: "Maîtrise d’œuvre (MOE)",
    description: "Conception du projet, des études initiales à la phase PRO",
    items: [
      { date: "30/06/2025", provider: "B. Houssais", service: "Architecte mandataire, phase DIAG-ESQ", amount: 2120 },
      { date: "28/07/2025", provider: "B. Houssais", service: "Architecte mandataire, phase APS", amount: 1125 },
      { date: "30/11/2025", provider: "B. Houssais", service: "Architecte mandataire, phase APD (80 %)", amount: 2312 },
      { date: "23/12/2025", provider: "B. Houssais", service: "Architecte mandataire, phase APD (solde 20 %)", amount: 578 },
      { date: "28/02/2026", provider: "B. Houssais", service: "Architecte mandataire, phase PRO", amount: 3465 },
      { date: "30/06/2025", provider: "Patine Office", service: "Architecte cotraitant, phase ESQ", amount: 1407 },
      { date: "01/08/2025", provider: "Patine Office", service: "Architecte cotraitant, phase APS", amount: 700 },
      { date: "01/12/2025", provider: "Patine Office", service: "Architecte cotraitant, phase APD", amount: 2160 },
      { date: "04/03/2026", provider: "Patine Office", service: "Architecte cotraitant, phase PRO", amount: 1890 },
      { date: "11/08/2025", provider: "Astrolab", service: "Architecte cotraitant, phases DIAG-ESQ", amount: 700 },
      { date: "11/08/2025", provider: "Astrolab", service: "Architecte cotraitant, phase APS", amount: 726 },
      { date: "23/12/2025", provider: "Astrolab", service: "Architecte cotraitant, phase APD", amount: 1000 },
      { date: "19/03/2026", provider: "Astrolab", service: "Architecte cotraitant, phase PRO", amount: 1633 },
      { date: "27/11/2025", provider: "Abaque Ingénierie", service: "Études fluides/thermiques, phases DIAG et APS", amount: 1620 },
      { date: "18/12/2025", provider: "Abaque Ingénierie", service: "Études fluides/thermiques, phase APD", amount: 2000 },
      { date: "31/03/2026", provider: "Abaque Ingénierie", service: "Études fluides/thermiques, phase PRO/DCE", amount: 2500 },
      { date: "29/09/2025", provider: "Opryme Ingénierie", service: "Économiste, phases DIAG/ESQ et APS", amount: 1000 },
      { date: "06/03/2026", provider: "Opryme Ingénierie", service: "Économiste, phases APD et PRO", amount: 1584 },
      { date: "17/09/2025", provider: "Judith Lemoine", service: "Paysagiste, phases ESQ et APS", amount: 1000 },
      { date: "08/12/2025", provider: "Judith Lemoine", service: "Paysagiste, phase APD", amount: 1530 },
    ],
  },
  {
    title: "Démarche environnementale Bâtiment Durable Breton (BDB)",
    description: "Prestations liées à la démarche de performance environnementale",
    items: [
      { date: "23/02/2026", provider: "Batylab", service: "Frais de dossier et suivi certificateur", amount: 3814 },
      { date: "23/02/2026", provider: "Astrolab", service: "Accompagnement BDB, phase APS", amount: 950 },
      { date: "23/02/2026", provider: "Astrolab", service: "Accompagnement BDB, phase APD", amount: 1700 },
      { date: "24/02/2026", provider: "Patine Office", service: "Études et réalisation des pièces BDB", amount: 1000 },
      { date: "24/02/2026", provider: "Abaque Ingénierie", service: "Mission complémentaire fluides/thermique BDB", amount: 4200 },
      { date: "28/02/2026", provider: "B. Houssais", service: "Réunion et travail de suivi BDB", amount: 500 },
      { date: "06/03/2026", provider: "Opryme Ingénierie", service: "Mission de chiffrage APD BDB", amount: 500 },
      { date: "19/03/2026", provider: "Astrolab", service: "Accompagnement BDB, phase PRO", amount: 1400 },
    ],
  },
] as const;

export const completedFinancialServicesCutoff = "31 mars 2026";

export const completedFinancialServicesTotal = completedFinancialServices.reduce(
  (total, category) =>
    total + category.items.reduce((categoryTotal, item) => categoryTotal + item.amount, 0),
  0,
);

export function getCompletedFinancialServicesCategoryTotal(
  category: (typeof completedFinancialServices)[number],
) {
  return category.items.reduce((total, item) => total + item.amount, 0);
}