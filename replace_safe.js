const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

const newAnalyse = `        {/* ANALYSE GLOBALE */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">Analyse Comparative Détaillée</h2>
          <p className="text-stone-600 text-center max-w-2xl mx-auto mb-10">
            Évaluation financière des 3 options stratégiques basée sur les capacités réelles de la commune (emprunt de 400 000 € validé par le Trésor public, excédent 2025 de 176 103 €) et les exigences de subvention de l'État.
          </p>
          
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 md:p-10 mb-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold px-6 py-2 rounded-bl-2xl">
              Option Recommandée
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
              <CheckCircle size={28} className="text-emerald-500" />
              Option 1 : Optimisation de l'APD (Projet Révisé)
            </h3>
            <p className="text-stone-600 mb-6">
              Conserver l'Avant-Projet Définitif actuel en le révisant à la baisse (conservation des menuiseries, dalle béton simple, réseau SCIC Koad COB), pour rester sous la barre des 800 000 € demandée par le Sous-préfet.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">Dépenses & Pertes</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Travaux révisés Phase 1</span>
                  <span className="font-bold">550 000 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Avenant d'architecte (coût de la décision)</span>
                  <span className="font-bold text-rose-600">+ 2 170 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Études antérieures gâchées (perte sèche)</span>
                  <span className="font-bold text-emerald-600">0 €</span>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">Aides sécurisées (Avant déc. 2026)</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Département & Région</span>
                  <span className="font-bold text-emerald-600">160 000 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">DETR État (30% de 550k€)</span>
                  <span className="font-bold text-emerald-600">165 000 €</span>
                </div>
              </div>
            </div>
            <div className="mt-8 bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-emerald-900 font-bold mb-1">Bilan net pour la commune</div>
                <div className="text-sm text-emerald-800">
                  Le reste à charge (227k€) est couvert à 75% par l'excédent 2025 (176k€). L'emprunt résiduel n'est que de ~51 000 €.
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-700 whitespace-nowrap">
                227 170 € HT
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <AlertCircle size={24} className="text-amber-500" />
                Option 2 : Refonte a minima
              </h3>
              <p className="text-sm text-stone-600 mb-6 min-h-[60px]">
                Abandon de l'extension. Nouveau projet ciblé sur l'isolation et les normes urgentes.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Nouveaux honoraires d'études</span>
                  <span className="font-bold text-rose-600">35 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Perte sèche (études extension jetées)</span>
                  <span className="font-bold text-rose-600">~60 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Aides espérées (DETR 2026 perdue)</span>
                  <span className="font-bold text-amber-600">~80 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Coût des travaux</span>
                  <span className="font-bold">380 000 €</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-stone-900">Reste à charge</span>
                <span className="text-2xl font-bold text-stone-900">~335 000 € HT</span>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <XCircle size={24} className="text-rose-500" />
                Option 3 : Abandon Total
              </h3>
              <p className="text-sm text-stone-600 mb-6 min-h-[60px]">
                Geler l'opération, perdre l'ingénierie payée et repousser à la prochaine mandature.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Frais de résiliation architecte</span>
                  <span className="font-bold text-rose-600">~4 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Ingénierie facturée pour service fait</span>
                  <span className="font-bold text-rose-600">127 110 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Subventions annulées</span>
                  <span className="font-bold text-rose-600">- 159 855 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Coût d'un futur projet (2030)</span>
                  <span className="font-bold">&gt; 800 000 €</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-rose-900">Argent jeté sans travaux</span>
                <span className="text-2xl font-bold text-rose-600">131 110 € HT</span>
              </div>
            </div>
          </div>

          <div className="bg-stone-800 text-stone-100 p-8 rounded-3xl text-sm md:text-base leading-relaxed shadow-lg">
            <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
              <CheckCircle size={20} />
              Conclusion Financière
            </h4>
            <p>
              L'Option 1 est l'unique trajectoire rationnelle sur le plan comptable. Refuser l'avenant de 2 170 € HT pour ajuster les plans génère paradoxalement le reste à charge le plus élevé pour la commune, en détruisant mécaniquement <strong>127 110 €</strong> d'études déjà réalisées au titre du "service fait", et en rendant caduques plus de <strong>300 000 € d'aides</strong> de l'État, de la Région et du Département. Le reste à charge de l'Option 1 s'équilibre parfaitement avec l'excédent budgétaire 2025.
            </p>
          </div>
        </div>\n`;

const startIndex = code.indexOf('{/* ANALYSE GLOBALE */}');
const endIndex = code.indexOf('<section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">');

if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + newAnalyse + "      " + code.substring(endIndex);
    fs.writeFileSync('app/historique/page.tsx', code);
    console.log("Replaced using substring bounds safely!");
} else {
    console.log("Could not find bounds");
}

