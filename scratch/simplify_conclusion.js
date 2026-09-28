import fs from 'fs';

let content = fs.readFileSync('app/historique/page.tsx', 'utf8');

const regex = /(<h4 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">\s*<Info size=\{24\} className="text-emerald-700" \/>\s*Conclusion Objective : Pourquoi l'Option 1 s'impose\s*<\/h4>)\s*<div className="text-stone-800 space-y-4 text-sm">([\s\S]*?)<\/div>\s*<\/div>\s*<div className="mt-6">/s;

const replacement = `$1
              {!isSimplified ? (
                <div className="text-stone-800 space-y-4 text-sm">
$2
                </div>
              ) : (
                <div className="text-emerald-900 font-bold text-base md:text-lg leading-relaxed bg-white/50 p-4 rounded-xl">
                  Refuser l'Option 1 revient à endetter le village d'environ 70 000 € dans le vide pour des plans inutilisés, tout en gardant une école qui se dégrade et perd ses subventions. À l'inverse, l'Option 1 protège les finances de la commune en faisant financer plus de 60 % du chantier par l'État, la Région et le Département.
                </div>
              )}
            </div>
            <div className="mt-6">`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('app/historique/page.tsx', content);
  console.log("Conclusion simplifiée!");
} else {
  console.log("Could not find the Conclusion block.");
}
