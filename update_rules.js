const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const newRules = `
    match /faqs/{faqId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /commentaires/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
`;

if (!code.includes('match /faqs/')) {
  code = code.replace('match /articles/{articleId} {', newRules + '\n    match /articles/{articleId} {');
  fs.writeFileSync('firestore.rules', code);
  console.log('Updated rules');
}
