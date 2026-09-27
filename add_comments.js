const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

if (!code.includes('import Comments')) {
  code = code.replace('import { ArrowLeft', 'import Comments from "../components/Comments";\nimport { ArrowLeft');
}

const targetSection = '<section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">';
const replacement = `      {/* ESPACE COMMENTAIRES */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <Comments />
      </div>
      
      <section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">`;

if (!code.includes('<Comments />')) {
  code = code.replace(targetSection, replacement);
}

fs.writeFileSync('app/historique/page.tsx', code);
console.log("Success add comments");
