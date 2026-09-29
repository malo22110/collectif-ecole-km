const fs = require('fs');
let content = fs.readFileSync('app/admin/page.tsx', 'utf8');

if (!content.includes('SetupCmsBtn')) {
  content = content.replace(
    'import ExportMembers from "./ExportMembers";',
    'import ExportMembers from "./ExportMembers";\nimport SetupCmsBtn from "./SetupCmsBtn";'
  );
  
  content = content.replace(
    '<ArticleManager />\n          </div>',
    '<ArticleManager />\n            <SetupCmsBtn />\n          </div>'
  );

  fs.writeFileSync('app/admin/page.tsx', content);
  console.log("Added SetupCmsBtn to page.tsx");
} else {
  console.log("Already added");
}
