const fs = require('fs');
const path = 'app/historique/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const lexiqueRegex = /<div className="mb-12">\s*<div className="text-left">\s*<h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center justify-center md:justify-start gap-2">\s*<BookOpen className="text-emerald-600" \/>\s*Petit Lexique pour tout comprendre\s*<\/h2>[\s\S]*?<\/div>\s*<\/div>/;
const match = code.match(lexiqueRegex);

if (match) {
  // Remove from the top
  code = code.replace(lexiqueRegex, '');

  const newLexique = `
      <section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 flex items-center gap-2">
            <BookOpen className="text-emerald-600" />
            Petit Lexique pour tout comprendre
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">AMO (Assistant à Maîtrise d'Ouvrage)</h3>
              <p className="text-sm text-stone-600">Un expert technique ou financier embauché par la mairie pour l'aider à définir le projet, choisir les architectes et suivre le chantier.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">Maîtrise d'Œuvre (Architectes)</h3>
              <p className="text-sm text-stone-600">L'équipe chargée de concevoir les plans de l'école et de diriger les travaux.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">APS & APD</h3>
              <p className="text-sm text-stone-600"><strong>APS :</strong> Avant-Projet Sommaire (Esquisses et 1er chiffrage).<br/><strong>APD :</strong> Avant-Projet Définitif (Plans détaillés et budget final).</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">DETR</h3>
              <p className="text-sm text-stone-600"><strong>Dotation d’Équipement des Territoires Ruraux.</strong> Subvention majeure de l'État indispensable au projet, avec une date butoir d'engagement fin 2026.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">SCIC (Koad COB)</h3>
              <p className="text-sm text-stone-600"><strong>Société Coopérative d'Intérêt Collectif.</strong> Le réseau de chaleur au bois local auquel l'école pourrait se raccorder.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">ABF</h3>
              <p className="text-sm text-stone-600"><strong>Architecte des Bâtiments de France.</strong> Autorité qui s'assure que le projet respecte le patrimoine et l'architecture locale.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">APE</h3>
              <p className="text-sm text-stone-600"><strong>Association des Parents d'Élèves.</strong> Représentants très impliqués dans la concertation pour l'école.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">BCD</h3>
              <p className="text-sm text-stone-600"><strong>Bibliothèque Centre Documentaire.</strong> Espace lecture et bibliothèque dédié aux enfants au sein de l'école.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">ADAC & CAUE & ALECOB</h3>
              <p className="text-sm text-stone-600">Agences départementales (ADAC, CAUE) et locale (ALECOB) apportant leur expertise technique, d'urbanisme ou énergétique au projet.</p>
            </div>
          </div>
        </div>
      </section>
`;

  // Insert before {/* SIDE PANEL (DRAWER) */}
  code = code.replace('{/* SIDE PANEL (DRAWER) */}', newLexique + '\n      {/* SIDE PANEL (DRAWER) */}');

  fs.writeFileSync(path, code);
  console.log('Lexique updated and moved to bottom');
} else {
  console.log('Regex did not match.');
}
