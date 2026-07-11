import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { addLocales } from "../../src/cli/commands/add-locale.js";
import type {
  TranslationProvider,
  TranslationRequest,
  TranslationResult,
} from "../../src/llm/provider.js";

class CountingBatchProvider implements TranslationProvider {
  readonly name = "counting-batch";
  readonly batchSizes: number[] = [];
  singleCalls = 0;

  async translate(input: TranslationRequest): Promise<TranslationResult> {
    this.singleCalls++;
    return {
      translatedText: `[${input.targetLocale.toUpperCase()}] ${input.sourceText}`,
      confidence: 1,
    };
  }

  async translateBatch(inputs: TranslationRequest[]): Promise<TranslationResult[]> {
    this.batchSizes.push(inputs.length);
    return inputs.map((input) => ({
      translatedText: `[${input.targetLocale.toUpperCase()}] ${input.sourceText}`,
      confidence: 1,
    }));
  }
}

describe("addLocales", () => {
  it("translates missing keys in batches", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "safe-i18n-add-locale-"));
    try {
      const messagesDir = path.join(tempDir, "messages");
      await mkdir(messagesDir, { recursive: true });
      await writeFile(
        path.join(messagesDir, "en.json"),
        JSON.stringify({
          common: {
            one: "One",
            two: "Two",
            three: "Three",
            four: "Four",
            five: "Five",
          },
        }),
      );

      const provider = new CountingBatchProvider();
      const result = await addLocales({
        root: tempDir,
        sourceLocale: "en",
        targetLocales: ["de"],
        messagesPath: "messages",
        provider,
        batchSize: 2,
      });

      expect(result).toEqual({
        totalTranslations: 5,
        localesAdded: ["de"],
      });
      expect(provider.batchSizes).toEqual([2, 2, 1]);
      expect(provider.singleCalls).toBe(0);

      const content = await readFile(path.join(messagesDir, "de.json"), "utf-8");
      const messages = JSON.parse(content) as {
        common: Record<string, string>;
      };
      expect(messages.common["one"]).toBe("[DE] One");
      expect(messages.common["five"]).toBe("[DE] Five");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
