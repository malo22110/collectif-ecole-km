const fs = require('fs');
let code = fs.readFileSync('app/espace-membre/page.tsx', 'utf8');

// Change max-w-4xl to max-w-5xl globally
code = code.replace(/max-w-4xl/g, 'max-w-5xl');

// Rewrite the main layout
const gridOld = `<div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar Action */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Printer size={32} />
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">Kit de porte-à-porte</h2>
              <p className="text-sm text-stone-600 mb-6">
                Imprimez la version papier de la pétition pour la faire signer à vos voisins et amis.
              </p>
              <Link 
                href="/espace-membre/imprimer" 
                target="_blank"
                className="btn-primary w-full justify-center flex items-center gap-2"
              >
                <Printer size={18} /> Imprimer la pétition
              </Link>
            </div>
            
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
              <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} /> Consignes
              </h3>
              <ul className="text-sm text-emerald-800 space-y-2 list-disc pl-4">
                <li>Demandez à écrire <strong>en MAJUSCULES</strong> pour faciliter notre saisie.</li>
                <li>Le <strong>lien avec l'école</strong> est crucial pour le Sous-Préfet.</li>
                <li>Ramenez les feuilles remplies à Axelle ou Malo.</li>
              </ul>
            </div>
          </div>

          {/* Cheat Sheet */}
          <div className="md:col-span-2">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100">`;

const gridNew = `
        <div className="space-y-8 md:space-y-12">
          {/* Action : Print Petition (Top) */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-200 flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <Printer size={40} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Kit de porte-à-porte</h2>
              <p className="text-stone-600 mb-4 md:mb-0 text-base md:text-lg">
                Imprimez la version papier de la pétition pour récolter des signatures dans votre entourage.
              </p>
            </div>
            <div className="w-full md:w-auto shrink-0 flex flex-col gap-3">
              <Link 
                href="/espace-membre/imprimer" 
                target="_blank"
                className="btn-primary justify-center flex items-center gap-2 py-3 px-8 text-lg w-full md:w-auto shadow-md shadow-emerald-600/20"
              >
                <Printer size={20} /> Imprimer (A4)
              </Link>
            </div>
          </div>
          
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="font-bold text-emerald-900 flex items-center gap-2 shrink-0 text-lg">
              <AlertTriangle size={24} /> Consignes clés :
            </div>
            <ul className="text-emerald-800 flex-1 space-y-2 md:space-y-0 md:flex gap-6 list-none text-base">
              <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div> Faire écrire <strong>en MAJUSCULES</strong></li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div> Bien préciser le <strong>lien avec l'école</strong></li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div> Ramener à Axelle ou Malo</li>
            </ul>
          </div>

          {/* Cheat Sheet */}
          <div>
            <div className="bg-white p-5 md:p-10 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200">`;

code = code.replace(gridOld, gridNew);

// Since we replaced the `md:col-span-2` div, we need to remove one closing `</div>` at the end
code = code.replace(`              </div>
            </div>
          </div>
        </div>
      </main>`, `              </div>
            </div>
          </div>
        </div>
      </main>`); // Wait, let's just make sure the `</div>` count is correct. Let's just fix it properly.

// Let's rewrite the whole main block to be safe.
