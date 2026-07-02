/**
 * TEST: Client Component — Interactive UI
 *
 * EXPECT TRANSLATED: button text, status labels, headings, tab labels
 * EXPECT SKIPPED: variant="outline", size="sm", role="tablist", data-testid values
 */
"use client";

import { useState } from "react";export default function DashboardPage() {  const [activeTab, setActiveTab] = useState("overview");
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          data-testid="refresh-button">Refresh Data


        </button>
      </div>

      <div role="tablist" className="flex gap-2 border-b">
        <button
          role="tab"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 ${activeTab === "overview" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-500"}`}>Overview


        </button>
        <button
          role="tab"
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 ${activeTab === "analytics" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-500"}`}>Analytics


        </button>
        <button
          role="tab"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 ${activeTab === "settings" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-500"}`}>Settings


        </button>
      </div>

      {activeTab === "overview" &&
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold">12,345</p>
            <span className="text-sm text-green-600">Active</span>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-2xl font-bold">$48,200</p>
            <span className="text-sm text-green-600">Growing</span>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-bold">3.2%</p>
            <span className="text-sm text-yellow-600">Stable</span>
          </div>
        </div>
      }

      {activeTab === "analytics" &&
      <div className="p-6 bg-white rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
          <p className="text-gray-600">Your traffic has increased by 25% compared to last month.

        </p>
          <p className="text-gray-600 mt-2">Most visitors come from organic search and social media.

        </p>
        </div>
      }

      {activeTab === "settings" &&
      <div className="p-6 bg-white rounded-xl shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">Account Settings</h2>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive updates about your account activity.

            </p>
            </div>
            <button className="px-3 py-1 border rounded text-sm">Enable

          </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account.

            </p>
            </div>
            <button className="px-3 py-1 border rounded text-sm">Configure

          </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently remove your account and all associated data.

            </p>
            </div>
            <button className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm">Delete

          </button>
          </div>
        </div>
      }

      <p className="text-sm text-gray-400">Last updated: just now. Refreshed
        {count} times.
      </p>
    </div>);

}