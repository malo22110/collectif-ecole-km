const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

// Replace the BOUTON COMMENTAIRE GLOBAL with the actual Comments embed
const searchString = `{/* BOUTON COMMENTAIRE GLOBAL */}
        <div className="mt-12 text-center">
          <button 
            onClick={() => setActiveTopic("Général")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold transition-all shadow-sm hover:shadow-md"
          >
            <MessageCircle size={20} />
            {commentCounts["Général"] > 0 ? \`Voir les \${commentCounts["Général"]} commentaires\` : "Participer au débat"}
          </button>
        </div>`;

const replaceString = `{/* ESPACE COMMENTAIRES */}
        <div className="max-w-7xl mx-auto px-4 pb-16 text-left">
          <Comments topic="Général" />
        </div>`;

code = code.replace(searchString, replaceString);
fs.writeFileSync('app/historique/page.tsx', code);
