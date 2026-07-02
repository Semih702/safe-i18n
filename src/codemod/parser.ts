import { parse as babelParse } from "@babel/parser";
import _generate from "@babel/generator";
import type { File } from "@babel/types";

const generate = (typeof _generate === "function" ? _generate : (_generate as { default: typeof _generate }).default) as typeof _generate;

export function parseAST(source: string): File {
  return babelParse(source, {
    sourceType: "module",
    plugins: ["jsx", "typescript", "decorators"],
    tokens: true,
  });
}

export function printAST(ast: File): string {
  return generate(ast, { retainLines: true }).code;
}
