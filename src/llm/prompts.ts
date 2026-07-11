import type { TranslationRequest, KeySuggestionRequest, FilterEntry } from "./provider.js";

export function buildTranslationPrompt(req: TranslationRequest): {
  system: string;
  user: string;
} {
  const variablesList =
    req.variables.length > 0
      ? `\nVariables present in the source text (MUST be preserved exactly as-is): ${req.variables.join(", ")}`
      : "";

  const preserveTokensList =
    req.preserveTokens.length > 0
      ? `\nAdditional tokens to preserve unchanged: ${req.preserveTokens.join(", ")}`
      : "";

  const system = [
    "You are a professional translator for software UI strings.",
    "You translate user interface text while strictly preserving:",
    "- Variable placeholders such as {name}, {count}, {0}, {{value}}, etc.",
    '- HTML tags like <b>, <br/>, <a href="...">',
    "- ICU message syntax including plural, select, and selectordinal blocks",
    "- Markdown formatting markers",
    "",
    "You must NOT:",
    "- Translate or modify route names, URL paths, API endpoints",
    "- Translate technical identifiers, CSS class names, data attributes",
    "- Translate brand names unless a known localized form exists",
    "- Translate code snippets or programming keywords",
    "- Add ANY new variables, placeholders, or tokens not present in the source",
    "- Include context information, descriptions, file paths, or component names in your output",
    "",
    "Rules:",
    "1. Return ONLY the translated text. Nothing else — no explanations, no quotes, no wrappers, no metadata.",
    "2. Preserve the exact whitespace pattern (leading/trailing spaces, newlines).",
    "3. Maintain the same casing style for placeholders.",
    "4. If a segment is ambiguous, prefer the most common UI translation.",
    "5. Keep the translation concise and natural for the target locale.",
    "6. If the source text has no variables, your output must have NO variables.",
  ].join("\n");

  const contextLines: string[] = [];
  if (req.description) {
    contextLines.push(`Context/description: ${req.description}`);
  }
  if (req.component) {
    contextLines.push(`UI component: ${req.component}`);
  }
  if (req.filePath) {
    contextLines.push(`Source file: ${req.filePath}`);
  }

  const contextBlock =
    contextLines.length > 0
      ? `\n\n[CONTEXT — for understanding only, do NOT include in output]\n${contextLines.join("\n")}`
      : "";

  const user = [
    `Translate the following text from "${req.sourceLocale}" to "${req.targetLocale}".`,
    contextBlock,
    variablesList,
    preserveTokensList,
    "",
    `[SOURCE TEXT — translate ONLY this]`,
    req.sourceText,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { system, user };
}

export function buildBatchTranslationPrompt(requests: TranslationRequest[]): {
  system: string;
  user: string;
} {
  const system = [
    "You are a professional translator for software UI strings.",
    "You translate user interface text while strictly preserving:",
    "- Variable placeholders such as {name}, {count}, {0}, {{value}}, etc.",
    '- HTML tags like <b>, <br/>, <a href="...">',
    "- ICU message syntax including plural, select, and selectordinal blocks",
    "- Markdown formatting markers",
    "",
    "You must NOT:",
    "- Translate or modify route names, URL paths, API endpoints",
    "- Translate technical identifiers, CSS class names, data attributes",
    "- Translate brand names unless a known localized form exists",
    "- Translate code snippets or programming keywords",
    "- Add ANY new variables, placeholders, or tokens not present in the source",
    "- Include context information, descriptions, file paths, or component names in your output",
    "",
    "Rules:",
    "1. Return ONLY a JSON array. No markdown fences, explanations, wrappers, or metadata.",
    '2. Each output item must be exactly: { "id": "...", "translatedText": "..." }.',
    "3. Return one output item for every input item, using the same id values.",
    "4. Preserve the exact whitespace pattern of each source text.",
    "5. Maintain the same casing style for placeholders.",
    "6. If a source text has no variables, its translatedText must have NO variables.",
  ].join("\n");

  const items = requests.map((request, index) => ({
    id: String(index),
    sourceLocale: request.sourceLocale,
    targetLocale: request.targetLocale,
    sourceText: request.sourceText,
    description: request.description,
    component: request.component,
    filePath: request.filePath,
    variables: request.variables,
    preserveTokens: request.preserveTokens,
  }));

  const user = [
    "Translate each input item. Return only the JSON array described by the system message.",
    JSON.stringify(items, null, 2),
  ].join("\n\n");

  return { system, user };
}

export function buildKeySuggestionPrompt(req: KeySuggestionRequest): {
  system: string;
  user: string;
} {
  const system = [
    "You are an expert at naming i18n translation keys for React/Next.js applications.",
    "Given a UI string and its context, suggest a namespace and a descriptive key.",
    "",
    "Guidelines for namespaces:",
    '- Use dot-separated lowercase segments (e.g. "dashboard", "auth.login", "settings.profile")',
    "- Derive from the route, file path, or component name when available",
    '- Use "common" for strings shared across multiple pages',
    "",
    "Guidelines for keys:",
    '- Use camelCase (e.g. "saveChanges", "welcomeMessage", "itemCount")',
    "- Be descriptive but concise",
    "- Reflect the purpose/meaning, not the exact wording",
    '- For buttons use verb forms: "submitForm", "cancelEdit"',
    '- For labels use noun forms: "emailLabel", "passwordLabel"',
    '- For messages use descriptive forms: "successMessage", "errorNotFound"',
    "",
    "Respond with ONLY a JSON object in this exact format (no markdown, no wrapping):",
    '{ "namespace": "...", "key": "...", "description": "..." }',
  ].join("\n");

  const contextLines: string[] = [`Source text: "${req.sourceText}"`, `File path: ${req.filePath}`];
  if (req.component) {
    contextLines.push(`Component name: ${req.component}`);
  }
  if (req.parentElement) {
    contextLines.push(`Parent HTML element: ${req.parentElement}`);
  }
  if (req.route) {
    contextLines.push(`Route: ${req.route}`);
  }

  const user = contextLines.join("\n");

  return { system, user };
}

export function buildFilterPrompt(entries: FilterEntry[]): {
  system: string;
  user: string;
} {
  const system = [
    "You are an expert at identifying which UI strings should NOT be translated in a software internationalization (i18n) project.",
    "",
    "A string should NOT be translated if it is:",
    "- A brand name, product name, or company name (e.g. GitHub, Next.js, Vercel, TestApp)",
    "- A technical term that is universally used in English across all locales (e.g. API, SDK, OAuth, JWT, webhook)",
    "- A programming keyword, code snippet, or command (e.g. npm install, console.log)",
    "- A proper noun that has no standard localized form",
    "- An abbreviation or acronym that is used as-is internationally",
    "",
    "A string SHOULD be translated if it is:",
    "- User-facing text in a natural language (buttons, labels, headings, descriptions, error messages)",
    "- A common English word used as UI text, even if short (e.g. Search, Save, Cancel, Submit)",
    "- A phrase or sentence meant for end users to read",
    "",
    "You will receive a JSON array of strings with their IDs and context.",
    'Return a JSON array of objects with the format: { "id": "...", "skip": true/false, "reason": "..." }',
    "Set skip=true ONLY for strings that should NOT be translated. Default to skip=false.",
    "Return ONLY the JSON array — no markdown fences, no explanation.",
  ].join("\n");

  const items = entries.map((e) => ({
    id: e.id,
    text: e.text,
    file: e.filePath,
    component: e.component,
    element: e.parentElement,
  }));

  const user = JSON.stringify(items, null, 2);

  return { system, user };
}
