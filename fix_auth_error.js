const fs = require('fs');
const path = 'app/components/Comments.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `          {authMode === "idle" ? (
            <div>
              <p className="text-stone-600 mb-4">Connectez-vous avec l'adresse email utilisée lors de votre adhésion pour participer au débat.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">`;

const replacementStr = `          {authMode === "idle" ? (
            <div>
              <p className="text-stone-600 mb-4">Connectez-vous avec l'adresse email utilisée lors de votre adhésion pour participer au débat.</p>
              {authError && <p className="text-rose-500 text-sm mb-4 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">{authError}</p>}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync(path, code);
  console.log("Auth error display added.");
}
