/**
 * TEST: Client Component — Interactive UI
 *
 * EXPECT TRANSLATED: button text, status labels, headings, tab labels
 * EXPECT SKIPPED: variant="outline", size="sm", role="tablist", data-testid values
 */
"use client";

import { useState } from "react";import { useTranslations } from "next-intl";export default function DashboardPage() {const t = useTranslations("dashboard");const [activeTab, setActiveTab] = useState("overview");
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          data-testid="refresh-button">{t("refreshData")}


        </button>
      </div>

      <div role="tablist" className="flex gap-2 border-b">
        <button
          role="tab"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 ${activeTab === "overview" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-500"}`}>{t("overview")}


        </button>
        <button
          role="tab"
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 ${activeTab === "analytics" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-500"}`}>{t("analytics")}


        </button>
        <button
          role="tab"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 ${activeTab === "settings" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-500"}`}>{t("settings")}


        </button>
      </div>

      {activeTab === "overview" &&
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">{t("totalUsers")}</p>
            <p className="text-2xl font-bold">12,345</p>
            <span className="text-sm text-green-600">{t("active")}</span>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">{t("revenue")}</p>
            <p className="text-2xl font-bold">{t("48200")}</p>
            <span className="text-sm text-green-600">{t("growing")}</span>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">{t("conversionRate")}</p>
            <p className="text-2xl font-bold">3.2%</p>
            <span className="text-sm text-yellow-600">{t("stable")}</span>
          </div>
        </div>
      }

      {activeTab === "analytics" &&
      <div className="p-6 bg-white rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t("analyticsOverview")}</h2>
          <p className="text-gray-600">{t("yourTrafficHasIncreasedBy25")}

        </p>
          <p className="text-gray-600 mt-2">{t("mostVisitorsComeFromOrganicSearch")}

        </p>
        </div>
      }

      {activeTab === "settings" &&
      <div className="p-6 bg-white rounded-xl shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">{t("accountSettings")}</h2>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">{t("emailNotifications")}</p>
              <p className="text-sm text-gray-500">{t("receiveUpdatesAboutYourAccountActivity")}

            </p>
            </div>
            <button className="px-3 py-1 border rounded text-sm">{t("enable")}

          </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">{t("twofactorAuthentication")}</p>
              <p className="text-sm text-gray-500">{t("addAnExtraLayerOfSecurity")}

            </p>
            </div>
            <button className="px-3 py-1 border rounded text-sm">{t("configure")}

          </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-red-600">{t("deleteAccount")}</p>
              <p className="text-sm text-gray-500">{t("permanentlyRemoveYourAccountAndAll")}

            </p>
            </div>
            <button className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm">{t("delete")}

          </button>
          </div>
        </div>
      }

      <p className="text-sm text-gray-400">{t("lastUpdatedJustNowRefreshed")}
        {count} times.
      </p>
    </div>);

}