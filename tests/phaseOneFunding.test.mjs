import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  calculatePhaseOneRemainder,
  PHASE_ONE_AIDS,
  PHASE_ONE_TOTAL_EUROS,
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
    .split("{activeSlide === 7 && (")[1]
    ?.split("{activeSlide === 8 && (")[0];
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
    .split("{activeSlide === 3 && (")[1]
    ?.split("{activeSlide === 4 && (")[0];
  const charterSlide = presentation
    .split("{activeSlide === 1 && (")[1]
    ?.split("{activeSlide === 2 && (")[0];
  const simulationSlide = presentation
    .split("{activeSlide === 7 && (")[1]
    ?.split("{activeSlide === 8 && (")[0];

  assert.match(presentation, /id: "financement", label: "Le financement" \},\s*\{ id: "reste-a-charge", label: "Reste à charge" \},\s*\{ id: "depenses", label: "Dépenses réalisées" \}/);
  assert.ok(phaseOneSlide);
  assert.doesNotMatch(phaseOneSlide, /phaseOneFunding/);
  assert.ok(simulationSlide);
  assert.match(simulationSlide, /07 \/ Financement · Phase 1/);
  assert.match(presentation, /\{activeSlide === 8 && \([\s\S]*?08 \/ Les études déjà réalisées/);
  assert.match(presentation, /id: "collectif-cover", label: "Ouverture · Le collectif", countsAsContent: false/);
  assert.match(presentation, /\{activeSlide === 10 && \([\s\S]*?09 \/ Le collectif/);
  assert.match(presentation, /\{activeSlide === 11 && \([\s\S]*?10 \/ À quoi servirait la commission/);
  assert.match(presentation, /\{activeSlide === 12 && \([\s\S]*?11 \/ L’espace membre[\s\S]*?Le tableau de bord/);
  assert.match(presentation, /\{activeSlide === 13 && \([\s\S]*?12 \/ Des outils pour agir[\s\S]*?Propositions & actions[\s\S]*?Agenda & comptes rendus/);
  assert.match(presentation, /\{activeSlide === 14 && \([\s\S]*?13 \/ Mot de clôture/);
  assert.match(presentation, /activeSlide === 10 && \([\s\S]*?<div className=\{styles\.contentSlide\}>[\s\S]*?09 \/ Le collectif/);
  assert.ok(charterSlide);
  assert.doesNotMatch(charterSlide, /memberFeatureGrid|L’espace membre|Des outils pour agir/);
  assert.match(presentationStyles, /\.actionGrid \{[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(presentationStyles, /collectiveContentSlide/);
  assert.doesNotMatch(presentation, /\{activeSlide === 9 && \([\s\S]*?Quatre façons d’aider/);
});