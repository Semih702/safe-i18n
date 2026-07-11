"use client";

import { useState } from "react";

const PROMPT_PLACEHOLDERS = {
  prompt: "Describe in plain English what should happen",
};

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
      <button aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>
        Menu
      </button>
      <input placeholder={PROMPT_PLACEHOLDERS.prompt} />
      {menuOpen && (
        <div>
          <a href="/settings">Settings</a>
          <a href="/profile">Profile</a>
        </div>
      )}
    </header>
  );
}
