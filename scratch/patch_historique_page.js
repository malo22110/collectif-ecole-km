const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

// Add isSimplified state
code = code.replace(
  '  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});',
  '  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});\n  const [isSimplified, setIsSimplified] = useState(false);'
);

// Add the sticky toggle switch below UserAvatar inside header
const oldHeaderToggle = `
        {/* Toggle intégré au header pour garantir qu'il soit sticky */}
        <div className="bg-stone-50/95 backdrop-blur-md border-t border-stone-200 py-2">
          <div className="max-w-5xl mx-auto px-4 flex justify-center">
            <div className="inline-flex bg-stone-200/50 p-1 rounded-full items-center border border-stone-200 shadow-inner">
              <button
                onClick={() => setIsSimplified(true)}
                className={\`px-6 py-1.5 rounded-full text-sm font-bold transition-all duration-200 \${isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}\`}
              >
                Version Courte (Résumé)
              </button>
              <button
                onClick={() => setIsSimplified(false)}
                className={\`px-6 py-1.5 rounded-full text-sm font-bold transition-all duration-200 \${!isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}\`}
              >
                Détails Complets
              </button>
            </div>
          </div>
        </div>
`;

code = code.replace(
  '        </div>\n      </header>',
  '        </div>\n' + oldHeaderToggle + '      </header>'
);

// Pass isSimplified inside the context prop of BlockRenderer
code = code.replace(
  'context={{ setActiveTopic, commentCounts }}',
  'context={{ setActiveTopic, commentCounts, isSimplified }}'
);

fs.writeFileSync('app/historique/page.tsx', code);
