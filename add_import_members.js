const fs = require('fs');
let code = fs.readFileSync('app/admin/page.tsx', 'utf8');

if (!code.includes('import ImportMembers')) {
  code = code.replace('import FaqManager from "./FaqManager";', 
                      'import FaqManager from "./FaqManager";\nimport ImportMembers from "./ImportMembers";');
}

const targetDiv = '</div>\n          </div>\n        )}';
const replacement = '</div>\n            </div>\n            <ImportMembers />\n          </div>\n        )}';

if (!code.includes('<ImportMembers />')) {
  code = code.replace(targetDiv, replacement);
}

fs.writeFileSync('app/admin/page.tsx', code);
console.log("Success add ImportMembers");
