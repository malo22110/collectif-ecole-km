import fs from 'fs';

let content = fs.readFileSync('app/petition/page.tsx', 'utf8');

const marker = `<Link href="/historique" className="btn-secondary whitespace-nowrap text-sm flex items-center gap-2">
                  <FileText size={16} /> Lire l'historique complet
                </Link>
              </div>`;

const addendumHTML = `
              <div className="mt-8 bg-stone-50 border border-stone-200 rounded-2xl p-6 md:p-8">
                <h4 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <span>📌</span> Addendum : Note de transparence aux premiers signataires
                </h4>
                <div className="space-y-4 text-sm text-stone-700">
                  <p>
                    Dans les premières heures du lancement de cette pétition, nous indiquions que l'abandon du projet transformerait "127 110 € d'études en pure perte". Notre collectif ayant depuis décortiqué les contrats administratifs précis (actes d'engagement des prestataires), nous avons tenu à affiner ce chiffre pour être d'une rigueur absolue.
                  </p>
                  <p>
                    <strong className="text-stone-900">Pourquoi ce changement ?</strong> 127 110 € est bien l'enveloppe globale et historique budgétée par la mairie pour les études. En revanche, si le projet est annulé demain, la somme que la commune devra débourser immédiatement de sa poche (pour le travail effectivement déjà réalisé à ce jour) est évaluée à environ 70 000 €.
                  </p>
                  <p>
                    <strong className="text-stone-900">Est-ce que cela change notre diagnostic ? Absolument pas.</strong> Le fond du problème reste exactement le même. Qu'il s'agisse de l'enveloppe globale ou de la perte sèche immédiate de 70 000 €, jeter des dizaines de milliers d'euros de nos impôts par les fenêtres pour n'avoir aucun travaux à la fin reste une aberration financière inacceptable. De plus, le risque de perdre les 340 000 € de subventions reste, lui, totalement inchangé.
                  </p>
                  <p className="font-medium text-stone-900 bg-stone-100 p-3 rounded-lg border border-stone-200">
                    Votre signature initiale est donc plus que jamais légitime, justifiée et fondée. En 4 jours, notre collectif a fait le choix de la transparence totale : nous ajustons nos textes au fur et à mesure que nous accédons aux documents officiels pour vous garantir l'information la plus juste possible.
                  </p>
                </div>
              </div>`;

if (content.includes(marker)) {
  const newContent = content.replace(marker, marker + "\n\n" + addendumHTML);
  fs.writeFileSync('app/petition/page.tsx', newContent);
  console.log("Addendum added successfully!");
} else {
  console.log("Could not find the marker.");
}
