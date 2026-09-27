const fs = require('fs');
const path = 'app/admin/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/className="w-full px-4 py-2 border border-stone-300 rounded-xl text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"/g, 'className="input-base"');
code = code.replace(/className="block text-sm font-medium text-stone-700 mb-1"/g, 'className="input-label"');
code = code.replace(/className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700"/g, 'className="btn-primary w-full"');

fs.writeFileSync(path, code);
