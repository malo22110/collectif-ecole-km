const fs = require('fs');

const timeline = [
  {
    "date": "Juillet 2023 – Décembre 2023",
    "title": "Lancement des études et cadrage",
    "description": "Validation de l'ADAC en tant qu'Assistant à Maîtrise d'Ouvrage (AMO) pour la réhabilitation. Concertation avec les enseignantes, l'APE et le CAUE pour définir les besoins (3 classes, sanitaires, BCD). Premières demandes de subvention.",
    "sourceLabel": "PV du 4 Juil. et 14 Déc. 2023",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2023/10/PV-DU-04072023.pdf",
    "color": "bg-emerald-500"
  },
  {
    "date": "Mai 2024",
    "title": "Déblocage des contraintes patrimoniales",
    "description": "Après échange avec l'Architecte des Bâtiments de France (ABF), la mairie obtient l'accord écrit pour créer une extension sur la façade arrière sans dénaturer le patrimoine.",
    "sourceLabel": "PV de Mai 2024",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2025/04/pv-kergrist-moelou-05-2024.pdf",
    "color": "bg-emerald-500"
  },
  {
    "date": "Avril 2025 – Juin 2025",
    "title": "Structuration de la maîtrise d'œuvre",
    "description": "Lancement de l'AMO Kerlotec. Choix définitif du cabinet d'architecte Blandine Houssais (en partenariat avec Patine Office) pour 68 750 € HT d'honoraires. Chiffrage prévisionnel des travaux à 576 500 € HT.",
    "sourceLabel": "PV du 19 Juin 2025",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2026/02/PV-19-06-2025.pdf",
    "color": "bg-emerald-500"
  },
  {
    "date": "Septembre 2025",
    "title": "Présentation de l'Avant-Projet Sommaire",
    "description": "Bilan comptable acté : 127 110 € HT d'études sont déjà engagés par contrats. Notification officielle des financements accordés par le Département et la Région, sécurisant fermement 159 855 € de subventions. Le conseil demande un recentrage du coût évalué.",
    "sourceLabel": "PV du 11 Sept. 2025",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2026/02/PV-du-11-09-2025.pdf",
    "color": "bg-emerald-500"
  },
  {
    "date": "Octobre 2025",
    "title": "Validation de l'APS ferme",
    "description": "Validation à la majorité par le conseil municipal du montant de 617 500 € HT. L'enveloppe intègre notamment 41 000 € HT de travaux obligatoires pour le traitement du radon.",
    "sourceLabel": "PV du 9 Oct. 2025",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2026/02/PV-9-10-2025.pdf",
    "color": "bg-emerald-500"
  },
  {
    "date": "Novembre 2025",
    "title": "Validation de l'Avant-Projet Définitif (APD)",
    "description": "Scission stratégique du projet en 2 phases pour alléger les coûts. Phase 1 (Classes, préau, chaufferie) : 615 278 € HT. Phase 2 optionnelle (Motricité) : 120 210 € HT. Vote d'une décision budgétaire ajoutant 22 243 € d'études.",
    "sourceLabel": "PV du 27 Nov. 2025",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2026/02/PV-27-11-2025.pdf",
    "color": "bg-emerald-500"
  },
  {
    "date": "Mars 2026 – Septembre 2026",
    "title": "Arrêt du projet & mobilisation",
    "description": "La nouvelle équipe municipale refuse de voter un devis complémentaire technique de seulement 2 170 € HT destiné à revoir le projet à la baisse, provoquant l'arrêt brutal des études. Le 26 septembre, lancement du collectif citoyen.",
    "sourceLabel": "Charte du Collectif",
    "sourceUrl": "#",
    "color": "bg-amber-500"
  }
];

fs.writeFileSync('data/timeline.json', JSON.stringify(timeline, null, 2));
