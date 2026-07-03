import { getTranslations } from "next-intl/server"; /**
 * TEST: Server Component — Edge Cases
 *
 * EXPECT TRANSLATED:
 * - Short words: "or", "and", "to", "by", "at", "on"
 * - Ternary strings (both branches)
 * - Text with special characters: "Don't miss out!", "It's free — forever."
 * - Text with numbers: "Over 100 satisfied customers"
 * - Questions: "Need help?"
 * - Exclamations: "Welcome back!"
 * - Single word in visible element: "Subscribe"
 * - Text after JSX expression: "items in cart"
 *
 * EXPECT SKIPPED:
 * - Template literal with className
 * - URL patterns
 */
const isLoggedIn = false;
const cartCount = 3;
const userPlan: string = "free";

export default async function EdgeCasesPage() {const t = await getTranslations("edge-cases");return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t("edgeCases")}</h1>

      {/* Short words */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">{t("shortWords")}</h2>
        <p className="text-gray-600">{t("signUp")}
          <em>{t("or")}</em>{t("logInToContinue")}
        </p>
        <p className="text-gray-600">{t("termsAndConditionsApply")}

        </p>
      </section>

      {/* Ternary expressions */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">{t("conditionalText")}</h2>
        <p className="text-gray-600">
          {isLoggedIn ? t("welcomeBack") : t("pleaseSignInToContinue")}
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          {isLoggedIn ? t("goToDashboard") : t("signIn")}
        </button>
        <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100">
          {userPlan === "pro" ? t("professionalPlan") : t("freePlan")}
        </span>
      </section>

      {/* Special characters */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">{t("specialCharacters")}</h2>
        <p className="text-gray-600">{t("dontMissOutOnThisOpportunity")}</p>
        <p className="text-gray-600">{t("itsCompletelyFreeNoCreditCard")}</p>
        <p className="text-gray-600">{t("trustedBy10000CompaniesWorldwide")}</p>
        <p className="text-gray-600">{t("needHelpWereHereForYou")}</p>
      </section>

      {/* Mixed content with JSX */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">{t("mixedContent")}</h2>
        <p className="text-gray-600">{t("youHave")}
          <strong>{cartCount}</strong>{t("itemsInYourCart")}
        </p>
        <p className="text-gray-600">{t("over")}
          <span className="font-bold text-blue-600">100</span>{t("satisfiedCustomers")}
        </p>
      </section>

      {/* Buttons and labels */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">{t("actions")}</h2>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">{t("subscribe")}</button>
          <button className="px-4 py-2 bg-green-600 text-white rounded">{t("downloadNow")}</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded">{t("cancel")}</button>
          <button className="px-4 py-2 border border-red-500 text-red-500 rounded">{t("removeAccount")}

          </button>
        </div>
      </section>
    </div>);

}