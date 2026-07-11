import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStubContent } from "../src/core/stub-generator.js";

describe("createStubContent", () => {
  it("replaces string values with TODO placeholders", () => {
    const base = { greeting: "Hello", farewell: "Goodbye" };
    const result = createStubContent(base, "ja");
    assert.deepEqual(result, {
      greeting: "TODO [ja]: Hello",
      farewell: "TODO [ja]: Goodbye",
    });
  });

  it("handles nested objects", () => {
    const base = { nav: { home: "Home", about: "About" } };
    const result = createStubContent(base, "fr");
    assert.deepEqual(result, {
      nav: { home: "TODO [fr]: Home", about: "TODO [fr]: About" },
    });
  });

  it("preserves non-string non-object values", () => {
    const base = { count: 42, items: [1, 2] } as any;
    const result = createStubContent(base, "de");
    assert.equal(result.count, 42);
    assert.deepEqual(result.items, [1, 2]);
  });

  it("handles deeply nested structures", () => {
    const base = { a: { b: { c: { d: "deep" } } } };
    const result = createStubContent(base, "ko");
    assert.equal((result.a as any).b.c.d, "TODO [ko]: deep");
  });

  it("returns empty object for empty input", () => {
    assert.deepEqual(createStubContent({}, "fr"), {});
  });
});
