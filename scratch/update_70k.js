import fs from 'fs';

let content = fs.readFileSync('app/historique/page.tsx', 'utf8');

// Replace "risque de perte réelle (70 000 €)" with "(> 70 000 €)"
content = content.replace(/risque de perte réelle \(70 000 €\)/g, "risque de perte réelle (> 70 000 €)");

// Replace "~ 70 000 €" with "> 70 000 €"
content = content.replace(/~ 70 000 €/g, "> 70 000 €");

// Replace "environ 70 000 €" with "au minimum 70 000 €"
content = content.replace(/environ 70 000 €/g, "au minimum 70 000 €");

// Specifically line 232: "70 000 € d'argent public" -> "Plus de 70 000 € d'argent public"
content = content.replace(/\. 70 000 € d'argent public seront perdus/g, ". Au moins 70 000 € d'argent public seront perdus");

// Line 236: "rentabiliser ces 70 000 €" -> "rentabiliser ces > 70 000 €"
content = content.replace(/rentabiliser ces 70 000 €/g, "rentabiliser ces > 70 000 € d'études");

fs.writeFileSync('app/historique/page.tsx', content);
console.log("Historique updated");

let petition = fs.readFileSync('app/petition/page.tsx', 'utf8');
petition = petition.replace(/environ 70 000 €/g, "au minimum 70 000 €");
petition = petition.replace(/ces 70 000 € d'argent/g, "ces montants d'argent");
petition = petition.replace(/immédiate de 70 000 €/g, "immédiate d'au moins 70 000 €");
fs.writeFileSync('app/petition/page.tsx', petition);
console.log("Petition updated");

let espaceMembre = fs.readFileSync('app/espace-membre/page.tsx', 'utf8');
espaceMembre = espaceMembre.replace(/environ 70 000 €/g, "au minimum 70 000 €");
espaceMembre = espaceMembre.replace(/~70 000 €/g, "> 70 000 €");
espaceMembre = espaceMembre.replace(/~ 70 000 €/g, "> 70 000 €");
espaceMembre = espaceMembre.replace(/\(70k€ de frais/g, "(> 70k€ de frais");
fs.writeFileSync('app/espace-membre/page.tsx', espaceMembre);
console.log("Espace Membre updated");
