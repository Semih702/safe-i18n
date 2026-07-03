import { MockProvider } from "./mock-provider.js";
import { OpenAICompatibleProvider } from "./openai-compatible-provider.js";

export interface TranslationRequest {
  sourceLocale: string;
  targetLocale: string;
  sourceText: string;
  description?: string;
  component?: string;
  filePath?: string;
  variables: string[];
  preserveTokens: string[];
}

export interface TranslationResult {
  translatedText: string;
  confidence: number;
}

export interface KeySuggestionRequest {
  sourceText: string;
  filePath: string;
  component?: string;
  parentElement?: string;
  route?: string;
}

export interface KeySuggestionResult {
  namespace: string;
  key: string;
  description: string;
}

export interface FilterEntry {
  id: string;
  text: string;
  filePath: string;
  component?: string;
  parentElement?: string;
}

export interface FilterResult {
  id: string;
  shouldTranslate: boolean;
  reason?: string;
}

export interface TranslationProvider {
  name: string;
  translate(input: TranslationRequest): Promise<TranslationResult>;
  translateBatch?(inputs: TranslationRequest[]): Promise<TranslationResult[]>;
  suggestKey?(input: KeySuggestionRequest): Promise<KeySuggestionResult>;
  filterTranslatable?(entries: FilterEntry[]): Promise<FilterResult[]>;
}

export interface ProviderConfig {
  provider: string;
  model?: string;
  baseUrl?: string;
  apiKeyEnv?: string;
}

export function createProvider(config: ProviderConfig): TranslationProvider {
  switch (config.provider) {
    case "mock":
      return new MockProvider();

    case "openai-compatible":
      return new OpenAICompatibleProvider({
        model: config.model,
        baseUrl: config.baseUrl,
        apiKeyEnv: config.apiKeyEnv,
      });

    default:
      throw new Error(
        `Unknown LLM provider: "${config.provider}". Supported providers: mock, openai-compatible`,
      );
  }
}
