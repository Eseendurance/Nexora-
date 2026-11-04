import assert from "node:assert/strict";
import { test } from "node:test";
import { contactEmail } from "../lib/mailer";

test("contact emails escape user-supplied HTML", () => {
  const html = contactEmail({
    name: "<script>alert(1)</script>",
    email: "person@example.com",
    company: "<img src=x>",
    subject: "Hello & welcome",
    message: "<b>message</b>\nsecond line",
  });

  assert.equal(html.includes("<script>"), false);
  assert.equal(html.includes("<img"), false);
  assert.equal(html.includes("<b>message</b>"), false);
  assert.equal(html.includes("&lt;script&gt;"), true);
  assert.equal(html.includes("second line"), true);
});
