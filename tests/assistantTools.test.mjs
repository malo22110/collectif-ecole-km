import assert from "node:assert/strict";
import test from "node:test";
import { ASSISTANT_TOOL_NAMES, assistantFunctionDeclarations, isAssistantToolName } from "../lib/assistantTools.ts";

// [SPEC-ASSISTANT-CMS-02] Only named read-only CMS capabilities are exposed to Gemini.
test("expose uniquement les outils CMS en lecture seule attendus", () => {
  assert.deepEqual(ASSISTANT_TOOL_NAMES, [
    "get_financial_ledger",
    "get_latest_articles",
    "get_petition_stats",
    "get_action_plan",
    "search_council_minutes",
    "search_official_sources"
  ]);
  assert.deepEqual(assistantFunctionDeclarations.map(tool => tool.name), [...ASSISTANT_TOOL_NAMES]);
  assert.equal(isAssistantToolName("get_financial_ledger"), true);
  assert.equal(isAssistantToolName("search_council_minutes"), true);
  assert.equal(isAssistantToolName("delete_signatures"), false);
  assert.ok(assistantFunctionDeclarations.every(tool => !tool.functionReference));
  const minutesTool = assistantFunctionDeclarations.find(tool => tool.name === "search_council_minutes");
  assert.deepEqual(minutesTool.parameters.required, ["query"]);
  assert.equal(minutesTool.parameters.properties.query.type, "string");
  const officialTool = assistantFunctionDeclarations.find(tool => tool.name === "search_official_sources");
  assert.deepEqual(officialTool.parameters.required, ["query"]);
});
