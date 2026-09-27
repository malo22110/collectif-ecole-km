const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

const targetStr = '                {/* ANALYSE GLOBALE */}';
const replacementStr = '      </div>\n      <div className="max-w-[90rem] mx-auto px-4 lg:px-8 xl:px-12">\n        {/* ANALYSE GLOBALE */}';

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('app/historique/page.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found");
}
