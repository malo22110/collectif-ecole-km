const fs = require('fs');
const path = 'functions/src/index.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace('error: error.toString()', 'error: String(error)');
fs.writeFileSync(path, code);
