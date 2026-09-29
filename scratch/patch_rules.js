const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const newRule = `
    match /pages/{pageId} {
      allow read: if true;
      allow write: if isAdmin();
    }
`;

if (!rules.includes('/pages/{pageId}')) {
  rules = rules.replace(
    'match /faqs/{faqId} {',
    newRule + '\n    match /faqs/{faqId} {'
  );
  fs.writeFileSync('firestore.rules', rules);
  console.log('Rules patched.');
} else {
  console.log('Rules already patched.');
}
