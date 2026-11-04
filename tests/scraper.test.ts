import assert from "node:assert/strict";
import { test } from "node:test";
import { extractWebsite } from "../lib/scraper";

test("website extraction blocks loopback URLs before making a request", async () => {
  await assert.rejects(
    extractWebsite("http://127.0.0.1/"),
    /non-public network address/,
  );
});

test("website extraction blocks non-standard ports", async () => {
  await assert.rejects(
    extractWebsite("http://example.com:8080/"),
    /Only public HTTP and HTTPS/,
  );
});
