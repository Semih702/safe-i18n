import { describe, it, expect } from "vitest";
import { classifyRisk } from "../../src/core/risk-classifier.js";
import type { RiskContext } from "../../src/core/risk-classifier.js";

function makeContext(overrides: Partial<RiskContext> = {}): RiskContext {
  return {
    source: "Save changes",
    parentType: "button",
    propName: null,
    isInConditional: false,
    isInTemplateLiteral: false,
    isComparisonOperand: false,
    isObjectKey: false,
    isInConsoleCall: false,
    isInApiCall: false,
    isInTestId: false,
    isInClassName: false,
    isInStorageCall: false,
    isInAnalyticsCall: false,
    isInRouteDefinition: false,
    isInImport: false,
    isEnumValue: false,
    ...overrides,
  };
}

describe("risk-classifier", () => {
  it("classifies static button text as AUTO_SAFE", () => {
    const result = classifyRisk(makeContext({ parentType: "button" }));
    expect(result.risk).toBe("AUTO_SAFE");
  });

  it("classifies h1 text as AUTO_SAFE", () => {
    const result = classifyRisk(makeContext({ parentType: "h1" }));
    expect(result.risk).toBe("AUTO_SAFE");
  });

  it("classifies placeholder prop as AUTO_SAFE", () => {
    const result = classifyRisk(
      makeContext({ propName: "placeholder", parentType: "input" }),
    );
    expect(result.risk).toBe("AUTO_SAFE");
  });

  it("classifies aria-label as AUTO_SAFE", () => {
    const result = classifyRisk(
      makeContext({ propName: "aria-label", parentType: "button" }),
    );
    expect(result.risk).toBe("AUTO_SAFE");
  });

  it("classifies alt prop as AUTO_SAFE", () => {
    const result = classifyRisk(
      makeContext({ propName: "alt", parentType: "img" }),
    );
    expect(result.risk).toBe("AUTO_SAFE");
  });

  it("classifies console call as SKIP_NON_UI", () => {
    const result = classifyRisk(makeContext({ isInConsoleCall: true }));
    expect(result.risk).toBe("SKIP_NON_UI");
  });

  it("classifies data-testid as SKIP_NON_UI", () => {
    const result = classifyRisk(makeContext({ isInTestId: true }));
    expect(result.risk).toBe("SKIP_NON_UI");
  });

  it("classifies className as SKIP_NON_UI", () => {
    const result = classifyRisk(makeContext({ isInClassName: true }));
    expect(result.risk).toBe("SKIP_NON_UI");
  });

  it("classifies import as SKIP_NON_UI", () => {
    const result = classifyRisk(makeContext({ isInImport: true }));
    expect(result.risk).toBe("SKIP_NON_UI");
  });

  it("classifies route definition as SKIP_NON_UI", () => {
    const result = classifyRisk(makeContext({ isInRouteDefinition: true }));
    expect(result.risk).toBe("SKIP_NON_UI");
  });

  it("classifies enum value as SKIP_NON_UI", () => {
    const result = classifyRisk(makeContext({ isEnumValue: true }));
    expect(result.risk).toBe("SKIP_NON_UI");
  });

  it("classifies comparison operand as SKIP_DANGEROUS", () => {
    const result = classifyRisk(makeContext({ isComparisonOperand: true }));
    expect(result.risk).toBe("SKIP_DANGEROUS");
  });

  it("classifies localStorage call as SKIP_DANGEROUS", () => {
    const result = classifyRisk(makeContext({ isInStorageCall: true }));
    expect(result.risk).toBe("SKIP_DANGEROUS");
  });

  it("classifies API call as SKIP_DANGEROUS", () => {
    const result = classifyRisk(makeContext({ isInApiCall: true }));
    expect(result.risk).toBe("SKIP_DANGEROUS");
  });

  it("classifies URL-like string as SKIP_DANGEROUS", () => {
    const result = classifyRisk(
      makeContext({ source: "https://api.example.com" }),
    );
    expect(result.risk).toBe("SKIP_DANGEROUS");
  });

  it("classifies path-like string as SKIP_DANGEROUS", () => {
    const result = classifyRisk(makeContext({ source: "/api/v1/users" }));
    expect(result.risk).toBe("SKIP_DANGEROUS");
  });

  it("classifies conditional string as REVIEW_REQUIRED", () => {
    const result = classifyRisk(makeContext({ isInConditional: true }));
    expect(result.risk).toBe("REVIEW_REQUIRED");
  });

  it("classifies template literal as REVIEW_REQUIRED", () => {
    const result = classifyRisk(makeContext({ isInTemplateLiteral: true }));
    expect(result.risk).toBe("REVIEW_REQUIRED");
  });
});
