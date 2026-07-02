import type {
  TranslationProvider,
  TranslationRequest,
  TranslationResult,
  KeySuggestionRequest,
  KeySuggestionResult,
} from "./provider.js";
import {
  buildTranslationPrompt,
  buildKeySuggestionPrompt,
} from "./prompts.js";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  choices: ChatCompletionChoice[];
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export class OpenAICompatibleProvider implements TranslationProvider {
  readonly name = "openai-compatible";
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKeyEnv: string;

  constructor(options: {
    model?: string;
    baseUrl?: string;
    apiKeyEnv?: string;
  }) {
    this.model = options.model ?? "gpt-4o-mini";
    this.baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    );
    this.apiKeyEnv = options.apiKeyEnv ?? "OPENAI_API_KEY";
  }

  private getApiKey(): string {
    const key = process.env[this.apiKeyEnv];
    if (!key) {
      throw new Error(
        `Missing API key: set the ${this.apiKeyEnv} environment variable`,
      );
    }
    return key;
  }

  private async chatCompletion(messages: ChatMessage[]): Promise<string> {
    const apiKey = this.getApiKey();
    const url = `${this.baseUrl}/chat/completions`;

    const body = JSON.stringify({
      model: this.model,
      messages,
      temperature: 0.3,
    });

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body,
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after");
          const waitMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : BASE_DELAY_MS * Math.pow(2, attempt);
          await this.sleep(waitMs);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `LLM API error (${response.status}): ${errorBody}`,
          );
        }

        const data = (await response.json()) as ChatCompletionResponse;
        const content = data.choices[0]?.message.content;
        if (!content) {
          throw new Error("LLM returned an empty response");
        }
        return content.trim();
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        // Don't retry on auth or validation errors
        if (
          lastError.message.includes("401") ||
          lastError.message.includes("403") ||
          lastError.message.includes("Missing API key")
        ) {
          throw lastError;
        }

        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(BASE_DELAY_MS * Math.pow(2, attempt));
        }
      }
    }

    throw lastError ?? new Error("LLM request failed after retries");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async translate(input: TranslationRequest): Promise<TranslationResult> {
    const { system, user } = buildTranslationPrompt(input);

    const translatedText = await this.chatCompletion([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);

    return {
      translatedText,
      confidence: 0.85,
    };
  }

  async translateBatch(
    inputs: TranslationRequest[],
  ): Promise<TranslationResult[]> {
    // Process sequentially to respect rate limits
    const results: TranslationResult[] = [];
    for (const input of inputs) {
      results.push(await this.translate(input));
    }
    return results;
  }

  async suggestKey(
    input: KeySuggestionRequest,
  ): Promise<KeySuggestionResult> {
    const { system, user } = buildKeySuggestionPrompt(input);

    const raw = await this.chatCompletion([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);

    // Strip markdown code fences if the model wraps the JSON
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    const namespace = typeof parsed["namespace"] === "string"
      ? parsed["namespace"]
      : "common";

    const key = typeof parsed["key"] === "string"
      ? parsed["key"]
      : "untitled";

    const description = typeof parsed["description"] === "string"
      ? parsed["description"]
      : "";

    return { namespace, key, description };
  }
}
