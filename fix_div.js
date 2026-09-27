const fs = require('fs');
let code = fs.readFileSync('app/admin/page.tsx', 'utf8');

const faulty = `              </div>
            </div>
            </div>
            <ImportMembers />
          </div>`;
          
const correct = `              </div>
            </div>
            <ImportMembers />
          </div>`;

code = code.replace(faulty, correct);
fs.writeFileSync('app/admin/page.tsx', code);
console.log("Fixed JSX");
