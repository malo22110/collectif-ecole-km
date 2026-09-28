import fs from 'fs';

let content = fs.readFileSync('app/petition/page.tsx', 'utf8');

const proseStart = content.indexOf('<div className="prose prose-stone max-w-none text-stone-700 space-y-6">');
const proseEndMarker = '            </div>\n          </div>\n\n          {/* Sidebar (Form & Stats) */}';
const proseEnd = content.indexOf(proseEndMarker);

if (proseStart > -1 && proseEnd > -1) {
  const newProse = `<div className="prose prose-stone max-w-none text-stone-700 space-y-6">
              <p className="text-lg font-medium text-stone-800 leading-relaxed border-l-4 border-emerald-500 pl-4 bg-emerald-50 py-3 pr-4 rounded-r-xl">
                Nous demandons la poursuite et la réévaluation à la baisse du dossier de rénovation déjà engagé, afin d'aboutir à une solution économe (retour à l'enveloppe initiale de 550 000 € HT) et adaptée aux capacités de la commune, plutôt qu'à un blocage ou un abandon qui contraindrait à repartir de zéro.
              </p>
              
              <ul className="space-y-6 mt-8 list-none pl-0">
                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">Un projet déjà mature :</strong>
                    L'état d'avancement des études, des plans et des diagnostics techniques permet de démarrer les travaux sans repartir d'une page blanche. L'objectif est d'optimiser ce qui existe pour tenir le budget, pas de tout recommencer.
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">La préservation de l'argent public :</strong>
                    Sur l'enveloppe globale d'ingénierie budgétée par la mairie, environ 70 000 € de prestations ont déjà été effectivement réalisées à ce jour (plans d'architectes, assistance à maîtrise d'ouvrage, diagnostics obligatoires). La commune est légalement tenue de les payer (règle du "service fait"). Refuser de voter l'ajustement de 2 170 € nécessaire pour faire baisser le coût des travaux conduit à bloquer le projet et transforme ces 70 000 € d'argent public en perte sèche immédiate.
                  </div>
                </li>

                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">Le risque critique sur les subventions :</strong>
                    Le dossier actuel permet de sécuriser 340 000 € d'aides (État, Région, Département). Ces financements exigent strictement un projet global assurant 40 % d'économie d'énergie et sont soumis à des calendriers très serrés (date butoir en décembre 2026 pour l'État). Un abandon ou de petits "travaux rustines" nous feraient perdre définitivement cette manne financière. La mairie devrait alors payer les futurs travaux à 100 %.
                  </div>
                </li>

                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">L'urgence du calendrier des travaux :</strong>
                    Différer la réhabilitation repousse la livraison de plusieurs années (avec l'inflation inévitable des coûts de la construction) et fragilise durablement les conditions d'apprentissage et l'accueil de nos enfants.
                  </div>
                </li>

                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">Les contraintes réglementaires et sanitaires :</strong>
                    Les diagnostics réalisés imposent des travaux incontournables et urgents : gestion du radon, désamiantage du préau, remise aux normes de l'électricité, isolation d'un bâtiment très énergivore, réfection des sanitaires et mise en conformité de l'accessibilité PMR.
                  </div>
                </li>
              </ul>
              
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-amber-900 my-8 shadow-sm">
                <p className="font-medium text-center">
                  Repartir de zéro ou geler le projet repousserait dangereusement le traitement de ces impératifs prioritaires pour la santé et la sécurité des enfants.
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <p className="text-sm text-stone-500 italic">
                  Pour comprendre en détail les enjeux financiers, consultez notre dossier de synthèse :
                </p>
                <Link href="/historique" className="btn-secondary whitespace-nowrap text-sm flex items-center gap-2">
                  <FileText size={16} /> Lire l'historique complet
                </Link>
              </div>
`;

  const newContent = content.substring(0, proseStart) + newProse + content.substring(proseEnd);
  fs.writeFileSync('app/petition/page.tsx', newContent);
  console.log("Petition updated successfully!");
} else {
  console.log("Could not find boundaries.");
}
