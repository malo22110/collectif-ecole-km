const fs = require('fs');
const path = 'app/components/Comments.tsx';
let code = fs.readFileSync(path, 'utf8');

// Fix textarea
code = code.replace(/bg-white min-h-\[100px\]/g, 'bg-white text-stone-900 min-h-[100px]');
// Fix inputs
code = code.replace(/bg-white"\n                value=\{email\}/g, 'bg-white text-stone-900"\n                value={email}');
code = code.replace(/bg-white"\n                value=\{password\}/g, 'bg-white text-stone-900"\n                value={password}');

fs.writeFileSync(path, code);
console.log('Fixed text color for inputs');
