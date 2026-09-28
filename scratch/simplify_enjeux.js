import fs from 'fs';

let content = fs.readFileSync('app/historique/page.tsx', 'utf8');

const regex = /(<div className="space-y-6">)([\s\S]*?)(<\/div>\s*<CommentBadge topic="Enjeux financiers")/s;
const replacement = `$1
            {!isSimplified ? (
              <>
$2
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-rose-50 text-rose-800 p-4 md:p-6 rounded-xl border border-rose-200">
                  <strong className="block mb-2 flex items-center gap-2 text-rose-900"><AlertCircle size={20} /> Le risque immédiat : ~ 70 000 €</strong>
                  <p className="text-sm">C'est le coût des études (diagnostics, architectes) <strong>déjà réalisées</strong> à ce jour. Si on abandonne l'école, la mairie devra quand même payer cette somme (règle légale du "service fait"). 70 000 € d'argent public seront perdus dans le vide.</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-4 md:p-6 rounded-xl border border-emerald-200">
                  <strong className="block mb-2 flex items-center gap-2 text-emerald-900"><CheckCircle size={20} /> La solution (Option 1)</strong>
                  <p className="text-sm">Continuer le projet d'ajustement permet de rentabiliser ces 70 000 € et de sécuriser <strong>340 000 € de subventions</strong>, ramenant le reste à charge des travaux à environ 212 000 €, ce qui est largement dans la capacité de la commune.</p>
                </div>
              </div>
            )}
$3`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('app/historique/page.tsx', content);
  console.log("Enjeux financiers simplifiés!");
} else {
  console.log("Could not find the Enjeux block.");
}
