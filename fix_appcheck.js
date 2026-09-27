const fs = require('fs');
const path = 'lib/firebase.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;',
  '(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = "local-dev-kergrist-12345";'
);
fs.writeFileSync(path, code);
