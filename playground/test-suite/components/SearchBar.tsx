/**
 * TEST: Client Component with translatable props
 *
 * EXPECT TRANSLATED:
 * - placeholder="Search articles..."
 * - aria-label="Search"
 * - button text "Search"
 * - "No results found" text
 * - title="Clear search"
 *
 * EXPECT SKIPPED:
 * - type="text", role="search", name="query"
 */
"use client";

import { useState } from "react";export default function SearchBar() {  const [query, setQuery] = useState("");
  const [hasResults] = useState(true);

  return (
    <div role="search" className="w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          name="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          aria-label="Search"
          className="w-full px-4 py-2 pr-10 border rounded-lg" />
        
        {query &&
        <button
          onClick={() => setQuery("")}
          title="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          
            ✕
          </button>
        }
      </div>
      <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg w-full">Search

      </button>
      {!hasResults &&
      <p className="mt-4 text-gray-500 text-center">No results found. Try a different search term.

      </p>
      }
    </div>);

}