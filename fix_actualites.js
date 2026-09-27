const fs = require('fs');
let code = fs.readFileSync('app/actualites/page.tsx', 'utf8');

code = code.replace('import { useParams, useRouter } from "next/navigation";', 'import { useSearchParams, useRouter } from "next/navigation";\nimport { Suspense } from "react";');
code = code.replace('  const params = useParams();\n  const router = useRouter();\n  const id = params.id as string;', '  const searchParams = useSearchParams();\n  const router = useRouter();\n  const id = searchParams.get("id");');

// Wrap with Suspense
const newCode = `
import React, { Suspense } from "react";
function ArticleContent() {
${code.substring(code.indexOf('  const searchParams'))}

export default function ArticlePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <ArticleContent />
    </Suspense>
  );
}
`;

// Replace everything after imports
const importsEnd = code.indexOf('export default function ArticlePage() {');
const imports = code.substring(0, importsEnd);

fs.writeFileSync('app/actualites/page.tsx', imports + newCode);
