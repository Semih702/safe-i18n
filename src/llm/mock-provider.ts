import type {
  TranslationProvider,
  TranslationRequest,
  TranslationResult,
  KeySuggestionRequest,
  KeySuggestionResult,
  FilterEntry,
  FilterResult,
} from "./provider.js";

const LOCALE_PREFIXES: Record<string, string> = {
  tr: "[TR]",
  de: "[DE]",
  fr: "[FR]",
};

function getLocalePrefix(locale: string): string {
  return LOCALE_PREFIXES[locale] ?? `[${locale.toUpperCase()}]`;
}

/**
 * Splits a string into segments of variable placeholders and plain text,
 * preserving all placeholders like {name}, {count}, {{value}}, etc.
 */
function transformPreservingVariables(
  text: string,
  locale: string,
): string {
  const prefix = getLocalePrefix(locale);
  // Match placeholders: {word}, {{word}}, {0}, etc.
  const placeholderPattern = /\{\{?\w+\}?\}/g;

  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = placeholderPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // If no placeholders found, just prefix the whole string
  if (parts.length === 0) {
    return `${prefix} ${text}`;
  }

  // Prefix only the first non-placeholder part; if the text starts with a
  // placeholder, insert the prefix before it.
  let prefixed = false;
  const transformed = parts.map((part) => {
    if (placeholderPattern.test(part)) {
      // Reset lastIndex since we reuse the regex
      placeholderPattern.lastIndex = 0;
      return part;
    }
    placeholderPattern.lastIndex = 0;
    if (!prefixed) {
      prefixed = true;
      return `${prefix} ${part}`;
    }
    return part;
  });

  return transformed.join("");
}

function deriveKey(sourceText: string): string {
  return sourceText
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, ".");
}

export class MockProvider implements TranslationProvider {
  readonly name = "mock";

  async translate(input: TranslationRequest): Promise<TranslationResult> {
    const translatedText = transformPreservingVariables(
      input.sourceText,
      input.targetLocale,
    );

    return {
      translatedText,
      confidence: 1.0,
    };
  }

  async translateBatch(
    inputs: TranslationRequest[],
  ): Promise<TranslationResult[]> {
    return Promise.all(inputs.map((input) => this.translate(input)));
  }

  async filterTranslatable(entries: FilterEntry[]): Promise<FilterResult[]> {
    return entries.map((e) => ({ id: e.id, shouldTranslate: true }));
  }

  async suggestKey(
    input: KeySuggestionRequest,
  ): Promise<KeySuggestionResult> {
    const key = deriveKey(input.sourceText);

    // Derive namespace from component, route, or file path
    let namespace = "common";
    if (input.component) {
      namespace = input.component
        .replace(/([A-Z])/g, ".$1")
        .toLowerCase()
        .replace(/^\./, "");
    } else if (input.route) {
      namespace = input.route
        .replace(/^\//, "")
        .replace(/\//g, ".")
        .toLowerCase();
      if (namespace === "") {
        namespace = "home";
      }
    }

    return {
      namespace,
      key,
      description: `Translation for "${input.sourceText}"`,
    };
  }
}
