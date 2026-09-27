const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB49RQeCyXWVTkX4nHtku5taKtrZZFtb7o",
  authDomain: "collectif-ecole-km.firebaseapp.com",
  projectId: "collectif-ecole-km",
  storageBucket: "collectif-ecole-km.firebasestorage.app",
  messagingSenderId: "1006373112548",
  appId: "1:1006373112548:web:fe34fca6b0a96dd3003af1",
  measurementId: "G-HTX7EN9MVE",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ecole-db');

const faqs = [
  {
    question: "La commune a-t-elle les moyens financiers de poursuivre ce projet ?",
    answer: "Oui. La situation financière de Kergrist-Moëlou est officiellement validée comme saine. Lors de la rencontre du 8 avril 2026 avec le Trésor public, le percepteur a confirmé que le taux d'endettement par habitant reste faible et a conseillé un emprunt pouvant aller jusqu'à 400 000 € maximum pour ne pas bloquer les autres projets du mandat. En optimisant le projet de l'école pour abaisser son coût global, le reste à charge de la commune s'inscrira largement en dessous de ce plafond.",
    order: 1,
    isActive: true
  },
  {
    question: "Ne ferait-on pas de vraies économies en annulant purement et simplement le projet ?",
    answer: "Non, l'annulation est l'option la plus coûteuse. La commune a déjà engagé 127 110 € HT en études obligatoires (architectes, diagnostics, audits). Ces factures devront être payées (règle du service fait), même si aucun mur n'est monté. De plus, l'annulation entraîne la perte immédiate des 159 855 € de subventions déjà notifiées par la Région et le Département. Abandonner le projet équivaut donc à détruire près de 290 000 € d'argent public en pure perte.",
    order: 2,
    isActive: true
  },
  {
    question: "Peut-on revoir le projet à la baisse en supprimant l'extension pour faire un projet \"a minima\" ?",
    answer: "C'est une fausse bonne idée. Les études déjà payées ont été conçues pour le bâtiment existant et son extension. Si l'on change radicalement le projet, ces études finissent à la corbeille (~60 000 € de perte) et il faudra payer de nouveaux architectes (~35 000 €). Surtout, modifier substantiellement le projet annule de plein droit les arrêtés de subventions de la Région et du Département (160 000 € d'aides). Le reste à charge pour la commune serait finalement plus élevé qu'avec le projet actuel optimisé.",
    order: 3,
    isActive: true
  },
  {
    question: "Pourquoi y a-t-il une urgence calendaire d'ici décembre 2026 ?",
    answer: "L'enveloppe de subvention de l'État (la DETR) est soumise à un calendrier strict : elle doit impérativement être engagée avant la fin du mois de décembre 2026. Geler le dossier aujourd'hui ou repartir de zéro nous fera rater cette échéance, nous privant définitivement d'une aide pouvant couvrir jusqu'à 30 % des travaux.",
    order: 4,
    isActive: true
  },
  {
    question: "Le budget 2026 prévoit déjà 50 000 € pour le radon. Ne suffit-il pas de faire uniquement ces travaux d'urgence ?",
    answer: "Voter des travaux isolés est financièrement inefficace. Ces 50 000 € inscrits au budget d'investissement seront payés à 100 % par la commune, car les subventions massives ne sont débloquées que pour des rénovations globales (thermiques et structurelles). Le coût réel de ce \"saupoudrage\" serait de 177 110 € (les 127 k€ d'études jetées + les 50 k€ de travaux radon). Pour un montant à peine supérieur (environ 230 000 € de reste à charge), la commune peut avoir une école entièrement neuve et aux normes grâce à l'effet de levier des subventions globales.",
    order: 5,
    isActive: true
  },
  {
    question: "Que se passe-t-il en cas de coup dur, si l'État nous refuse la DETR ?",
    answer: "C'est la force de l'optimisation du projet actuel : c'est le seul scénario qui résiste au \"scénario du pire\". Même sans la subvention de l'État, la commune préserve les 159 855 € de la Région et du Département, ainsi que les 127 110 € d'études déjà rentabilisés. Le reste à charge grimperait autour de 380 000 €, ce qui reste absorbable puisque le Trésor public a validé une capacité d'emprunt de 400 000 €. À l'inverse, le moindre accroc sur un projet abandonné ou rafistolé ferait exploser la facture bien au-delà des capacités de la commune.",
    order: 6,
    isActive: true
  }
];

async function run() {
  const faqRef = collection(db, "faqs");
  for (const faq of faqs) {
    await addDoc(faqRef, faq);
    console.log("Added: ", faq.question);
  }
  process.exit(0);
}

run().catch(console.error);
