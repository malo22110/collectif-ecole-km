const fs = require('fs');

let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

// 1. Add Toggle State
code = code.replace(
  'export default function HistoriquePage() {',
  'export default function HistoriquePage() {\n  const [isSimplified, setIsSimplified] = React.useState(true);\n'
);

// 2. Add Glossary UI at the bottom of the content container (before the </main>)
const glossaryUI = `
      <section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 flex items-center gap-2">
            <BookOpen className="text-emerald-600" />
            Petit Lexique pour tout comprendre
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-2">AMO (Assistant à Maîtrise d'Ouvrage)</h3>
              <p className="text-sm text-stone-600">Un expert technique ou financier embauché par la mairie pour l'aider à définir le projet, choisir les architectes et suivre le chantier. Il défend les intérêts de la commune.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-2">Maîtrise d'Œuvre (Architectes)</h3>
              <p className="text-sm text-stone-600">L'équipe (architectes, ingénieurs) chargée de concevoir les plans de l'école et de diriger les travaux sur le terrain.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-2">APS & APD</h3>
              <p className="text-sm text-stone-600"><strong>APS (Avant-Projet Sommaire) :</strong> Les premières esquisses et le premier chiffrage global.<br/><strong>APD (Avant-Projet Définitif) :</strong> Les plans détaillés et le budget figé avant de demander les permis de construire.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-2">Tranche optionnelle / conditionnelle</h3>
              <p className="text-sm text-stone-600">Une partie des travaux qui est dessinée sur les plans mais qui ne sera construite que si la mairie décide plus tard qu'elle a le budget nécessaire (ex: la salle de motricité).</p>
            </div>
          </div>
        </div>
      </section>
`;

// Insert the glossary just before </main>
code = code.replace('</main>', glossaryUI + '\n      </main>');

// 3. Import BookOpen and Toggle icon (like Languages or Eye)
if (!code.includes('BookOpen')) {
  code = code.replace('import { CheckCircle2, XCircle, ArrowRight, Clock } from "lucide-react";', 'import { CheckCircle2, XCircle, ArrowRight, Clock, BookOpen, Quote } from "lucide-react";');
}

// 4. Add the Toggle Switch UI above the timeline
const toggleUI = `
        {/* Toggle Simple/Détaillé */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-stone-200 p-1 rounded-full items-center">
            <button
              onClick={() => setIsSimplified(true)}
              className={\`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 \${isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'}\`}
            >
              Version "Pour les nuls" (Résumé)
            </button>
            <button
              onClick={() => setIsSimplified(false)}
              className={\`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 \${!isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'}\`}
            >
              Version Administrative (Détaillée)
            </button>
          </div>
        </div>
`;
code = code.replace(
  '<div className="max-w-4xl mx-auto relative">',
  toggleUI + '\n        <div className="max-w-4xl mx-auto relative">'
);

// 5. Use the simplified description based on the state
code = code.replace(
  '<p className="text-stone-600 mb-4">{item.description}</p>',
  '<p className="text-stone-600 mb-4">{isSimplified && item.simplifiedDescription ? item.simplifiedDescription : item.description}</p>'
);

// 6. Fix "React" undefined since we just used React.useState, let's make sure it's imported
if (!code.includes("import React")) {
  code = code.replace('import Link from "next/link";', 'import React from "react";\nimport Link from "next/link";');
} else {
  code = code.replace('import React from "react";', 'import React, { useState } from "react";');
  code = code.replace('React.useState(true)', 'useState(true)');
}

fs.writeFileSync('app/historique/page.tsx', code);
