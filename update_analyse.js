const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

// Replace Option 1 Cost
code = code.replace(
  /<div className="text-xl font-bold text-emerald-600">~350 000 € HT<\/div>/,
  '<div className="text-xl font-bold text-emerald-600">~190 000 € à 240 000 € HT</div>'
);

// Replace Option 2 Cost
code = code.replace(
  /<div className="text-xl font-bold text-stone-900">380k à 475k € HT<\/div>/,
  '<div className="text-xl font-bold text-stone-900">300k à 415k € HT</div>'
);

// Replace Option 3 info to update to exact numbers
code = code.replace(
  /127 110 € HT d'études perdues à 100%<\/strong> : Sommes engagées auprès des prestataires./,
  '127 110 € HT d\'études perdues à 100%</strong> : Sommes engagées au titre du service fait (art. L. 2191-1).'
);

// We should also replace the conclusion paragraph
code = code.replace(
  /<strong>Conclusion :<\/strong> Refuser de payer un avenant d'études de 2 170 € aujourd'hui expose la commune à une destruction nette de capital public de près de 290 000 €. L'Option 1 \(Optimisation de l'existant\) est financièrement, techniquement et juridiquement la seule rationnelle./,
  '<strong>Conclusion :<\/strong> Refuser l\'avenant de 2 170 € HT conduit paradoxalement à la pire opération financière. L\'Option 1 permet d\'utiliser les 127 110 € d\'études déjà payées, de sécuriser les subventions, de respecter l\'ultimatum DETR (décembre 2026), et de traiter le risque radon dans les délais légaux (art. R. 1333-34 CSP). Le reste à charge de cette option est très inférieur au plafond d\'emprunt de 400 000 € validé par le Trésor public.'
);

// URL links update to handle space in file names, maybe use encodeURI inside the loop? We already wrote it without encodeURI, let's fix that for all links
code = code.replace(
  /href=\{activeStep\.sourceUrl\}/,
  'href={encodeURI(activeStep.sourceUrl)}'
);

code = code.replace(
  /window\.open\(event\.sourceUrl, '_blank'\);/,
  'window.open(encodeURI(event.sourceUrl), \'_blank\');'
);

fs.writeFileSync('app/historique/page.tsx', code);
