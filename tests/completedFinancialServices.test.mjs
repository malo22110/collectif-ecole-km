import assert from "node:assert/strict";
import test from "node:test";
import {
  completedFinancialServices,
  completedFinancialServicesCutoff,
  completedFinancialServicesTotal,
  getCompletedFinancialServicesCategoryTotal,
} from "../lib/completedFinancialServices.ts";

test("[SPEC-FIN-01] détaille les dépenses réalisées arrêtées au 31 mars 2026", () => {
  assert.equal(completedFinancialServicesCutoff, "31 mars 2026");
  assert.deepEqual(
    completedFinancialServices.map(getCompletedFinancialServicesCategoryTotal),
    [11280, 13500, 31050, 14064],
  );
  assert.equal(completedFinancialServicesTotal, 69894);
});