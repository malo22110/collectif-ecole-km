const fs = require('fs');
const path = 'app/page.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('BookOpen')) {
  code = code.replace(
    '  X\n} from "lucide-react";',
    '  X,\n  BookOpen\n} from "lucide-react";'
  );
  fs.writeFileSync(path, code);
}
