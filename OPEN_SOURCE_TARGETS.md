# Open-Source Test Targets for safe-i18n

Real open-source React and Next.js repositories that do **not** have i18n support. These are good candidates for testing safe-i18n's scanning, planning, and transformation workflows against real-world codebases.

All repositories listed below were verified to have **no i18n libraries** (no next-intl, react-intl, i18next, react-i18next, lingui, or formatjs) in their dependencies as of June 2026.

## Selection Criteria

- Must be a real repository that exists on GitHub
- Must be a React or Next.js project with user-facing UI strings
- Must NOT already have i18n libraries in dependencies
- Should be actively maintained with recent commits
- Should be small to medium size (not massive monorepos)
- Should have clear TSX/JSX components with hardcoded English strings

---

## 1. Kiranism/next-shadcn-dashboard-starter

- **Repository:** [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
- **Framework:** Next.js (App Router) + React + TypeScript
- **Stars:** ~4,600+
- **Why it is useful for testing:** Full-featured admin dashboard with dozens of pages and components -- Kanban boards, data tables, user management, analytics charts, forms, modals, sidebar navigation. Contains a large number of hardcoded UI strings spread across many files and component patterns. Uses shadcn/ui, Radix UI primitives, and Tailwind CSS. Excellent for stress-testing the scanner on a mid-size project with deep component nesting.
- **i18n status:** No i18n libraries in dependencies. All strings are hardcoded in English. Verified via package.json inspection.
- **Suggested test commands:**
  ```bash
  git clone https://github.com/Kiranism/next-shadcn-dashboard-starter.git
  cd next-shadcn-dashboard-starter
  npx safe-i18n init --source en --locales tr,de,fr
  npx safe-i18n scan
  npx safe-i18n plan
  npx safe-i18n apply --safe-only
  ```
- **Risk/complexity:** Medium. Uses Clerk for authentication (which has its own UI strings), @dnd-kit for drag-and-drop, and @tanstack/react-table -- all of which generate label and aria strings that should be classified correctly. Good breadth of UI patterns.

---

## 2. mickasmt/next-saas-stripe-starter

- **Repository:** [mickasmt/next-saas-stripe-starter](https://github.com/mickasmt/next-saas-stripe-starter)
- **Framework:** Next.js 14 (App Router) + React + TypeScript
- **Stars:** ~3,000+
- **Why it is useful for testing:** SaaS starter with user roles, admin panel, pricing pages, blog (via Contentlayer/MDX), authentication flows, and Stripe integration. Has marketing pages, dashboard UI, forms, and email templates. Good variety of string types: page headings, button labels, form placeholders, pricing tier descriptions, error messages, and MDX content.
- **i18n status:** No i18n libraries in dependencies. All UI text is hardcoded in English. Verified via package.json inspection.
- **Suggested test commands:**
  ```bash
  git clone https://github.com/mickasmt/next-saas-stripe-starter.git
  cd next-saas-stripe-starter
  npx safe-i18n init --source en --locales tr,de
  npx safe-i18n scan
  npx safe-i18n plan
  npx safe-i18n apply --safe-only
  ```
- **Risk/complexity:** Medium. Stripe integration means some strings are pricing-related (currency formats, plan names) that should be classified carefully. MDX blog content should be excluded from scanning. Auth.js v5 and Prisma add server-side patterns.

---

## 3. nextjs/saas-starter

- **Repository:** [nextjs/saas-starter](https://github.com/nextjs/saas-starter)
- **Framework:** Next.js (App Router) + React + TypeScript
- **Stars:** High (official Next.js org repository)
- **Why it is useful for testing:** The official Next.js SaaS starter template. Compact, well-structured codebase with authentication, Stripe payments, a dashboard, and shadcn/ui components. Because it is small and well-organized, it is ideal for quick smoke tests and verifying the full scan-plan-apply-translate-validate pipeline end to end.
- **i18n status:** No i18n libraries in dependencies. UI strings are hardcoded. Verified via package.json inspection.
- **Suggested test commands:**
  ```bash
  git clone https://github.com/nextjs/saas-starter.git
  cd saas-starter
  npx safe-i18n init --source en --locales tr,de,fr
  npx safe-i18n scan
  npx safe-i18n plan
  npx safe-i18n apply --safe-only
  npx safe-i18n translate --to tr,de,fr --provider mock
  npx safe-i18n validate
  ```
- **Risk/complexity:** Low. Small codebase, uses Drizzle ORM and jose for JWT. Good for a fast round-trip test of the full pipeline.

---

## 4. cruip/open-react-template

- **Repository:** [cruip/open-react-template](https://github.com/cruip/open-react-template)
- **Framework:** Next.js 15 + React 19 + TypeScript
- **Stars:** ~4,600+
- **Why it is useful for testing:** A polished landing page template designed for showcasing SaaS products and open-source projects. Contains marketing copy, feature sections, hero text, testimonials, CTAs, and footer links. Landing pages have the highest density of user-facing strings and almost no programmatic/non-UI strings. Tests how well safe-i18n handles a project where nearly every string should be AUTO_SAFE.
- **i18n status:** No i18n libraries in dependencies. All text is hardcoded in English. Verified via package.json inspection.
- **Suggested test commands:**
  ```bash
  git clone https://github.com/cruip/open-react-template.git
  cd open-react-template
  npx safe-i18n init --source en --locales tr,de,fr
  npx safe-i18n scan
  npx safe-i18n plan
  npx safe-i18n apply --safe-only
  ```
- **Risk/complexity:** Low. Uses Headless UI and AOS (animate on scroll). Very lightweight dependency tree. Minimal framework code -- mostly static content. Ideal for demonstrating safe-i18n on a marketing site.

---

## 5. nobruf/shadcn-landing-page

- **Repository:** [nobruf/shadcn-landing-page](https://github.com/nobruf/shadcn-landing-page)
- **Framework:** Next.js + React + TypeScript
- **Stars:** ~1,200+
- **Why it is useful for testing:** A landing page template built entirely with shadcn/ui and Radix UI components. Contains hero sections, feature grids, testimonials with avatars, pricing tables, FAQ accordions, team member cards, newsletter signup forms, and a footer. The component-heavy architecture (heavy use of shadcn Card, Accordion, Dialog, NavigationMenu) makes it a good test for how safe-i18n handles strings inside component library wrappers.
- **i18n status:** No i18n libraries in dependencies. All UI text is hardcoded. Verified via package.json inspection.
- **Suggested test commands:**
  ```bash
  git clone https://github.com/nobruf/shadcn-landing-page.git
  cd shadcn-landing-page
  npx safe-i18n init --source en --locales tr,de
  npx safe-i18n scan
  npx safe-i18n plan
  npx safe-i18n apply --safe-only
  ```
- **Risk/complexity:** Low. Uses embla-carousel-react for carousels. Strings are often nested inside shadcn component props and children. Good test for string extraction from complex JSX trees.

---

## 6. soumyajit4419/Portfolio

- **Repository:** [soumyajit4419/Portfolio](https://github.com/soumyajit4419/Portfolio)
- **Framework:** React (Create React App) + JavaScript
- **Stars:** ~6,100+
- **Why it is useful for testing:** A widely-forked React portfolio site with multiple pages (home, about, projects, resume). Uses React Router, React Bootstrap, react-icons, and particle effects. This is a **plain React project** (not Next.js), making it a good test for verifying that safe-i18n works outside the Next.js ecosystem. Contains personal bio text, project descriptions, skill labels, navigation links, and footer text.
- **i18n status:** No i18n libraries in dependencies. All text is hardcoded. Verified via package.json inspection.
- **Suggested test commands:**
  ```bash
  git clone https://github.com/soumyajit4419/Portfolio.git
  cd Portfolio
  npx safe-i18n init --source en --locales tr,de
  npx safe-i18n scan
  npx safe-i18n plan
  ```
- **Risk/complexity:** Medium. Uses JavaScript (not TypeScript) and Create React App, so this tests safe-i18n's ability to handle `.jsx` files and non-Next.js project structures. Some strings are personal content (bio, project descriptions) that may not make sense to translate -- a good edge case for risk classification. Bootstrap component wrappers add variety.

---

## 7. adrianhajdin/figma_clone

- **Repository:** [adrianhajdin/figma_clone](https://github.com/adrianhajdin/figma_clone)
- **Framework:** Next.js 14 + React 18 + TypeScript
- **Stars:** ~1,200+
- **Why it is useful for testing:** A Figma clone with real-time collaboration features using Liveblocks. Contains a canvas-based UI with context menus, dropdown menus, tooltips, select inputs, and toolbar labels. This is an interesting test target because it mixes genuine UI strings (menu labels, tooltips, button text) with programmatic strings (canvas coordinates, fabric.js commands, event names, CSS class names) that must **not** be translated. Excellent for stress-testing risk classification.
- **i18n status:** No i18n libraries in dependencies. All UI text is hardcoded. Verified via package.json inspection.
- **Suggested test commands:**
  ```bash
  git clone https://github.com/adrianhajdin/figma_clone.git
  cd figma_clone
  npx safe-i18n init --source en --locales tr,de
  npx safe-i18n scan
  npx safe-i18n plan
  ```
- **Risk/complexity:** Medium-high. Uses fabric.js for canvas rendering and Liveblocks for collaboration. Many strings are programmatic (shape types like "rectangle", "circle"; event names; CSS values) and should be classified as SKIP_NON_UI or SKIP_DANGEROUS. This is a challenging target that exercises the risk classifier heavily.

---

## Summary Table

| # | Repository | Framework | Stars | String Density | Risk Complexity | Best For |
|---|---|---|---|---|---|---|
| 1 | Kiranism/next-shadcn-dashboard-starter | Next.js | ~4.6k | High | Medium | Dashboard UI patterns, component depth |
| 2 | mickasmt/next-saas-stripe-starter | Next.js 14 | ~3k | Medium | Medium | SaaS pages, pricing, auth flows |
| 3 | nextjs/saas-starter | Next.js | High | Low | Low | Quick smoke test, full pipeline |
| 4 | cruip/open-react-template | Next.js 15 | ~4.6k | High | Low | Marketing/landing page strings |
| 5 | nobruf/shadcn-landing-page | Next.js | ~1.2k | High | Low | shadcn component wrappers |
| 6 | soumyajit4419/Portfolio | React (CRA) | ~6.1k | Medium | Medium | Non-Next.js React project |
| 7 | adrianhajdin/figma_clone | Next.js 14 | ~1.2k | Medium | High | Programmatic vs UI string classification |

## Testing Workflow

For each target repository:

1. Clone the repository
2. Run `npx safe-i18n scan` to see what strings are detected
3. Review the risk classification -- verify that dangerous patterns are correctly identified
4. Run `npx safe-i18n plan` to generate a migration plan
5. Inspect `.safe-i18n/migration-plan.json` for correctness
6. Run `npx safe-i18n apply --safe-only --dry-run` to preview changes
7. If the apply looks correct, run without `--dry-run`
8. Run `npx safe-i18n translate --to tr,de --provider mock` to test locale generation
9. Run `npx safe-i18n validate` to check locale file consistency
10. Run `npx safe-i18n rollback` to restore the original files

When testing, pay special attention to:

- **False positives:** Non-UI strings incorrectly marked as AUTO_SAFE
- **False negatives:** Real UI strings incorrectly marked as SKIP
- **Component wrappers:** Strings inside shadcn, Radix, or Bootstrap component children
- **Template literals and conditionals:** Complex expressions that contain translatable text
- **Attribute strings:** placeholder, aria-label, alt, title attributes

## Disclaimer

These repositories are listed for testing purposes only. Always respect the license of each repository. Do not submit pull requests with safe-i18n changes to these repositories without the maintainers' consent.
