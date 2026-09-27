const fs = require('fs');
const path = 'app/components/Comments.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/className="w-full px-4 py-2 border border-stone-300 rounded-lg mb-4 focus:outline-none focus:border-emerald-500 bg-white text-stone-900"/g, 'className="input-base mb-4"');
// replace textareas
code = code.replace(/className="w-full p-4 border border-stone-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-\[120px\] resize-y bg-white text-stone-900"/g, 'className="input-base min-h-[120px] resize-y mb-4"');
code = code.replace(/className="w-full p-3 text-sm border border-stone-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-\[80px\] resize-y bg-white text-stone-900"/g, 'className="input-base min-h-[80px] resize-y mb-3 text-sm p-3"');

fs.writeFileSync(path, code);
