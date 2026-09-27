const fs = require('fs');
let code = fs.readFileSync('app/admin/page.tsx', 'utf8');

const renderArticles = `{activeTab === "articles" && (
          <div>
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Articles & Documents</h2>
            <ArticleManager />
          </div>
        )}`;

const renderFaq = `{activeTab === "faq" && (
          <FaqManager />
        )}`;

if (!code.includes('activeTab === "faq" && (')) {
  code = code.replace(renderArticles, renderArticles + "\n\n        " + renderFaq);
  fs.writeFileSync('app/admin/page.tsx', code);
  console.log("Added FAQ render");
}
