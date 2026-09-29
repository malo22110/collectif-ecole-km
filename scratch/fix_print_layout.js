import fs from 'fs';

let content = fs.readFileSync('app/espace-membre/page.tsx', 'utf8');

// 1. Hide header
content = content.replace(/<header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-50 shadow-md">/, '<header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-50 shadow-md print:hidden">');

// 2. Hide Page Titles
content = content.replace(/<div className="mb-8 md:mb-12">/, '<div className="mb-8 md:mb-12 print:hidden">');

// 3. Hide Action: Print Petition
content = content.replace(/<div className="bg-white p-6 md:p-10 rounded-3xl shadow-md border border-stone-200 flex flex-col md:flex-row items-center gap-6 md:gap-10">/, '<div className="bg-white p-6 md:p-10 rounded-3xl shadow-md border border-stone-200 flex flex-col md:flex-row items-center gap-6 md:gap-10 print:hidden">');

// 4. Hide Consignes
content = content.replace(/<div className="bg-emerald-50 p-6 md:p-8 rounded-3xl border-2 border-emerald-200 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center">/, '<div className="bg-emerald-50 p-6 md:p-8 rounded-3xl border-2 border-emerald-200 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center print:hidden">');

fs.writeFileSync('app/espace-membre/page.tsx', content);
console.log("Added print:hidden to unneeded elements.");
