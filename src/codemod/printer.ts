import _generate from "@babel/generator";
import { parse } from "@babel/parser";

const generate = (typeof _generate === "function" ? _generate : (_generate as { default: typeof _generate }).default) as typeof _generate;

export function formatCode(source: string): string {
  try {
    const ast = parse(source, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "decorators"],
      errorRecovery: true,
    });
    return generate(ast, { retainLines: true }, source).code;
  } catch {
    return source;
  }
}
