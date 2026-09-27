const fs = require('fs');
const path = 'app/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white outline-none transition-all"/g, 'className="input-base"');

fs.writeFileSync(path, code);
