const fs = require('fs');
const path = 'app/admin/FaqManager.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace standard text inputs
code = code.replace(/className="w-full p-2 border border-stone-300 rounded-lg mb-3"/g, 'className="input-base mb-3"');
code = code.replace(/className="w-full p-2 border border-stone-300 rounded-lg mb-3 h-32"/g, 'className="input-base mb-3 h-32"');
// Replace number inputs
code = code.replace(/className="p-2 border rounded-lg w-20"/g, 'className="input-base w-20"');

// Replace buttons
code = code.replace(/className="px-4 py-2 border rounded-lg"/g, 'className="btn-secondary"');
code = code.replace(/className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2"/g, 'className="btn-primary"');
code = code.replace(/className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"/g, 'className="btn-primary"');

fs.writeFileSync(path, code);
