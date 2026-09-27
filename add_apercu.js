const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

const target = `<p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
          Chronologie des décisions et analyse financière complète basée sur les procès-verbaux officiels du conseil municipal.
        </p>`;

const replacement = `<p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
          Chronologie des décisions et analyse financière complète basée sur les procès-verbaux officiels du conseil municipal.
        </p>
        
        {/* ENJEUX FINANCIERS */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 text-left max-w-3xl mx-auto p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
            <TrendingDown className="text-emerald-600" />
            Aperçu des enjeux financiers
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-rose-100 p-1.5 rounded-lg text-rose-700 shrink-0"><AlertCircle size={18} /></div>
              <div>
                <strong className="text-stone-900 block">Engagements et études d'ingénierie : 127 110 € HT</strong>
                <span className="text-stone-600 text-sm">Formellement engagés auprès des prestataires (architectes, AMO, audits énergétiques) et dus au titre du service fait.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-emerald-100 p-1.5 rounded-lg text-emerald-700 shrink-0"><CheckCircle size={18} /></div>
              <div>
                <strong className="text-stone-900 block">Subventions actées menacées d'annulation : 159 855 €</strong>
                <span className="text-stone-600 text-sm">Sécurisés (99 405 € du Département des Côtes-d'Armor et 60 450 € de la Région Bretagne).</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-blue-100 p-1.5 rounded-lg text-blue-700 shrink-0"><BookOpen size={18} /></div>
              <div>
                <strong className="text-stone-900 block">Montant arrêté du projet (APD) : 735 489,05 € HT</strong>
                <span className="text-stone-600 text-sm">615 278,09 € HT pour la Phase 1 (Classes, garderie, chaufferie, préau) et 120 210,96 € HT pour la Phase 2 (Salle de motricité).</span>
              </div>
            </div>
          </div>
        </div>`;

if (!code.includes('ENJEUX FINANCIERS')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('app/historique/page.tsx', code);
  console.log("Success add apercu");
}
