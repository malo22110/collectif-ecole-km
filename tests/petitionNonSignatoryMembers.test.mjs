import assert from "node:assert/strict";
import test from "node:test";
import { findValidatedMembersWithoutSignature } from "../lib/nonSignatoryMembers.ts";

test("[SPEC-MEMBERS-NONSIGN-01] retourne seulement les membres validés absents des signatures", () => {
  const result = findValidatedMembersWithoutSignature(
    [
      { prenom: "Alice", nom: "Test", email: "ALICE@example.org", status: "validated" },
      { prenom: "Bob", nom: "Test", email: "bob@example.org", status: "validated" },
      { prenom: "Claire", nom: "Test", email: "claire@example.org", status: "pending" },
      {
        prenom: "David",
        nom: "Test",
        email: "david@example.org",
        status: "validated",
        emailBounced: true,
      },
    ],
    [{ email: " alice@example.org " }, { email: "Signature papier - Un autre membre" }],
  );

  assert.deepEqual(result, [{ name: "Bob Test" }]);
  assert.equal(JSON.stringify(result).includes("bob@example.org"), false);
});

test("[SPEC-MEMBERS-NONSIGN-01] déduplique les adresses et ignore celles qui sont vides", () => {
  const result = findValidatedMembersWithoutSignature(
    [
      { prenom: "Zoé", nom: "Martin", email: "zoe@example.org", status: "validated" },
      { prenom: "Zoe", nom: "Doublon", email: " ZOE@example.org ", status: "validated" },
      { prenom: "Sans", nom: "Email", status: "validated" },
    ],
    [],
  );

  assert.deepEqual(result, [{ name: "Zoé Martin" }]);
});
