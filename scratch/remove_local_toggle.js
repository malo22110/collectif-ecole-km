const fs = require('fs');
let code = fs.readFileSync('app/components/cms/FinancialOverviewBlock.tsx', 'utf8');

// The toggle was right under the opening <div className="...">
// Let's remove it
code = code.replace(
  /{\/\* Toggle simplifié local \*\/}[\s\S]*?<\/div>\n\s*<\/div>\n\n\s*<h2/,
  '<h2'
);

fs.writeFileSync('app/components/cms/FinancialOverviewBlock.tsx', code);
