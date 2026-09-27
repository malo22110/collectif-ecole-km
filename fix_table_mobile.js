const fs = require('fs');
const path = 'app/historique/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Remove the block / md:table-row classes that break the table rendering
code = code.replace(/block md:table-row border-b md:border-none/g, '');
code = code.replace(/block md:table-cell/g, '');

// Ensure the scroll hint is there.
const tableStart = '<div className="overflow-x-auto shadow-sm border border-stone-200 rounded-2xl mb-12">';
if (!code.includes('Faites glisser le tableau')) {
  const scrollHint = `<div className="md:hidden flex items-center justify-center gap-2 text-amber-800 bg-amber-50 px-4 py-3 rounded-xl mb-4 text-sm font-medium border border-amber-200">
              <div className="animate-pulse"><ChevronRight size={18} /></div>
              Faites glisser le tableau vers la droite
            </div>
            `;
  code = code.replace(tableStart, scrollHint + tableStart);
}

// Add import ChevronRight if missing
if (!code.includes('ChevronRight')) {
  code = code.replace('import { CheckCircle, AlertCircle, XCircle, FileText, Download, UserCircle, LogOut, Send, MessageSquare, ArrowLeft, ArrowRight, ShieldCheck, BookOpen } from "lucide-react";',
  'import { CheckCircle, AlertCircle, XCircle, FileText, Download, UserCircle, LogOut, Send, MessageSquare, ArrowLeft, ArrowRight, ChevronRight, ShieldCheck, BookOpen } from "lucide-react";');
}

fs.writeFileSync(path, code);
console.log('Fixed table mobile view.');
