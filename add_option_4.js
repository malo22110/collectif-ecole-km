const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

const oldGrid = '<div className="grid md:grid-cols-2 gap-8 mb-12">';
const newGrid = '<div className="grid md:grid-cols-3 gap-6 mb-12">';

code = code.replace(oldGrid, newGrid);

const option3End = `              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-rose-900">Argent jeté sans travaux</span>
                <span className="text-2xl font-bold text-rose-600">131 110 € HT</span>
              </div>
            </div>`;

const option4Html = `
            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <AlertCircle size={24} className="text-rose-500" />
                Option 4 : Le Saupoudrage
              </h3>
              <p className="text-sm text-stone-600 mb-6 min-h-[60px]">
                Mise aux normes stricte (radon, élec) sans vision thermique ni pédagogique. Effet "Subvention Zéro".
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Travaux d'urgence (Budget 2026)</span>
                  <span className="font-bold text-rose-600">50 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Pertes sèches (Études jetées)</span>
                  <span className="font-bold text-rose-600">127 110 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Subventions (Non éligible)</span>
                  <span className="font-bold text-rose-600">0 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Futurs travaux inévitables</span>
                  <span className="font-bold">&gt; à chiffrer</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-rose-900">Coût net (Rafistolage)</span>
                <span className="text-2xl font-bold text-rose-600">177 110 € HT</span>
              </div>
            </div>`;

code = code.replace(option3End, option3End + "\n" + option4Html);

const oldConclusion = `<p>
              L'Option 1 est l'unique trajectoire rationnelle sur le plan comptable. Refuser l'avenant de 2 170 € HT pour ajuster les plans génère paradoxalement le reste à charge le plus élevé pour la commune, en détruisant mécaniquement <strong>127 110 €</strong> d'études déjà réalisées au titre du "service fait", et en rendant caduques plus de <strong>300 000 € d'aides</strong> de l'État, de la Région et du Département. Le reste à charge de l'Option 1 s'équilibre parfaitement avec l'excédent budgétaire 2025.
            </p>`;

const newConclusion = `<div className="space-y-4">
              <p>
                L'Option 1 est l'unique trajectoire rationnelle sur le plan comptable. Refuser l'avenant de 2 170 € HT pour ajuster les plans détruit mécaniquement <strong>127 110 €</strong> d'études déjà réalisées au titre du "service fait", et rend caduques plus de <strong>300 000 € d'aides</strong> de l'État, de la Région et du Département.
              </p>
              <div className="bg-stone-900 border border-stone-700 p-4 rounded-xl text-stone-300">
                <strong className="text-rose-400 block mb-1">Le comparatif fatal (Option 4 vs Option 1) :</strong>
                Avec le "saupoudrage" (Option 4), la commune sort <strong>177 000 €</strong> de sa trésorerie pour ne récolter qu'une passoire thermique rafistolée, sans régler le problème de fond, en perdant 160 000 € d'aides à tout jamais.<br/><br/>
                Avec l'Option 1 (Optimisation), la commune sort <strong>227 000 €</strong> (dont 176k€ financés par l'excédent 2025). Pour une différence d'à peine 50 000 € par rapport au rafistolage toxique, la commune obtient un bâtiment totalement rénové, aux normes pour 30 ans, et économe en chauffage.
              </div>
            </div>`;

code = code.replace(oldConclusion, newConclusion);

// Also change the intro text that says "des 3 options" to "des 4 options"
code = code.replace('Évaluation financière des 3 options stratégiques', 'Évaluation financière des 4 options stratégiques');

fs.writeFileSync('app/historique/page.tsx', code);
