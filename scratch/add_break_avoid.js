import fs from 'fs';

let content = fs.readFileSync('app/espace-membre/page.tsx', 'utf8');

// Add print:break-inside-avoid to the FAQ items
content = content.replace(/className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300"/g, 'className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300 print:break-inside-avoid"');

// Add to the transparency note
content = content.replace(/className="mt-4 p-4 text-sm text-stone-500 bg-stone-100 rounded-xl print:bg-white print:border print:border-stone-300 print:text-stone-600"/g, 'className="mt-4 p-4 text-sm text-stone-500 bg-stone-100 rounded-xl print:bg-white print:border print:border-stone-300 print:text-stone-600 print:break-inside-avoid"');

// Add to "Objectif" & "Règle" (lines 138-150)
content = content.replace(/className="bg-blue-50 border border-blue-100 p-6 rounded-2xl print:border-2 print:border-blue-900 print:bg-white"/g, 'className="bg-blue-50 border border-blue-100 p-6 rounded-2xl print:border-2 print:border-blue-900 print:bg-white print:break-inside-avoid"');
content = content.replace(/className="bg-amber-50 border border-amber-200 p-6 rounded-2xl print:border-2 print:border-amber-900 print:bg-white"/g, 'className="bg-amber-50 border border-amber-200 p-6 rounded-2xl print:border-2 print:border-amber-900 print:bg-white print:break-inside-avoid"');


fs.writeFileSync('app/espace-membre/page.tsx', content);
console.log("Added print:break-inside-avoid");
