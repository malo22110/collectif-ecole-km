import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = file => readFile(new URL(`../${file}`, import.meta.url), "utf8");

// [SPEC-PET-CLOSE-01] Public sign-in must not be possible through the UI or Firestore rules.
test("la page publique archive la pétition sans formulaire ni création Firestore", async () => {
  const [page, rules, home] = await Promise.all([
    source("app/petition/page.tsx"), source("firestore.rules"), source("app/page.tsx")
  ]);
  assert.doesNotMatch(page, /<form|setDoc\(|addDoc\(/);
  assert.match(page, /La pétition est close/);
  assert.match(page, /Pétition Citoyenne pour la Sauvegarde de l/);
  assert.match(page, /Valorisons les études engagées vers un projet maîtrisé/);
  assert.match(page, /réévaluation à la baisse du dossier de rénovation déjà engagé/);
  assert.match(page, /550 000 € HT/);
  assert.match(rules, /match \/signatures\/\{sigId\}[\s\S]*?allow create: if false;/);
  assert.doesNotMatch(home, /Signer la pétition|Signer la pétition maintenant|Prochain conseil municipal/);
  assert.match(home, /dossier retourne chez l’architecte/);
});

// [SPEC-PET-CLOSE-01] Admin SDK writes must be refused even though Firestore rules cannot stop them.
test("les imports papier et les accords de principe restent fermés côté serveur", async () => {
  const [paper, agreements, hub] = await Promise.all([
    source("app/api/signatures/paper-import/route.ts"),
    source("app/api/admin/petition-agreements/route.ts"),
    source("app/espace-membre/petition/page.tsx")
  ]);
  assert.match(paper, /PETITION_CLOSED && parsed\.data\.action !== "review"/);
  assert.match(agreements, /if \(PETITION_CLOSED\) return NextResponse\.json\(\{ error: .* \}, \{ status: 410 \}\)/);
  assert.doesNotMatch(hub, /Numériser une pétition|Imprimer la pétition|Membres à relancer/);
});