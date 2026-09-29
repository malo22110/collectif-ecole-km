import fs from 'fs';

let content = fs.readFileSync('app/historique/page.tsx', 'utf8');

const regex = /(<div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-8 flex flex-col md:flex-row items-center justify-center gap-3 text-sm font-medium shadow-sm max-w-2xl mx-auto">[\s\S]*?<\/div>)/;

const replacement = `<div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-4 flex flex-col md:flex-row items-center justify-center gap-3 text-sm font-medium shadow-sm max-w-2xl mx-auto">
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <p>
            Ce document de synthèse est <strong>en cours de validation par la communauté</strong>. 
            Les membres du collectif peuvent apporter leurs corrections et débattre en utilisant les boutons "Commenter" disponibles à chaque section, ou dans l'espace général en bas de page.
          </p>
        </div>

        <div className="bg-sky-50 border border-sky-200 text-sky-900 px-5 py-4 rounded-xl mb-8 flex flex-col gap-2 text-sm shadow-sm max-w-2xl mx-auto text-left">
          <strong className="flex items-center gap-2 text-sky-950"><Info size={18} className="text-sky-700 shrink-0" /> 📌 Transparence et périmètre de l'analyse</strong>
          <p>
            L'étude financière et la chronologie présentées ci-dessous s'appuient rigoureusement sur les actes officiels et les contrats validés jusqu'en mars 2026, date de fin de la précédente mandature. Le collectif a désormais pour mission de se rapprocher de l'actuelle municipalité afin d'obtenir les éventuelles factures et délibérations des six derniers mois (d'avril à septembre 2026). Ces documents permettront d'actualiser le chiffrage exact des dépenses déjà engagées, sachant que toute nouvelle facture réglée depuis le printemps ne fera qu'augmenter le montant de la perte sèche estimée aujourd'hui à plus de 70 000 €.
          </p>
        </div>`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('app/historique/page.tsx', content);
  console.log("Addendum added!");
} else {
  console.log("Could not find the target block.");
}
