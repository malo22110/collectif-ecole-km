import fs from 'fs';

let content = fs.readFileSync('app/historique/page.tsx', 'utf8');
const stressTestRegex = /(<div className="md:hidden flex items-center justify-center gap-2 text-amber-800 bg-amber-50 px-4 py-3 rounded-xl mb-4 text-sm font-medium border border-amber-200">[\s\S]*?<\/table>\s*<\/div>)/;

const match = content.match(stressTestRegex);
if(match) {
  console.log("Matched length:", match[1].length);
  console.log("Starts with:", match[1].substring(0, 50));
  console.log("Ends with:", match[1].substring(match[1].length - 50));
} else {
  console.log("No match");
}
