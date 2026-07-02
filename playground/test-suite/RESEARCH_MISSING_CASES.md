# Research: Missing i18n Test Cases from Real-World Projects

## Goal

Scan popular open-source React/Next.js frontend projects to find i18n string patterns that our test suite (`playground/test-suite/`) does NOT currently cover. Add the missing cases to the test suite.

## How to Execute

### Step 1: Understand Current Coverage

Read these files first to understand what's already handled:

- `playground/test-suite/TEST_CASES.md` — full test matrix
- `src/core/scanner.ts` — scanner logic (SKIP_PROP_NAMES, TRANSLATABLE_PROPS, isLikelyNonText, SKIP_CALL_NAMES, template literal handling)
- `src/core/risk-classifier.ts` — risk classification (SAFE_PROPS, identifier/URL heuristics)
- `src/codemod/transforms.ts` — transform visitors (JSXText, JSXAttribute, StringLiteral, JSXExpressionContainer)

**Currently handled string locations:**
- JSX text children (`<h1>Hello</h1>`)
- JSX attribute values in TRANSLATABLE_PROPS (`placeholder`, `aria-label`, `title`, `alt`, `label`)
- Ternary expression branches (`{x ? "Yes" : "No"}`)
- Template literal text in JSX (`{`Hello ${name}`}`)
- Mixed JSX content (`<p>You have <strong>{n}</strong> items</p>`)

**Currently handled skip patterns:**
- SKIP_PROP_NAMES: className, href, src, data-testid, role, type, name, SVG attrs, aria-hidden, variant, size, target, rel, etc. (~80 props)
- SKIP_CALL_NAMES: console.*, localStorage, fetch, analytics (gtag, mixpanel, etc.)
- isLikelyNonText: camelCase, CONSTANT_CASE, kebab-case, URLs, hex colors, SVG paths, CSS selectors, file paths, CSS utilities
- Template literals in className attribute
- API routes (app/api/**)

### Step 2: Clone & Scan Real Projects

Clone 5-8 popular open-source Next.js/React projects and scan them. Focus on projects that are:
- UI-heavy (dashboards, landing pages, e-commerce, blogs)
- Not already internationalized (raw English strings in JSX)
- Using modern React patterns (hooks, server components)

**Suggested projects to scan** (pick from these or find alternatives — choose ones WITHOUT existing i18n):

```bash
# Large dashboard / admin panels
git clone --depth 1 https://github.com/shadcn-ui/taxonomy.git /tmp/scan-taxonomy
git clone --depth 1 https://github.com/steven-tey/dub.git /tmp/scan-dub
git clone --depth 1 https://github.com/calcom/cal.com.git /tmp/scan-calcom

# E-commerce / landing pages
git clone --depth 1 https://github.com/vercel/commerce.git /tmp/scan-commerce
git clone --depth 1 https://github.com/sadmann7/skateshop.git /tmp/scan-skateshop

# Blog / content sites
git clone --depth 1 https://github.com/timlrx/tailwind-nextjs-starter-blog.git /tmp/scan-blog

# Component-heavy apps
git clone --depth 1 https://github.com/vercel/platforms.git /tmp/scan-platforms
git clone --depth 1 https://github.com/midday-ai/midday.git /tmp/scan-midday
```

For each project, use grep/search to find string patterns:

```bash
# Find JSX text patterns
rg '<\w+[^>]*>[A-Z][a-z]' --type tsx -l

# Find string props
rg '(placeholder|title|alt|aria-label)="[A-Z]' --type tsx

# Find toast/notification calls
rg 'toast\(|notify\(|showNotification|addToast' --type tsx

# Find error messages
rg 'throw new Error\("|message:.*"[A-Z]' --type tsx

# Find confirm/alert/prompt dialogs
rg 'confirm\("|alert\("|window\.confirm|window\.alert' --type tsx

# Find meta/SEO strings
rg 'title:|description:|openGraph|meta' --type tsx

# Find enum-like display text in objects/arrays
rg '\{ label: "[A-Z]' --type tsx
rg '\{ title: "[A-Z]' --type tsx
rg '\{ name: "[A-Z]' --type tsx
rg '\{ text: "[A-Z]' --type tsx

# Find validation error messages
rg '\.required\("|\.min\(.*"|\.email\(' --type tsx

# Find string concatenation
rg '"[A-Z][a-z].*" \+|`\$\{.*\} [a-z]' --type tsx
```

### Step 3: Categorize Findings

For each pattern found, classify it:

| Category | Question to Answer |
|----------|--------------------|
| **NEW — Should Translate** | String IS user-visible, NOT in test suite, and scanner SHOULD catch it |
| **NEW — Should Skip** | String is NOT user-visible, NOT in test suite skip-cases, and scanner should NOT catch it |
| **FALSE POSITIVE** | Scanner catches it but SHOULD NOT (needs new skip rule) |
| **FALSE NEGATIVE** | Scanner misses it but SHOULD catch it (needs new visitor/handler) |
| **KNOWN LIMITATION** | Out of scope for AST transforms (e.g., object configs) — document only |

### Step 4: Specific Patterns to Investigate

These are patterns we suspect exist in the wild but haven't tested:

#### A. Toast / Notification Messages
```tsx
toast.success("Profile updated successfully");
toast.error("Failed to save changes");
notify({ title: "Warning", message: "Your session will expire soon" });
```
**Question:** Does the scanner catch strings inside toast/notify calls? These are user-visible.

#### B. Dialog / Modal Content
```tsx
<Dialog>
  <DialogTitle>Are you sure?</DialogTitle>
  <DialogDescription>This action cannot be undone.</DialogDescription>
</Dialog>

// Or via confirm()
if (window.confirm("Delete this item?")) { ... }
```
**Question:** DialogTitle/DialogDescription JSX text should work. What about `confirm()` string args?

#### C. Error / Empty State Messages
```tsx
<ErrorBoundary fallback={<p>Something went wrong</p>}>
  {children}
</ErrorBoundary>

{items.length === 0 && <p>No items found</p>}

throw new Error("Invalid configuration");
```
**Question:** JSX fallback text should work. Should `throw new Error("...")` strings be skipped?

#### D. Metadata / SEO
```tsx
export const metadata: Metadata = {
  title: "My App - Dashboard",
  description: "Manage your projects and settings",
  openGraph: {
    title: "My App",
  },
};
```
**Question:** These are in an object export, not in JSX. Scanner doesn't catch them — should it?

#### E. Form Validation Messages (Zod / Yup)
```tsx
const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, { message: "Password too short" }),
});
```
**Question:** User-visible validation messages inside schema definitions. Scanner doesn't catch these — are they common enough to handle?

#### F. Navigation / Route Config Objects
```tsx
const navItems = [
  { label: "Home", href: "/" },
  { label: "Settings", href: "/settings" },
  { label: "Help", href: "/help" },
];

// Or tabs
const tabs = [
  { id: "overview", title: "Overview" },
  { id: "analytics", title: "Analytics" },
];
```
**Question:** Object literals with `label`/`title`/`name` keys containing UI text. This is a known limitation — how common is it?

#### G. Conditional Rendering with Logical AND
```tsx
{isError && "Something went wrong"}
{isPending && "Loading..."}
{count > 0 && `${count} items selected`}
```
**Question:** `LogicalExpression` with string right operand. Does the scanner catch this?

#### H. String Arrays for Lists
```tsx
const features = ["Fast Performance", "Easy Setup", "24/7 Support"];
// rendered later:
{features.map(f => <li key={f}>{f}</li>)}
```
**Question:** Scanner can't trace data flow from array to JSX render. Known limitation — how common?

#### I. Component Prop Strings (Non-Standard)
```tsx
<Tooltip content="Click to copy" />
<Badge text="New" />
<Alert message="Operation successful" />
<Card heading="Features" subheading="What we offer" />
<Chip label="Active" />
```
**Question:** Custom component props like `content`, `text`, `message`, `heading`, `subheading`. Should TRANSLATABLE_PROPS include these? Or is this too risky (false positives)?

#### J. Enum Display Values / Status Maps
```tsx
const statusLabels: Record<string, string> = {
  active: "Active",
  pending: "Pending Review",
  rejected: "Rejected",
};

// Or switch
switch (status) {
  case "active": return "Active";
  case "pending": return "Pending";
}
```
**Question:** String values returned from switch/map. Scanner should catch `return "Active"` in switch but not `case "active"`.

#### K. String in Template Literal (No Variables)
```tsx
<p>{`Welcome to our platform`}</p>
<p>{`Don't miss out!`}</p>
```
**Question:** Template literal without expressions, used as JSX expression. Does the scanner catch these?

#### L. Multi-line JSX Text
```tsx
<p>
  This is a long paragraph that spans
  multiple lines in the source code
  and should be treated as a single string.
</p>
```
**Question:** Does the scanner correctly merge multi-line JSX text nodes?

#### M. Dangerously Set Inner HTML
```tsx
<div dangerouslySetInnerHTML={{ __html: "<strong>Bold text</strong>" }} />
```
**Question:** Should be skipped — HTML strings inside dangerouslySetInnerHTML are complex.

#### N. Spread Props with Text
```tsx
const buttonProps = { children: "Click me", title: "Action button" };
<button {...buttonProps} />
```
**Question:** Scanner can't see through spread. Known limitation — document it.

#### O. i18n-adjacent: Plurals / Date Formatting Hints
```tsx
<p>{count} {count === 1 ? "item" : "items"}</p>
<p>Last updated {new Date().toLocaleDateString()}</p>
```
**Question:** Plural patterns and date text. ICU handles these post-migration, but does the scanner catch the conditional strings?

#### P. Dynamic Keys as Props
```tsx
<Tab key="settings" label="Settings" />
<Step title="Confirm Order" />
<Breadcrumb items={[{ label: "Home" }, { label: "Products" }]} />
```
**Question:** Custom component props — `label` is in TRANSLATABLE_PROPS but `items` with nested label isn't reachable.

### Step 5: Add Missing Cases to Test Suite

For each category confirmed as missing:

1. **If it's a new "should translate" case:**
   - Add it to the appropriate existing page, OR create a new page file if the category is big enough
   - Add JSDoc comments with `EXPECT TRANSLATED` / `EXPECT SKIPPED`
   - Add the case to `TEST_CASES.md`

2. **If it's a new "should skip" case:**
   - Add it to `app/skip-cases/page.tsx` or a new skip-specific page
   - Add JSDoc comments with `EXPECT SKIPPED`

3. **If it's a known limitation:**
   - Add it to `TEST_CASES.md` under a new "Known Limitations" section
   - Do NOT add it to test pages (we can't test what we can't handle)

4. **If it requires a scanner fix:**
   - Note the fix needed in `TEST_CASES.md`
   - Add the test case to the suite anyway (it will fail until fixed — that's the point)

### Step 6: Verify

After adding all new cases:

```bash
cd D:\safe-i18n
npm run build

cd playground/test-suite
node ../../dist/cli/index.js scan --json > scan-result.json

# Check counts per file match expectations
# Run migrate with mock provider
node ../../dist/cli/index.js migrate --to tr --provider mock

# Build should pass
npx next build
```

## Output Checklist

When done, you should have:

- [x] Scanned at least 5 real projects (6 scanned: taxonomy, commerce, platforms, skateshop, starter-blog, midday)
- [x] Categorized all found patterns (A–P all investigated; see TEST_CASES.md sections 9–11 + Known Limitations)
- [x] Added new test pages/cases to `playground/test-suite/` (3 pages: toasts-dialogs, empty-states, advanced-jsx)
- [x] Updated `TEST_CASES.md` with all new cases (sections 9, 10, 11 + Research Sources table)
- [x] Added "Known Limitations" section to `TEST_CASES.md` (L1–L10)
- [x] Verified scan + build still passes (88 candidates, `next build` clean)
- [x] Listed any scanner/transform bugs found (BUG-1: LogicalExpression not caught in JSXExpressionContainer)

## File Structure Reference

```
playground/test-suite/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Basic translations (server)
│   ├── about/page.tsx          # All HTML elements (server)
│   ├── dashboard/page.tsx      # Interactive UI (client)
│   ├── forms/page.tsx          # Form elements & translatable props (server)
│   ├── edge-cases/page.tsx     # Short words, ternary, special chars (server)
│   ├── skip-cases/page.tsx     # Everything should be skipped (server)
│   ├── api/hello/route.ts      # API route (excluded)
│   ├── toasts-dialogs/page.tsx # Dialog/modal text, toast known limitations (client)
│   ├── empty-states/page.tsx   # Empty states, logical AND scanner bug (server)
│   ├── advanced-jsx/page.tsx   # Template literals, plurals, custom props (server)
│   └── ...
├── components/
│   ├── Header.tsx              # Auto "use client" test
│   ├── Footer.tsx              # Auto "use client" test
│   ├── Icons.tsx               # SVG only — should be untouched
│   ├── SearchBar.tsx           # Translatable props (client)
│   └── ...
├── TEST_CASES.md               # Test matrix (update this)
└── RESEARCH_MISSING_CASES.md   # This file
```
