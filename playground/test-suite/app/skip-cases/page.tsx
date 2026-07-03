import { getTranslations } from "next-intl/server"; /**
 * TEST: Server Component — Skip Cases
 *
 * Tests strings that should NOT be translated mixed with some that should.
 *
 * SKIP CATEGORIES:
 * - Console/log strings
 * - Comparison operands
 * - Technical identifiers
 * - CSS/Tailwind class strings
 * - localStorage/sessionStorage keys
 * - API endpoints
 * - data-testid values
 * - enum-like values
 *
 * EXPECT TRANSLATED: h1, h2, p text, button text, link text, alt text
 */
export default async function SkipCasesPage() {const t = await getTranslations("skip-cases"); // Console calls — should be skipped
  console.log("Page rendered successfully");
  console.error("Something went wrong");
  console.warn("Deprecated feature used");

  // Comparison operands — should be skipped
  const status: string = "active";
  const isActive = status === "active";
  const isPending = status === "pending";

  // localStorage — should be skipped
  if (typeof window !== "undefined") {
    localStorage.setItem("theme", "dark");
    localStorage.getItem("user_preferences");
    sessionStorage.setItem("session_id", "abc123");
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t("skipCases")}</h1>
      <p className="text-gray-600">{t("thisPageTestsStringsThatShould")}

      </p>

      {/* Technical attributes — should all be skipped */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("technicalAttributes")}</h2>
        <div
          data-testid="skip-container"
          data-cy="test-element"
          data-test="test-value"
          role="region"
          id="skip-section"
          className="p-4 border rounded">
          
          <img
            src="/placeholder.png"
            alt={t("alt_testImageForSkipCases")}
            width={200}
            height={150}
            loading="lazy"
            decoding="async" />
          
        </div>
      </section>

      {/* SVG — attributes should be skipped */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("svgContent")}</h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6">
          
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </section>

      {/* Component props that should be skipped */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("componentProps")}</h2>
        <button
          type="submit"
          name="submit-btn"
          disabled={false}
          className="px-4 py-2 bg-blue-600 text-white rounded">{t("thisButtonTextShouldBeTranslated")}


        </button>
        <a
          href="https://example.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline">{t("thisLinkTextShouldBeTranslated")}


        </a>
      </section>
    </div>);

}