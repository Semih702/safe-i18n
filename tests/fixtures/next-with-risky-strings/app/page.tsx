"use client";

import { useState } from "react";

export default function DashboardPage() {
  const [status, setStatus] = useState("idle");
  const user = { name: "John", role: "admin" };

  // Conditional strings — should be REVIEW_REQUIRED
  const statusLabel = status === "loading" ? "Loading..." : "Ready";

  // Template literal — should be REVIEW_REQUIRED
  const greeting = `Welcome back, ${user.name}`;

  // API path — should be SKIP_NON_UI or SKIP_DANGEROUS
  const apiUrl = "/api/v1/users";

  // localStorage key — should be SKIP_DANGEROUS
  localStorage.setItem("theme", "dark");

  // Analytics event — should be SKIP_NON_UI
  console.log("page_view", { page: "dashboard" });

  // Comparison — should be SKIP_DANGEROUS
  if (user.role === "admin") {
    console.log("Admin access granted");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>{statusLabel}</p>
      <p>{greeting}</p>
      <button data-testid="refresh-btn" onClick={() => setStatus("loading")}>
        Refresh data
      </button>
      <span className="text-muted">
        {status === "loading" ? "Please wait..." : "All systems operational"}
      </span>
      <img src="/logo.png" alt="Company logo" />
      <a href={apiUrl}>View API docs</a>
    </div>
  );
}
