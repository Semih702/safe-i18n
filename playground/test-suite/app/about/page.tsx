import { getTranslations } from "next-intl/server"; /**
 * TEST: Server Component — Various HTML Elements
 *
 * EXPECT TRANSLATED: all visible text (h1-h4, p, span, li, blockquote, figcaption, dt, dd, caption, th, td)
 * EXPECT SKIPPED: nothing — all are user-visible text
 */
export default async function AboutPage() {const t = await getTranslations("about");return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t("aboutUs")}</h1>
      <p className="text-gray-600">{t("weAreATeamOfPassionate")}



      </p>

      <h2 className="text-2xl font-semibold">{t("ourMission")}</h2>
      <p className="text-gray-600">{t("toSimplifyInternationalizationAndMakeEve")}



      </p>

      <h3 className="text-xl font-semibold">{t("ourValues")}</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li className="text-gray-700">{t("transparencyInEverythingWeDo")}</li>
        <li className="text-gray-700">{t("qualityOverQuantity")}</li>
        <li className="text-gray-700">{t("communitydrivenDevelopment")}</li>
        <li className="text-gray-700">{t("accessibilityAsACorePrinciple")}</li>
      </ul>

      <h4 className="text-lg font-semibold">{t("whatOurUsersSay")}</h4>
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600">{t("thisToolSavedUsWeeksOf")}

      </blockquote>
      <figcaption className="text-sm text-gray-500">{t("janeSmithEngineeringLeadAtTechcorp")}

      </figcaption>

      <h3 className="text-xl font-semibold">{t("keyFeatures")}</h3>
      <dl className="space-y-4">
        <dt className="font-semibold text-gray-800">{t("automaticDetection")}</dt>
        <dd className="text-gray-600 ml-4">{t("scansYourCodebaseAndFindsAll")}

        </dd>
        <dt className="font-semibold text-gray-800">{t("safeTransforms")}</dt>
        <dd className="text-gray-600 ml-4">{t("riskClassificationEnsuresYourCodeStays")}

        </dd>
      </dl>

      <h3 className="text-xl font-semibold">{t("statistics")}</h3>
      <table className="w-full border-collapse">
        <caption className="text-sm text-gray-500 mb-2">{t("platformUsageStatisticsForTheLast")}

        </caption>
        <thead>
          <tr>
            <th className="border p-2 text-left">{t("metric")}</th>
            <th className="border p-2 text-left">{t("value")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">{t("activeUsers")}</td>
            <td className="border p-2">12,500</td>
          </tr>
          <tr>
            <td className="border p-2">{t("projectsMigrated")}</td>
            <td className="border p-2">3,200</td>
          </tr>
          <tr>
            <td className="border p-2">{t("languagesSupported")}</td>
            <td className="border p-2">45</td>
          </tr>
        </tbody>
      </table>
    </div>);

}