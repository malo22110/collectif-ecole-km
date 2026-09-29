const fs = require('fs');
const membres = require('./membres_all.json');

const bounced = [
  "nadege.allain22@gmail.com",
  "laurie.bonnisseau@gmail.com",
  "stephane@peoch.bzh",
  "jeanmichel.peoch@gmail.com",
  "contact@collectif-ecole-km.fr",
  "helenedefos@gmail.com",
  "adeline2294@hotmail.fr",
  "thierryczi@gmail.com",
  "rocherstephane834@gmail.com",
  "delphinetartivel22@gmail.com",
  "romuald.kergoet@gmail.com",
  "mm37@gmail.com",
  "cle.leberre@laposte.net",
  "arno-22110@hotmail.fr",
  "helenelecorre@yahoo.fr",
  "fdvos@me.com",
  "jeanfrancoislecorre@yahoo.fr",
  "pauline.garrigues@free.fr",
  "stephane.cadiou4@orange.fr",
  "sylvette.dore@orange.fr",
  "gaelle.le-g@orange.fr"
];

const results = bounced.map(email => {
  const member = membres.find(m => m.email === email || m.id === email);
  if (member) {
    return `- **${email}** : ${member.prenom || ''} ${member.nom || ''}`;
  } else {
    return `- **${email}** : *Introuvable dans la base*`;
  }
});

console.log(results.join('\n'));
