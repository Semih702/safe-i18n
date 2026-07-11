export function createStubContent(
  base: Record<string, unknown>,
  locale: string,
): Record<string, unknown> {
  const stub: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(base)) {
    if (typeof value === "string") {
      stub[key] = `TODO [${locale}]: ${value}`;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      stub[key] = createStubContent(value as Record<string, unknown>, locale);
    } else {
      stub[key] = value;
    }
  }

  return stub;
}
