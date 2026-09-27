const fs = require('fs');
const path = 'app/admin/ArticleManager.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace standard text/date inputs
code = code.replace(/className="w-full px-4 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none"/g, 'className="input-base"');

// Replace select
code = code.replace(/className="w-full px-4 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"/g, 'className="input-base"');

// Buttons
code = code.replace(/className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 disabled:bg-emerald-400"/g, 'className="btn-primary"');
code = code.replace(/className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"/g, 'className="btn-primary"');

// Labels
code = code.replace(/className="block text-sm font-medium text-stone-700 mb-1"/g, 'className="input-label"');

fs.writeFileSync(path, code);
