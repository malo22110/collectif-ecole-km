const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

const target = '<h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Historique & Analyse du Projet</h1>';

const replacement = `<div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-8 flex flex-col md:flex-row items-center justify-center gap-3 text-sm font-medium shadow-sm max-w-2xl mx-auto">
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <p>
            Ce document de synthèse est <strong>en cours de validation par la communauté</strong>. 
            Les membres du collectif peuvent apporter leurs corrections dans l'espace commentaire en bas de page.
          </p>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Historique & Analyse du Projet</h1>`;

if (!code.includes('en cours de validation par la communauté')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('app/historique/page.tsx', code);
  console.log("Success add disclaimer");
}
