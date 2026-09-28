import fs from 'fs';

let content = fs.readFileSync('app/historique/page.tsx', 'utf8');

const matchesStart = content.match(/<div className="space-y-3 mb-6">/g);
console.log("Starts:", matchesStart ? matchesStart.length : 0);

const matchesEnd = content.match(/<\/div>\s*<div className="pt-4 border-t/g);
console.log("Ends:", matchesEnd ? matchesEnd.length : 0);

