/**
 * TEST: Server Component — Basic Translations
 *
 * EXPECT TRANSLATED: h1, p, link texts, span badge
 * EXPECT SKIPPED: href, className
 */
import Link from "next/link";import { getTranslations } from "next-intl/server";export default async function HomePage() {const t = await getTranslations("common");return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{t("new")}

        </span>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">{t("welcomeToOurPlatform")}

        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t("buildSomethingAmazingWithOurTools")}



        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">{t("getStarted")}


        </Link>
        <Link
          href="/about"
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium">{t("learnMore")}


        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg">{t("fastPerformance")}</h3>
          <p className="text-gray-600 mt-2">{t("lightningfastLoadTimesWithOptimizedBuild")}</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg">{t("easyToUse")}</h3>
          <p className="text-gray-600 mt-2">{t("intuitiveInterfaceDesignedForDevelopersO")}</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg">{t("secureByDefault")}</h3>
          <p className="text-gray-600 mt-2">{t("enterprisegradeSecurityOutOfTheBox")}</p>
        </div>
      </div>
    </div>);

}