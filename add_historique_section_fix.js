const fs = require('fs');
const path = 'app/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const historiqueSection = `
        {/* Section Historique & Analyse Financière */}
        <section className="py-20 bg-amber-50 px-4 border-b border-amber-100">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-amber-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-bold mb-6">
                    <Search size={16} />
                    Dossier Spécial
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-6 leading-tight">
                    Comprendre le projet : <br/><span className="text-amber-600">Historique & Analyse financière</span>
                  </h2>
                  <p className="text-lg text-stone-600 mb-6 leading-relaxed">
                    Nous avons retracé l'intégralité de la chronologie du projet d'école à travers les procès-verbaux officiels du conseil municipal (de 2022 à 2026).
                  </p>
                  <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                    Découvrez en toute transparence les <strong>coûts réels, les subventions menacées</strong>, et le <strong>Stress Test</strong> comparant l'option d'une reprise du projet face à l'option d'un abandon définitif.
                  </p>
                  <a href="/historique" className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-6 py-3.5 rounded-xl font-medium transition-all hover:-translate-y-0.5 shadow-lg shadow-stone-900/20">
                    <BookOpen size={20} />
                    Lire le dossier complet
                  </a>
                </div>
                <div className="w-full md:w-1/3 flex justify-center hidden md:flex">
                  <div className="w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-amber-200 to-amber-100 rounded-full flex items-center justify-center shadow-inner border border-amber-300/50">
                    <Search size={80} className="text-amber-700 opacity-80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
`;

if (!code.includes('Section Historique & Analyse Financière')) {
  code = code.replace(
    /\{articles\.length > 0 && \(/,
    historiqueSection + '\n        {articles.length > 0 && ('
  );
  fs.writeFileSync(path, code);
  console.log('Section actually added!');
} else {
  console.log('Section already exists');
}

