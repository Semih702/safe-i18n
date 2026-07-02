"use client";

import { useState } from "react";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
      <button
        aria-label="Open menu"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        Menu
      </button>
      {menuOpen && (
        <div>
          <a href="/settings">Settings</a>
          <a href="/profile">Profile</a>
        </div>
      )}
    </header>
  );
}
