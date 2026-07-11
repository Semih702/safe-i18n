import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractPlaceholders,
  checkPlaceholderParity,
  checkBalancedBraces,
} from "../src/core/placeholder-analysis.js";

describe("extractPlaceholders", () => {
  it("extracts simple placeholders", () => {
    assert.deepEqual(extractPlaceholders("Hello {name}!"), ["name"]);
  });

  it("extracts multiple placeholders", () => {
    assert.deepEqual(
      extractPlaceholders("{greeting} {name}, you have {count} items"),
      ["greeting", "name", "count"],
    );
  });

  it("deduplicates placeholders", () => {
    assert.deepEqual(extractPlaceholders("{x} and {x}"), ["x"]);
  });

  it("returns empty for no placeholders", () => {
    assert.deepEqual(extractPlaceholders("Hello world"), []);
  });

  it("ignores nested braces that are not simple placeholders", () => {
    assert.deepEqual(extractPlaceholders("{{not a placeholder}}"), []);
  });

  it("extracts only top-level placeholders from ICU plural", () => {
    const text = "{count, plural, =0 {empty} one {# item} other {# items}}";
    assert.deepEqual(extractPlaceholders(text), ["count"]);
  });

  it("extracts placeholder but ignores ICU branch body text", () => {
    const text = "You have {count, plural, one {# message} other {# messages}} from {sender}";
    assert.deepEqual(extractPlaceholders(text), ["count", "sender"]);
  });

  it("does not extract ICU keywords as placeholders", () => {
    assert.deepEqual(extractPlaceholders("{plural}"), []);
    assert.deepEqual(extractPlaceholders("{select}"), []);
    assert.deepEqual(extractPlaceholders("{other}"), []);
    assert.deepEqual(extractPlaceholders("{one}"), []);
  });
});

describe("checkPlaceholderParity", () => {
  it("returns no issues when placeholders match", () => {
    const base = { msg: "Hello {name}" };
    const target = { msg: "Bonjour {name}" };
    const issues = checkPlaceholderParity(base, target, "fr");
    assert.equal(issues.length, 0);
  });

  it("detects missing placeholder in target", () => {
    const base = { msg: "Hello {name}" };
    const target = { msg: "Bonjour" };
    const issues = checkPlaceholderParity(base, target, "fr");
    assert.equal(issues.length, 1);
    assert.equal(issues[0]!.type, "placeholder-mismatch");
    assert.ok(issues[0]!.message.includes("{name}"));
  });

  it("detects extra placeholder in target", () => {
    const base = { msg: "Hello" };
    const target = { msg: "Bonjour {extra}" };
    const issues = checkPlaceholderParity(base, target, "fr");
    assert.equal(issues.length, 1);
    assert.ok(issues[0]!.message.includes("{extra}"));
  });

  it("skips keys not in target", () => {
    const base = { msg: "Hello {name}" };
    const target = {};
    const issues = checkPlaceholderParity(base, target, "fr");
    assert.equal(issues.length, 0);
  });
});

describe("checkBalancedBraces", () => {
  it("returns true for balanced braces", () => {
    assert.equal(checkBalancedBraces("{count, plural, one {# item} other {# items}}"), true);
  });

  it("returns true for no braces", () => {
    assert.equal(checkBalancedBraces("Hello world"), true);
  });

  it("returns false for unbalanced opening", () => {
    assert.equal(checkBalancedBraces("{unclosed"), false);
  });

  it("returns false for unbalanced closing", () => {
    assert.equal(checkBalancedBraces("extra}"), false);
  });

  it("handles ICU escaped braces with single quote", () => {
    assert.equal(checkBalancedBraces("'{' literal brace"), true);
    assert.equal(checkBalancedBraces("'}' literal brace"), true);
  });

  it("returns true for simple placeholder", () => {
    assert.equal(checkBalancedBraces("Hello {name}!"), true);
  });
});
