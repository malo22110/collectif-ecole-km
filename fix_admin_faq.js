const fs = require('fs');
let code = fs.readFileSync('app/admin/page.tsx', 'utf8');

// Add FaqManager import
if (!code.includes('import FaqManager')) {
  code = code.replace('import ArticleManager from "./ArticleManager";', 
                      'import ArticleManager from "./ArticleManager";\nimport FaqManager from "./FaqManager";');
}

// Update state type
code = code.replace('useState<"membres" | "articles">("membres")', 'useState<"membres" | "articles" | "faq">("membres")');

// Add nav button. Need an icon, we can use `HelpCircle` or `MessageCircleQuestion` from lucide-react. Let's add HelpCircle to imports
if (!code.includes('HelpCircle')) {
  code = code.replace('FileText,', 'FileText, HelpCircle,');
}

const navBtnArticles = `<button 
            onClick={() => setActiveTab("articles")}
            className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors \${activeTab === "articles" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}\`}
          >
            <FileText size={20} /> Articles & Docs
          </button>`;

const navBtnFaq = `<button 
            onClick={() => setActiveTab("faq")}
            className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors \${activeTab === "faq" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}\`}
          >
            <HelpCircle size={20} /> FAQ
          </button>`;

if (!code.includes('setActiveTab("faq")')) {
  code = code.replace(navBtnArticles, navBtnArticles + "\n          " + navBtnFaq);
}

// Add the tab render
const renderArticles = `{activeTab === "articles" && (
          <div>
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Articles & Documents</h2>
            <ArticleManager />
          </div>
        )}`;

const renderFaq = `{activeTab === "faq" && (
          <FaqManager />
        )}`;

if (!code.includes('activeTab === "faq"')) {
  code = code.replace(renderArticles, renderArticles + "\n\n        " + renderFaq);
}

fs.writeFileSync('app/admin/page.tsx', code);
console.log("Success add admin tab");
