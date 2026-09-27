const fs = require('fs');
const path = 'app/historique/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// The problematic empty divs left over:
const toRemove = `        
        </div>
      </div>

        {/* ENJEUX FINANCIERS */}`;

code = code.replace(toRemove, `        {/* ENJEUX FINANCIERS */}`);
fs.writeFileSync(path, code);
