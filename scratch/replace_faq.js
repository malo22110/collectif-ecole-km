import fs from 'fs';

let content = fs.readFileSync('app/espace-membre/page.tsx', 'utf8');

const regex = /(<h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100 print:mb-3">\s*<span className="bg-blue-100 p-2 rounded-xl text-2xl print:bg-white print:p-0">🛡️<\/span> 3\. FAQ Express\s*<\/h3>)([\s\S]*?)(<\/div>\s*<\/div>\s*\{\/\* Conclusion \*\/})/s;

const newFaq = `<h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100 print:mb-3">
                  <span className="bg-blue-100 p-2 rounded-xl text-2xl print:bg-white print:p-0">🛡️</span> 3. FAQ Express (Spécial Porte-à-Porte)
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6 print:gap-4 print:grid-cols-1">
                  
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"La commune n'a pas les moyens !"</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed print:text-sm print:text-stone-900"><strong>Faux.</strong> Le Trésor public nous autorise 400 000 € d'emprunt. Une fois les aides déduites, le projet optimisé coûte 212 000 €. C'est largement finançable et ça laisse de l'argent pour les autres projets, sans même toucher à notre excédent (176 000 €).</span></div>
                  </div>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"On ferait des économies en annulant tout."</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed print:text-sm print:text-stone-900"><strong>C’est un gouffre.</strong> Si on annule, la loi nous oblige à payer au moins 70 000 €* d'études déjà réalisées, pour zéro travaux. En prime, on perd nos 340 000 € de subventions. On paiera pour du vent.</span></div>
                  </div>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"Pourquoi ne pas repartir de zéro en faisant plus petit ?"</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed print:text-sm print:text-stone-900"><strong>Pire option.</strong> On jette l'argent déjà dépensé, et faire "plus petit" annule toutes nos aides (qui exigent une vraie rénovation thermique). La commune devrait alors payer les rustines à 100 %.</span></div>
                  </div>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"Faisons juste les urgences pour le radon (50 000 €)."</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed print:text-sm print:text-stone-900">Sans aide globale, la facture réelle sera d'au moins 120 000 € (50 000 € de travaux + les 70 000 €* d'études jetées à la poubelle). Tout ça pour garder une passoire thermique.</span></div>
                  </div>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"Pourquoi y a-t-il urgence ?"</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed print:text-sm print:text-stone-900">L'aide de l'État (180 000 €) a une date d'expiration stricte. Si la mairie continue de bloquer pour un petit avenant de 2 170 €, notre argent partira financer l'école d'un autre village.</span></div>
                  </div>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"Au début, vous parliez de 127 000 € jetés, vos chiffres changent !"</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed print:text-sm print:text-stone-900"><strong>On est 100 % transparents :</strong> 127 000 €, c'est ce que la mairie a provisionné au total. Au moins 70 000 €*, c'est ce qu'on devra sortir <em>immédiatement</em> de notre poche pour payer le travail déjà fait si le projet s'arrête net. Le gaspillage est colossal.</span></div>
                  </div>

                </div>

                <div className="mt-4 p-4 text-sm text-stone-500 bg-stone-100 rounded-xl print:bg-white print:border print:border-stone-300 print:text-stone-600">
                  <p><strong>* Note de transparence :</strong> Les 70 000 € représentent la perte sèche minimum stricte calculée sur les contrats arrêtés à la fin de l'ancienne mandature (mars 2026). Toute nouvelle facture d'étude payée par l'actuelle municipalité depuis avril ne ferait qu'alourdir ce gaspillage.</p>
                </div>
              </div>
              
              {/* Conclusion */}`;

if (content.match(regex)) {
  content = content.replace(regex, newFaq);
  fs.writeFileSync('app/espace-membre/page.tsx', content);
  console.log("FAQ Replaced!");
} else {
  console.log("Could not find FAQ block.");
}
