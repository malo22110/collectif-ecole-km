const fs = require('fs');

let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

const target = `                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">`;

const replacement = `                        
                        {/* Financial Box */}
                        {event.budget && (
                          <div className="mt-4 bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm">
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-stone-500 shrink-0">Études :</span>
                                <span className="font-medium text-stone-800 text-right">{event.budget.etudes}</span>
                              </div>
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-stone-500 shrink-0">Travaux :</span>
                                <span className="font-medium text-stone-800 text-right">{event.budget.travaux}</span>
                              </div>
                              <div className="pt-2 mt-1 border-t border-stone-200 flex justify-between items-start gap-4">
                                <span className="font-bold text-stone-900 shrink-0">Total estimé :</span>
                                <span className="font-bold text-emerald-700 text-right">{event.budget.total}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">`;

if (!code.includes('{event.budget && (')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('app/historique/page.tsx', code);
  console.log('UI updated for budgets.');
}
