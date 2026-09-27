const fs = require('fs');
const path = 'app/historique/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `<div className="space-y-4">
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
            </div>`;

const replacementStr = `<div className="space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">Dépenses & Pertes</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Travaux révisés Phase 1</span>
                  <span className="font-bold">~ 550 000 €</span>
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
                <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">Aides sécurisées (À engager avant déc. 2026)</h4>
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
            <div className="mt-8 bg-emerald-50 border border-emerald-200 p-6 md:p-8 rounded-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-emerald-200/60">
                <div className="text-xl md:text-2xl text-emerald-900 font-black">Bilan net pour la commune</div>
                <div className="text-3xl md:text-4xl font-black text-emerald-700 whitespace-nowrap">
                  227 170 € HT
                </div>
              </div>
              <div className="space-y-4 text-sm md:text-base text-emerald-900/90 leading-relaxed">
                <p>
                  <strong className="text-emerald-950 block mb-1">Faisabilité financière :</strong>
                  Ce reste à charge est parfaitement absorbable et sécurisé. Il ne consomme qu'un peu plus de la moitié de la capacité d'emprunt de 400 000 € formellement validée par le Trésor public le 8 avril 2026.
                </p>
                <p>
                  <strong className="text-emerald-950 block mb-1">Avantage collatéral :</strong>
                  Cela préserve une marge de manœuvre intacte d'environ 170 000 € d'emprunt pour financer le reste du programme municipal (voirie, Maison Bonhomme), sans même avoir besoin de puiser dans la totalité de l'excédent budgétaire de 2025.
                </p>
              </div>
            </div>`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync(path, code);
  console.log("Option 1 updated successfully.");
} else {
  console.log("Could not find the target string for Option 1.");
}
