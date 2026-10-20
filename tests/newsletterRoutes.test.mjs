import assert from "node:assert/strict";
import test from "node:test";

const base = process.env.NEWSLETTER_TEST_BASE_URL;

// [SPEC-NEWSLETTER-API-01] Unauthenticated HTTP callers must never reach provider operations.
test("les opérations Newsletter exigent une session autorisée", { skip: !base }, async () => {
  const url = new URL(base);
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname), "Tests limités au serveur local");
  for (const [path, method] of [
    ["/api/newsletter/campaigns", "GET"],
    ["/api/newsletter/campaigns", "POST"],
    ["/api/newsletter/sync", "POST"],
    ["/api/newsletter/campaigns/00000000-0000-4000-8000-000000000001", "POST"],
  ]) {
    const response = await fetch(new URL(path, url), {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    assert.equal(response.status, 401, `${method} ${path}`);
    const result = await response.json();
    assert.equal(typeof result.error, "string");
  }
});
