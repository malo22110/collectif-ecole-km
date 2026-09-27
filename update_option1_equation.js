const fs = require('fs');
const path = 'app/historique/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `<div className="space-y-4">
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
                </p>`;

const replacementStr = `<div className="space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">Aides sécurisées (À engager avant déc. 2026)</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Département & Région <span className="text-xs text-stone-400">(précisément 159 855 €)</span></span>
                  <span className="font-bold text-emerald-600">~ 160 000 €</span>
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
              <div className="bg-white/60 rounded-xl p-4 mb-6 text-sm border border-emerald-200">
                <strong className="text-emerald-900 block mb-2">Détail de l'équation financière :</strong>
                <div className="space-y-1 font-mono text-emerald-800">
                  <div className="flex justify-between"><span>Coût total du projet :</span><span>552 170 €</span></div>
                  <div className="flex justify-between text-xs text-emerald-700/70"><span>(550 000 € de travaux + 2 170 € d'avenant)</span></div>
                  <div className="flex justify-between text-emerald-600 pt-2"><span>Total des aides :</span><span>- 325 000 €</span></div>
                  <div className="flex justify-between text-xs text-emerald-600/70"><span>(160 000 € Région/Dép. + 165 000 € DETR)</span></div>
                  <div className="flex justify-between font-bold border-t border-emerald-200/60 pt-2 mt-2 text-base text-emerald-900"><span>Reste à charge réel :</span><span>= 227 170 € HT</span></div>
                </div>
              </div>
              <div className="space-y-4 text-sm md:text-base text-emerald-900/90 leading-relaxed">
                <p>
                  <strong className="text-emerald-950 block mb-1">Faisabilité financière :</strong>
                  Ce reste à charge est parfaitement absorbable et sécurisé. Il ne consomme qu'un peu plus de la moitié de la capacité d'emprunt de 400 000 € formellement validée par le Trésor public le 8 avril 2026.
                </p>`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync(path, code);
  console.log("Equation added successfully.");
} else {
  console.log("Could not find the target string.");
}
