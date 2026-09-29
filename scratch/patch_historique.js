const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');
code = code.replace(
  '<BlockRenderer key={idx} block={block} />',
  '<BlockRenderer key={idx} block={block} context={{ setActiveTopic, commentCounts }} />'
);
fs.writeFileSync('app/historique/page.tsx', code);
