import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// [SPEC-CMS-HISTORY-01] The linked prefectural letter must be a real JPEG and the source link keyboard-accessible.
test("rend le courrier DETR accessible comme source de la frise", async () => {
  const image = await readFile(new URL("../public/docs/pvs/DETR.jpeg", import.meta.url));
  assert.equal(image[0], 0xff);
  assert.equal(image[1], 0xd8);
  assert.equal(image[image.length - 2], 0xff);
  assert.equal(image[image.length - 1], 0xd9);
  const timeline = await readFile(
    new URL("../app/components/cms/TimelineBlock.tsx", import.meta.url),
    "utf8",
  );
  assert.match(timeline, /href=\{encodeURI\(event\.sourceUrl\)\}/);
  assert.match(timeline, /rel="noopener noreferrer"/);
  assert.match(timeline, /\{event\.sourceLabel\}/);
  assert.doesNotMatch(timeline, /PV \{event\.sourceLabel\}/);
});
