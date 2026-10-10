import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  calculatePhaseOneRemainder,
  estimateOperationTtc,
  PHASE_ONE_AIDS,
  PHASE_ONE_OPERATION_TOTAL_HT_EUROS,
  PHASE_ONE_STUDIES_PROVISION_EUROS,
  PHASE_ONE_TOTAL_EUROS,
  PHASE_ONE_WORKS_TARGET_EUROS,
  PREFECTURE_OPERATION_CEILING_TTC_EUROS,
} from "../lib/phaseOneFunding.ts";

// [SPEC-PRESENTATION-FUNDING-01] Remainder scenarios subtract only the selected aids from historical Phase 1 costs.
test("reproduit le reste à charge historique et recalcule chaque combinaison d’aides", () => {
  const allEnabled = { department: true, region: true, detr: true };
  assert.equal(PHASE_ONE_TOTAL_EUROS, 552_170);
  assert.equal(PHASE_ONE_AIDS.reduce((total, aid) => total + aid.amount, 0), 340_000);
  assert.equal(calculatePhaseOneRemainder(allEnabled), 212_170);
  assert.equal(
    calculatePhaseOneRemainder({ ...allEnabled, department: false }),
    311_575,
  );
  assert.equal(
    calculatePhaseOneRemainder({ ...allEnabled, region: false }),
    272_620,
  );
  assert.equal(
    calculatePhaseOneRemainder({ ...allEnabled, detr: false }),
    392_315,
  );
  assert.equal(
    calculatePhaseOneRemainder({ ...allEnabled, region: false, detr: false }),
    452_765,
  );
  assert.equal(
    calculatePhaseOneRemainder({ department: false, region: false, detr: false }),
    552_170,
  );
});

// [SPEC-PRESENTATION-OPERATION-01] Phase 1 operation cost includes its initial studies provision.
test("calcule l’opération Phase 1 complète et l’écart indicatif au repère préfectoral", () => {
  assert.equal(PHASE_ONE_WORKS_TARGET_EUROS, 550_000);
  assert.equal(PHASE_ONE_STUDIES_PROVISION_EUROS, 127_110);
  assert.equal(PHASE_ONE_OPERATION_TOTAL_HT_EUROS, 677_110);
  assert.equal(estimateOperationTtc(PHASE_ONE_OPERATION_TOTAL_HT_EUROS), 812_532);
  assert.equal(
    estimateOperationTtc(PHASE_ONE_OPERATION_TOTAL_HT_EUROS) - PREFECTURE_OPERATION_CEILING_TTC_EUROS,
    12_532,
  );
});

// [SPEC-PRESENTATION-FUNDING-01] Aid controls are accessible switches and announce the live estimate.
test("expose trois bascules accessibles et une annonce dynamique du résultat", async () => {
  const presentation = await readFile(
    new URL("../app/presentation/PresentationDeck.tsx", import.meta.url),
    "utf8",
  );
  assert.equal((presentation.match(/role="switch"/g) || []).length, 1);
  assert.equal(PHASE_ONE_AIDS.length, 3);
  assert.match(presentation, /PHASE_ONE_AIDS\.map/);
  assert.match(presentation, /aria-live="polite" aria-atomic="true"/);
  assert.match(presentation, /checked=\{phaseOneAidSelection\[aid\.key\]\}/);
  assert.match(presentation, /aria-labelledby="phase-one-vat-title"/);
  assert.match(presentation, /FCTVA compense une large part de/);
  assert.match(presentation, /dépenses d’investissement éligibles/);
  assert.match(presentation, /Le TTC\s+peut compter pour la trésorerie à avancer/);
  const simulationSlide = presentation
    .split("{activeSlide === 8 && (")[1]
    ?.split("{activeSlide === 9 && (")[0];
  assert.ok(simulationSlide);
  assert.ok(
    simulationSlide.indexOf("<aside className={styles.phaseOneVatNote}") >
      simulationSlide.indexOf("</section>"),
  );
});

// [SPEC-PRESENTATION-FUNDING-01] The funding simulation has its own slide 07 after the funding overview.
test("place la simulation sur la slide 07, distincte du chiffrage Phase 1", async () => {
  const presentation = await readFile(
    new URL("../app/presentation/PresentationDeck.tsx", import.meta.url),
    "utf8",
  );
  const presentationStyles = await readFile(
    new URL("../app/presentation/presentation.module.css", import.meta.url),
    "utf8",
  );
  const phaseOneSlide = presentation
    .split("{activeSlide === 4 && (")[1]
    ?.split("{activeSlide === 5 && (")[0];
  const charterSlide = presentation
    .split("{activeSlide === 1 && (")[1]
    ?.split("{activeSlide === 2 && (")[0];
  const simulationSlide = presentation
    .split("{activeSlide === 8 && (")[1]
    ?.split("{activeSlide === 9 && (")[0];

  assert.match(presentation, /id: "financement", label: "Le financement" \},\s*\{ id: "reste-a-charge", label: "Reste à charge" \},\s*\{ id: "depenses", label: "Dépenses réalisées" \}/);
  assert.ok(phaseOneSlide);
  assert.doesNotMatch(phaseOneSlide, /phaseOneFunding/);
  assert.ok(simulationSlide);
  assert.match(simulationSlide, /08 \/ Financement · Phase 1/);
  assert.match(presentation, /\{activeSlide === 9 && \([\s\S]*?09 \/ Les études déjà réalisées/);
  assert.match(presentation, /\{activeSlide === 1 && \([\s\S]*?01 \/ Rappel de la charte/);
  assert.match(presentation, /\{activeSlide === 2 && \([\s\S]*?02 \/ Le calendrier/);
  assert.match(presentation, /\{activeSlide === 3 && \([\s\S]*?03 \/ Petit lexique[\s\S]*?<h3>APS<\/h3>/);
  assert.match(presentation, /<h3>APS<\/h3>[\s\S]*?<h3>APD<\/h3>[\s\S]*?<h3>HT \/ TTC<\/h3>[\s\S]*?<h3>FCTVA<\/h3>[\s\S]*?<h3>DETR \/ DSIL<\/h3>[\s\S]*?<h3>BDB<\/h3>/);
  assert.match(presentation, /id: "collectif-cover", label: "Ouverture · Le collectif", countsAsContent: false/);
  assert.match(presentation, /\{activeSlide === 11 && \([\s\S]*?10 \/ Le collectif/);
  assert.match(presentation, /\{activeSlide === 12 && \([\s\S]*?11 \/ À quoi servirait la commission/);
  assert.match(presentation, /\{activeSlide === 13 && \([\s\S]*?12 \/ L’espace membre[\s\S]*?Le tableau de bord/);
  assert.match(presentation, /\{activeSlide === 14 && \([\s\S]*?13 \/ Des outils pour agir[\s\S]*?Propositions & actions[\s\S]*?Agenda & comptes rendus/);
  assert.match(presentation, /\{activeSlide === 15 && \([\s\S]*?14 \/ Mot de clôture/);
  assert.match(presentation, /activeSlide === 11 && \([\s\S]*?<div className=\{styles\.contentSlide\}>[\s\S]*?10 \/ Le collectif/);
  assert.ok(charterSlide);
  assert.doesNotMatch(charterSlide, /memberFeatureGrid|L’espace membre|Des outils pour agir|Petit lexique/);
  assert.match(presentationStyles, /\.actionGrid \{[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(presentationStyles, /collectiveContentSlide/);
  assert.doesNotMatch(presentation, /\{activeSlide === 10 && \([\s\S]*?Quatre façons d’aider/);
});

// [SPEC-PRESENTATION-FUNDING-02] Phase 2 remains a dated estimate and is explicitly marked for future cost review.
test("signale que le montant Phase 2 est à réexaminer", async () => {
  const presentation = await readFile(
    new URL("../app/presentation/PresentationDeck.tsx", import.meta.url),
    "utf8",
  );
  const totalSlide = presentation
    .split("{activeSlide === 6 && (")[1]
    ?.split("{activeSlide === 7 && (")[0];
  const phaseTwoSlide = presentation
    .split("{activeSlide === 5 && (")[1]
    ?.split("{activeSlide === 6 && (")[0];

  assert.ok(totalSlide);
  assert.ok(phaseTwoSlide);
  assert.match(phaseTwoSlide, /120 210,96 € <span>HT<\/span>/);
  assert.match(totalSlide, /Travaux \+ études :/);
  assert.match(totalSlide, /PHASE_ONE_OPERATION_TOTAL_HT_EUROS\)\} € HT/);
  assert.match(totalSlide, /EURO_FORMAT\.format\(phaseOneOperationTtc\)\} € TTC/);
  assert.match(totalSlide, /dépasse le repère de 800 000 € TTC d’environ \{EURO_FORMAT\.format\(phaseOneCeilingGap\)\} €/);
  assert.match(totalSlide, /Phase 2 · salle de motricité/);
  assert.match(totalSlide, /montage financier\s+indépendant/);
  assert.match(totalSlide, /son montant devra être réétudié/);
});

// [SPEC-PRESENTATION-REVEAL-01] Slides reveal in sequence, can be completed at once, and expose completion state.
test("la présentation révèle les blocs au clic et permet de terminer une slide", async () => {
  const presentation = await readFile(
    new URL("../app/presentation/PresentationDeck.tsx", import.meta.url),
    "utf8",
  );
  const presentationStyles = await readFile(
    new URL("../app/presentation/presentation.module.css", import.meta.url),
    "utf8",
  );

  assert.match(presentation, /useLayoutEffect\(\(\) => \{[\s\S]*?collectRevealItems\(slide\)/);
  assert.match(presentation, /onClick=\{revealNextBlock\}/);
  assert.match(presentation, /Tout afficher/);
  assert.match(presentation, /Slide complète/);
  assert.match(presentation, /revealedCount < revealTotal/);
  assert.match(presentation, /REVEAL_CONTAINER_CLASSES\.some\(\(className\) => element\.classList\.contains\(className\)\)/);
  assert.match(presentation, /const groupName = element\.dataset\.revealGroup/);
  assert.match(presentation, /existingGroup\.push\(element\)/);
  assert.match(presentation, /styles\.charterGrid/);
  assert.match(presentation, /styles\.lexiconGrid/);
  assert.match(presentationStyles, /data-deck-reveal-hidden="true"/);
  assert.match(presentationStyles, /prefers-reduced-motion: reduce[\s\S]*?data-deck-reveal-hidden/);
  assert.match(presentationStyles, /\.skipRevealButton \{ position: absolute/);
  assert.match(presentationStyles, /\.revealBadge \{ position: absolute/);
});