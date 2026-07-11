import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenAICompatibleProvider } from "../../src/llm/openai-compatible-provider.js";
import type { TranslationRequest } from "../../src/llm/provider.js";

function createRequest(sourceText: string): TranslationRequest {
  return {
    sourceLocale: "en",
    targetLocale: "de",
    sourceText,
    variables: [],
    preserveTokens: [],
  };
}

function createResponse(content: string): Response {
  return new Response(
    JSON.stringify({
      id: "chatcmpl_test",
      object: "chat.completion",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content,
          },
          finish_reason: "stop",
        },
      ],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

describe("OpenAICompatibleProvider", () => {
  beforeEach(() => {
    process.env["SAFE_I18N_TEST_OPENAI_KEY"] = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env["SAFE_I18N_TEST_OPENAI_KEY"];
  });

  it("translates a batch in one chat completion request", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        calls.push(String(init?.body));
        return createResponse(
          JSON.stringify([
            { id: "0", translatedText: "Speichern" },
            { id: "1", translatedText: "Abbrechen" },
          ]),
        );
      }),
    );

    const provider = new OpenAICompatibleProvider({
      apiKeyEnv: "SAFE_I18N_TEST_OPENAI_KEY",
    });
    const results = await provider.translateBatch([createRequest("Save"), createRequest("Cancel")]);

    expect(calls).toHaveLength(1);
    expect(results.map((result) => result.translatedText)).toEqual(["Speichern", "Abbrechen"]);
    expect(calls[0]).toContain("Save");
    expect(calls[0]).toContain("Cancel");
  });

  it("falls back to single translations when batch JSON cannot be parsed", async () => {
    const contents = ["not json", "Speichern", "Abbrechen"];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => createResponse(contents.shift() ?? "")),
    );

    const provider = new OpenAICompatibleProvider({
      apiKeyEnv: "SAFE_I18N_TEST_OPENAI_KEY",
    });
    const results = await provider.translateBatch([createRequest("Save"), createRequest("Cancel")]);

    expect(results.map((result) => result.translatedText)).toEqual(["Speichern", "Abbrechen"]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
