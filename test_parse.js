const { parse } = require('@babel/parser');
const fs = require('fs');
const code = fs.readFileSync('app/historique/page.tsx', 'utf8');

try {
  parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("BABEL PARSED OK");
} catch(e) {
  console.error("BABEL ERROR:", e.message, "at line", e.loc?.line, "col", e.loc?.column);
}
