import fs from 'fs';

let content = fs.readFileSync('app/espace-membre/page.tsx', 'utf8');

const regex = /(<div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300">\s*<div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size=\{24\}\/> <span className="text-lg">"Au début, vous parliez de 127 000 € jetés, vos chiffres changent !"<\/span><\/div>)/;

const newBlock = `<div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"127 000 € d'études, c'est beaucoup trop !"</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed print:text-sm print:text-stone-900"><strong>Ce ne sont pas juste des "dessins".</strong> Ça inclut tous les diagnostics imposés par la loi (amiante, plomb, radon, sols) et les calculs des ingénieurs (environ 20% du budget, la norme pour sécuriser un très vieux bâtiment public). Surtout, une partie de ces frais (19 000 €) est exigée par la Région pour pouvoir débloquer 60 000 € d'aides. C'est donc un passage obligatoire et hyper rentable pour la commune.</span></div>
                  </div>

                  $1`;

if (content.match(regex)) {
  content = content.replace(regex, newBlock);
  fs.writeFileSync('app/espace-membre/page.tsx', content);
  console.log("FAQ item added!");
} else {
  console.log("Could not find insertion point.");
}
