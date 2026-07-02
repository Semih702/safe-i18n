export function getNextIntlImport(type: "client" | "server"): string {
  if (type === "client") {
    return 'import { useTranslations } from "next-intl";';
  }
  return 'import { getTranslations } from "next-intl/server";';
}

export function getNextIntlHook(type: "client" | "server"): string {
  if (type === "client") {
    return "useTranslations";
  }
  return "getTranslations";
}

export function buildTranslationCall(
  tVar: string,
  key: string,
  variables?: Record<string, string>,
): string {
  if (variables === undefined || Object.keys(variables).length === 0) {
    return `${tVar}("${key}")`;
  }

  const entries = Object.entries(variables)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return `${tVar}("${key}", { ${entries} })`;
}
