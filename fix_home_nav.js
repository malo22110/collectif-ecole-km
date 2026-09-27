const fs = require('fs');
const path = 'app/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add state
if (!code.includes('isMenuOpen')) {
  code = code.replace(
    'const [articles, setArticles] = useState<any[]>([]);',
    'const [articles, setArticles] = useState<any[]>([]);\n  const [isMenuOpen, setIsMenuOpen] = useState(false);'
  );
}

// 2. Add lucide icons
code = code.replace(
  'Search,\n  Newspaper\n} from "lucide-react";',
  'Search,\n  Newspaper,\n  Menu,\n  X\n} from "lucide-react";'
);

// 3. Replace header
const oldHeader = `<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Logo Collectif" className="w-10 h-10 object-contain rounded-full border border-stone-200 bg-white" />
            <span className="font-semibold text-stone-800 hidden sm:block text-sm md:text-base">
              Collectif citoyen pour la rénovation de l'école
            </span>
            <span className="font-semibold text-stone-800 sm:hidden">
              Collectif École
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <a href="/faq" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors hidden md:block">FAQ</a>
            <a href="/historique" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors hidden md:flex items-center gap-1.5"><Search size={16} /> Historique & Analyse</a>
            <a href="#charte" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors hidden md:block">
              Notre Charte
            </a>
            <a href="#petition" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors hidden md:block">
              La Pétition
            </a>
            <a href="#rejoindre" className="text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full transition-colors">
              Rejoindre
            </a>
          </div>
        </div>
      </header>`;

const newHeader = `<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Logo Collectif" className="w-10 h-10 object-contain rounded-full border border-stone-200 bg-white" />
            <span className="font-semibold text-stone-800 hidden sm:block text-sm md:text-base">
              Collectif citoyen pour la rénovation de l'école
            </span>
            <span className="font-semibold text-stone-800 sm:hidden">
              Collectif École
            </span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="/faq" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">FAQ</a>
            <a href="/historique" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1.5"><Search size={16} /> Historique & Analyse</a>
            <a href="#charte" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
              Notre Charte
            </a>
            <a href="#petition" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
              La Pétition
            </a>
            <a href="#rejoindre" className="text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full transition-colors">
              Rejoindre
            </a>
          </div>

          {/* Mobile Nav Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <a href="#rejoindre" className="text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full transition-colors">
              Rejoindre
            </a>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-stone-200 shadow-xl flex flex-col p-4 gap-4 z-50">
            <a onClick={() => setIsMenuOpen(false)} href="/historique" className="flex items-center gap-3 px-4 py-3 bg-amber-50 text-amber-800 font-bold rounded-xl border border-amber-200">
              <Search size={18} /> Historique & Analyse Financière
            </a>
            <a onClick={() => setIsMenuOpen(false)} href="/faq" className="px-4 py-2 text-stone-700 font-medium hover:bg-stone-50 rounded-lg">Foire Aux Questions (FAQ)</a>
            <a onClick={() => setIsMenuOpen(false)} href="#charte" className="px-4 py-2 text-stone-700 font-medium hover:bg-stone-50 rounded-lg">Notre Charte</a>
            <a onClick={() => setIsMenuOpen(false)} href="#petition" className="px-4 py-2 text-stone-700 font-medium hover:bg-stone-50 rounded-lg">La Pétition</a>
          </div>
        )}
      </header>`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync(path, code);
console.log('Nav fixed');
