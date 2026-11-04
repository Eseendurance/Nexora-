import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../lib/password";

test("password hashes verify without storing the original password", async () => {
  const password = "Nexora-test-password-2026";
  const hash = await hashPassword(password);

  assert.notEqual(hash, password);
  assert.match(hash, /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("incorrect-password", hash), false);
});

test("malformed password hashes are rejected", async () => {
  assert.equal(await verifyPassword("password", "not-a-valid-hash"), false);
});
