const fs = require('fs');
const path = 'app/historique/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Imports
code = code.replace(
  'import { ArrowLeft, ExternalLink, AlertCircle, Clock, TrendingDown, CheckCircle, XCircle, BookOpen, X, ChevronRight, Info, ShieldCheck } from "lucide-react";',
  'import { ArrowLeft, ExternalLink, AlertCircle, Clock, TrendingDown, CheckCircle, XCircle, BookOpen, X, ChevronRight, Info, ShieldCheck, MessageCircle } from "lucide-react";'
);

// 2. Add activeTopic state
code = code.replace(
  'export default function HistoriquePage() {',
  `const CommentBadge = ({ topic, label }: { topic: string, label?: string }) => {
  return (
    <button 
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.dispatchEvent(new CustomEvent('open-comments', { detail: topic })); }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 text-stone-500 hover:text-emerald-600 rounded-full text-xs font-medium transition-colors border border-stone-200 ml-3 align-middle"
    >
      <MessageCircle size={14} />
      <span>{label || 'Débattre'}</span>
    </button>
  );
};

export default function HistoriquePage() {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  React.useEffect(() => {
    const handleOpen = (e: any) => setActiveTopic(e.detail);
    document.addEventListener('open-comments', handleOpen);
    return () => document.removeEventListener('open-comments', handleOpen);
  }, []);
`
);

// 3. Add badges to headers
// Enjeux Financiers
code = code.replace(
  '<h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">',
  '<h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 flex-wrap">'
);
code = code.replace(
  '<TrendingDown className="text-emerald-600" />\n            Aperçu des enjeux financiers',
  '<TrendingDown className="text-emerald-600" />\n            Aperçu des enjeux financiers <CommentBadge topic="Enjeux financiers" />'
);

// Options
code = code.replace(
  '<h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">',
  '<h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 flex-wrap">'
);
code = code.replace(
  '<CheckCircle className="text-emerald-600" />\n            Analyse des options de reprise',
  '<CheckCircle className="text-emerald-600" />\n            Analyse des options de reprise <CommentBadge topic="Options de reprise" />'
);

// Timeline items
code = code.replace(
  '<h3 className="font-bold text-stone-900 text-lg mb-2">{event.title}</h3>',
  '<h3 className="font-bold text-stone-900 text-lg mb-2 flex items-center flex-wrap gap-2">{event.title} <CommentBadge topic={`Étape : ${event.title}`} /></h3>'
);

// 4. Drawer & Bottom Comments
const endMain = `
        {/* Lexique & Comments */}
`;
const newEndMain = `
        {/* Commentaires contextuels (Drawer) */}
        {activeTopic && (
          <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/50 backdrop-blur-sm transition-opacity" onClick={() => setActiveTopic(null)}>
            <div className="w-full max-w-md bg-stone-50 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-stone-200 p-4 flex justify-between items-center z-10 shadow-sm">
                <h3 className="font-bold text-stone-900 flex-1 truncate mr-4">Débat : {activeTopic}</h3>
                <button onClick={() => setActiveTopic(null)} className="p-2 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-4">
                <Comments topic={activeTopic} />
              </div>
            </div>
          </div>
        )}

        {/* Espace débat global */}
        <div className="max-w-4xl mx-auto mb-12">
          <Comments />
        </div>

        {/* Lexique */}
`;

code = code.replace(
  `        <Comments />\n\n      </main>`,
  `      </main>`
);

code = code.replace(endMain, newEndMain);

fs.writeFileSync(path, code);
console.log('Historique updated with inline comments');
