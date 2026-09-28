import fs from 'fs';

let content = fs.readFileSync('app/espace-membre/page.tsx', 'utf8');

const cheatSheetStart = content.indexOf('{/* Cheat Sheet */}');
const cheatSheetEndMarker = '        </div>\n      </main>';
const cheatSheetEnd = content.indexOf(cheatSheetEndMarker);

if (cheatSheetStart > -1 && cheatSheetEnd > -1) {
  // We need to preserve the closing div of the flex container!
  // Looking at the original file:
  // {/* Cheat Sheet */}
  // <div className="bg-white rounded-3xl ...">
  // ...
  // </div> // ends Cheat Sheet container
  // </div> // ends flex container
  // </main>
  
  // So we replace everything from `{/* Cheat Sheet */}` up to `        </div>\n      </main>` 
  // BUT we need to make sure we leave the closing </div> for the flex container.

const newCheatSheet = `{/* Cheat Sheet */}
          <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
            <div className="bg-stone-900 p-6 md:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 print:bg-white print:text-stone-900 print:border-b-4 print:border-stone-900 print:p-0 print:pb-4">
              <div className="flex items-center gap-4">
                <div className="bg-amber-400 text-stone-900 p-3 md:p-4 rounded-2xl shrink-0 print:hidden">
                  <FileText size={32} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-1">L'Antisèche</h2>
                  <p className="text-stone-400 font-medium md:text-lg print:text-stone-600">Votre guide pour le Porte-à-Porte 🚪</p>
                </div>
              </div>
              <button 
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 bg-white text-stone-900 px-5 py-3 rounded-xl font-bold hover:bg-stone-100 transition-colors print:hidden"
              >
                <Printer size={20} />
                <span className="hidden sm:inline">Imprimer (PDF)</span>
                <span className="sm:hidden">Imprimer</span>
              </button>
            </div>

            <div className="p-6 md:p-10 space-y-12 print:p-0 print:space-y-8 print:mt-6">
              
              {/* Objectif & Règle */}
              <div className="grid md:grid-cols-2 gap-6 print:gap-4">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl print:border-2 print:border-blue-900 print:bg-white">
                  <div className="flex items-center gap-3 mb-3 text-blue-900 font-black text-lg">
                    <Target size={24} className="text-blue-600 print:text-blue-900" /> Votre objectif
                  </div>
                  <p className="text-blue-800 md:text-lg print:text-stone-900">Convaincre en 2 minutes chrono et faire signer la pétition.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl print:border-2 print:border-amber-900 print:bg-white">
                  <div className="flex items-center gap-3 mb-3 text-amber-900 font-black text-lg">
                    <Lightbulb size={24} className="text-amber-600 print:text-amber-900" /> La règle d'or
                  </div>
                  <p className="text-amber-800 md:text-lg print:text-stone-900">Restez souriant, factuel. Pas de querelles politiques. On parle d'avenir et du portefeuille de la commune.</p>
                </div>
              </div>

              {/* Accroche */}
              <div>
                <h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100 print:mb-3">
                  <span className="bg-stone-100 p-2 rounded-xl text-2xl print:bg-white print:p-0">🗣️</span> 1. L'Accroche
                </h3>
                <div className="bg-stone-50 border-l-4 border-stone-900 p-6 md:p-8 rounded-r-2xl print:bg-white print:p-4">
                  <p className="text-lg md:text-xl italic font-medium text-stone-700 leading-relaxed print:text-base">
                    "Bonjour ! Je suis [Prénom], du collectif pour l'école de Kergrist-Moëlou. Je passe car la rénovation de notre école est bloquée, ce qui met en péril 340 000 € de subventions pour la commune. Si on abandonne, on va aussi devoir jeter environ 70 000 € d'études par les fenêtres, payées avec nos impôts. Vous avez 2 minutes ?"
                  </p>
                </div>
              </div>

              {/* 3 Arguments */}
              <div className="print:break-inside-avoid">
                <h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100 print:mb-3">
                  <span className="bg-rose-100 p-2 rounded-xl text-2xl print:bg-white print:p-0">💥</span> 2. Les 3 arguments chocs
                </h3>
                
                <div className="space-y-6 print:space-y-4">
                  <div className="bg-white border-2 border-stone-100 p-6 md:p-8 rounded-2xl shadow-sm print:shadow-none print:p-4 print:border-stone-300">
                    <h4 className="font-black text-stone-900 text-lg md:text-xl mb-3 flex items-center gap-2 print:text-base">
                      <span className="text-emerald-600 print:text-stone-900">1️⃣</span> L'absurdité du blocage actuel
                    </h4>
                    <p className="text-stone-600 md:text-lg leading-relaxed print:text-sm print:text-stone-900">
                      "Certains élus refusent de voter un avenant technique de 2 170 €. Le problème, c'est qu'en bloquant ça, ils paralysent tout le dossier de subventions. On risque de perdre 340 000 € d'aides (Région, Département, État) qui paient 60 % du projet."
                    </p>
                  </div>

                  <div className="bg-white border-2 border-stone-100 p-6 md:p-8 rounded-2xl shadow-sm print:shadow-none print:p-4 print:border-stone-300 print:break-inside-avoid">
                    <h4 className="font-black text-stone-900 text-lg md:text-xl mb-3 flex items-center gap-2 print:text-base">
                      <span className="text-emerald-600 print:text-stone-900">2️⃣</span> Le vrai coût : ce n'est pas un projet "pharaonique"
                    </h4>
                    <p className="text-stone-600 md:text-lg leading-relaxed print:text-sm print:text-stone-900">
                      "Il y a eu des devis trop élevés par le passé (735 000 €), mais le projet actuel sur la table a été ajusté pour rentrer dans l'enveloppe initiale de <strong>550 000 €</strong>. Avec les aides, le reste à charge est de ~212 000 €, ce qui est largement dans notre capacité d'emprunt (400 000 €)."
                    </p>
                  </div>

                  <div className="bg-white border-2 border-stone-100 p-6 md:p-8 rounded-2xl shadow-sm print:shadow-none print:p-4 print:border-stone-300 print:break-inside-avoid">
                    <h4 className="font-black text-stone-900 text-lg md:text-xl mb-3 flex items-center gap-2 print:text-base">
                      <span className="text-emerald-600 print:text-stone-900">3️⃣</span> Le piège mortel de l'annulation
                    </h4>
                    <p className="text-stone-600 md:text-lg leading-relaxed print:text-sm print:text-stone-900">
                      "Si on abandonne, on doit quand même payer ce qui a été fait (diagnostics, architectes) : c'est <strong>~70 000 € de perte sèche</strong> immédiate. De plus, on devra renoncer aux aides (conditionnées à des travaux globaux). Faire juste des rustines plus tard nous coûtera au final bien plus cher, 100 % à notre charge."
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Express */}
              <div className="print:break-inside-avoid">
                <h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100 print:mb-3">
                  <span className="bg-blue-100 p-2 rounded-xl text-2xl print:bg-white print:p-0">🛡️</span> 3. FAQ Express
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6 print:gap-4 print:grid-cols-1">
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"Ça va ruiner la commune"</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed print:text-sm print:text-stone-900">Faux. Le projet optimisé à 550k€ laisse un reste à charge gérable (~212k€). L'abandon total serait bien pire puisqu'il endetterait la commune pour du vent (70k€ de frais d'études).</span></div>
                  </div>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"Faisons juste les urgences (radon)"</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed print:text-sm print:text-stone-900">Si on ne traite pas l'isolation globale (40% d'économies d'énergie), l'État retire toutes ses subventions. C'est l'opération la moins rentable.</span></div>
                  </div>
                </div>
              </div>

              {/* Conclusion */}
              <div className="print:break-inside-avoid">
                <h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100 print:mb-3">
                  <span className="bg-amber-100 p-2 rounded-xl text-2xl print:bg-white print:p-0">✍️</span> 4. La conclusion
                </h3>
                <div className="bg-emerald-50 border-l-4 border-emerald-600 p-6 md:p-8 rounded-r-2xl print:bg-white print:p-4">
                  <p className="text-lg md:text-xl font-bold text-emerald-900 leading-relaxed italic print:text-base print:text-stone-900">
                    "On veut juste protéger les finances de la commune et offrir une école saine. Il faut réunir une commission, valider l'Option 1 pour garder nos subventions. Vous pouvez signer la pétition pour appuyer cette démarche de bon sens ?"
                  </p>
                </div>
              </div>

            </div>
          </div>
`;

  let newContent = content.substring(0, cheatSheetStart) + newCheatSheet + "\n" + content.substring(cheatSheetEnd);
  
  if (!newContent.includes('Printer')) {
    newContent = newContent.replace('import { ', 'import { Printer, ');
  }

  fs.writeFileSync('app/espace-membre/page.tsx', newContent);
  console.log("Cheat sheet replaced successfully!");
} else {
  console.log("Could not find boundaries.");
}
