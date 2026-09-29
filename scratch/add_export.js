const fs = require('fs');

let content = fs.readFileSync('app/admin/page.tsx', 'utf8');

// Insert import
if (!content.includes('ExportMembers')) {
  content = content.replace(
    'import ImportMembers from "./ImportMembers";',
    'import ImportMembers from "./ImportMembers";\nimport ExportMembers from "./ExportMembers";'
  );
  
  // Insert component
  content = content.replace(
    '<ImportMembers />\n          </div>',
    '<ImportMembers />\n            <ExportMembers />\n          </div>'
  );

  fs.writeFileSync('app/admin/page.tsx', content);
  console.log("Added ExportMembers to page.tsx");
} else {
  console.log("Already added");
}
