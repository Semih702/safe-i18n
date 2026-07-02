# safe-i18n Test Suite

Comprehensive test project for validating safe-i18n migration across all known edge cases.

## Test Matrix

### 1. Component Types (`app/page.tsx`, `components/Header.tsx`, `app/dashboard/page.tsx`)

| Case | File | Expected |
|------|------|----------|
| Server component (app/ dir, no directive) | `app/page.tsx` | `getTranslations` from `next-intl/server` |
| Client component ("use client" exists) | `app/dashboard/page.tsx` | `useTranslations` from `next-intl` |
| Component without directive (components/ dir) | `components/Header.tsx` | Auto-add `"use client"` + `useTranslations` |
| Component without directive (components/ dir) | `components/Footer.tsx` | Auto-add `"use client"` + `useTranslations` |

### 2. String Locations (`app/page.tsx`, `app/edge-cases/page.tsx`)

| Case | Example | Expected |
|------|---------|----------|
| JSX text child | `<h1>Welcome</h1>` | `<h1>{t("welcome")}</h1>` |
| JSX attribute (translatable) | `placeholder="Enter email"` | `placeholder={t("placeholder_enterEmail")}` |
| Ternary expression | `{x ? "Yes" : "No"}` | `{x ? t("yes") : t("no")}` |
| Text after JSX expression | `<strong>{n}</strong> items` | Translated |
| Short words | `<em>or</em>` | Translated |

### 3. Translatable Props (`app/forms/page.tsx`, `components/SearchBar.tsx`)

| Prop | Example | Expected |
|------|---------|----------|
| `placeholder` | `placeholder="your-email"` | Translated (even if kebab-case) |
| `aria-label` | `aria-label="Search"` | Translated |
| `alt` | `alt="Logo"` | Translated |
| `title` | `title="Clear search"` | Translated |
| `label` | `label="Name"` | Translated |

### 4. Skip Cases — Props (`app/skip-cases/page.tsx`, `components/Icons.tsx`)

| Prop | Example | Expected |
|------|---------|----------|
| `className` | `className="text-lg"` | SKIP |
| `href` | `href="/about"` | SKIP |
| `src` | `src="/logo.png"` | SKIP |
| `data-testid` | `data-testid="btn"` | SKIP |
| `target` | `target="_blank"` | SKIP |
| `rel` | `rel="noopener noreferrer"` | SKIP |
| `variant` | `variant="outline"` | SKIP |
| `size` | `size="sm"` | SKIP |
| `type` | `type="submit"` | SKIP |
| `role` | `role="tablist"` | SKIP |
| `htmlFor` | `htmlFor="email"` | SKIP |
| `id` / `name` | `id="email"` | SKIP |
| `autoComplete` | `autoComplete="email"` | SKIP |
| SVG attrs | `d="M12..."`, `viewBox`, `fill`, `stroke` | SKIP |
| `aria-hidden` | `aria-hidden="true"` | SKIP |
| `focusable` | `focusable="false"` | SKIP |
| `data-icon` | `data-icon="close"` | SKIP |
| `data-prefix` | `data-prefix="fas"` | SKIP |
| `data-state` | `data-state="open"` | SKIP |

### 5. Skip Cases — Values (`app/skip-cases/page.tsx`)

| Category | Example | Expected |
|----------|---------|----------|
| Console calls | `console.log("msg")` | SKIP |
| Comparison | `status === "active"` | SKIP |
| localStorage | `localStorage.setItem("key", "val")` | SKIP |
| URL/path | `"https://example.com"` | SKIP |
| CSS selector | `".my-class"` | SKIP |
| Hex color | `"#ff0000"` | SKIP |
| camelCase identifier | `"myVariable"` | SKIP |
| CONSTANT_CASE | `"MAX_RETRIES"` | SKIP |
| kebab-case (non-prop) | `"my-component"` | SKIP |
| URL pattern in template | `` `${proto}://${host}` `` | SKIP |
| className template | `` className={`${var} antialiased`} `` | SKIP |
| `throw new Error("...")` | `throw new Error("Invalid config")` | SKIP |

### 6. Exclusions (`app/api/hello/route.ts`)

| Case | Expected |
|------|----------|
| API routes (`app/api/**`) | Completely excluded from scanning |
| `node_modules`, `.next`, `dist` | Excluded |
| Test files (`*.test.*`, `*.spec.*`) | Excluded |

### 7. Infrastructure

| Case | File | Expected |
|------|------|----------|
| `next.config.ts` wrapping | `next.config.ts` | `withNextIntl(nextConfig)` |
| Simple variable export | `export default x` | `export default withNextIntl(x)` |
| Function call export | `export default fn(x)` | `export default withNextIntl(fn(x))` |
| Multiline function export | `module.exports = () => {...}` | `const _nextConfig = () => {...}; module.exports = withNextIntl(_nextConfig)` |
| Root layout update | `app/layout.tsx` | `NextIntlClientProvider`, `getLocale`, `getMessages` |
| `i18n/request.ts` creation | `i18n/request.ts` | Created with locale config |
| next-intl installation | `package.json` | `next-intl` added, npm fallback if yarn/pnpm unavailable |

### 8. SVG Component Integrity (`components/Icons.tsx`)

| Case | Expected |
|------|----------|
| No `"use client"` added | File unchanged if no translatable strings |
| No `useTranslations` import | No i18n imports added |
| SVG attributes preserved | `d`, `viewBox`, `fill`, `stroke` etc. untouched |

### 9. Toast & Dialog Patterns (`app/toasts-dialogs/page.tsx`)

| Case | Example | Expected |
|------|---------|----------|
| DialogTitle text | `<DialogTitle>Are you sure?</DialogTitle>` | Translated |
| DialogDescription text | `<DialogDescription>This action cannot be undone...</DialogDescription>` | Translated |
| AlertDialogTitle text | `<AlertDialogTitle>Delete this post?</AlertDialogTitle>` | Translated |
| AlertDialogDescription text | `<AlertDialogDescription>This will permanently...</AlertDialogDescription>` | Translated |
| AlertTitle text | `<AlertTitle>Heads up!</AlertTitle>` | Translated |
| AlertDescription text | `<AlertDescription>This is a demo...</AlertDescription>` | Translated |
| Button text in dialogs | `<button>Delete permanently</button>` | Translated |
| Ternary in dialog button | `{isDeleting ? "Deleting..." : "Yes, delete it"}` | Translated |

**Sources:** taxonomy (toast+AlertDialog), skateshop (DialogTitle, toast.success/error/promise), midday (AlertDialogTitle, toast), commerce (sonner toast)

### 10. Empty States & Logical Expressions (`app/empty-states/page.tsx`)

| Case | Example | Expected |
|------|---------|----------|
| Empty state paragraph | `<p>No items found</p>` | Translated |
| Empty state heading | `<h3>No posts created</h3>` | Translated |
| Custom empty component text | `<CommandEmpty>No results found.</CommandEmpty>` | Translated |
| Custom component title prop | `title="No files uploaded"` | Translated |
| Custom component description prop | `description="Upload some files..."` | Translated |
| Error fallback heading | `<h3>Something went wrong</h3>` | Translated |
| Error fallback paragraph | `<p>There was an issue...</p>` | Translated |
| Not found heading | `<h3>Page Not Found</h3>` | Translated |
| Not found description | `<p>Sorry, we could not find...</p>` | Translated |
| Logical AND string | `{!items.length && "No items available"}` | Translated (**SCANNER BUG** — not caught) |
| Logical AND pending | `{isPending && "Loading..."}` | Translated (**SCANNER BUG** — not caught) |
| Logical AND error | `{isError && "Something went wrong"}` | Translated (**SCANNER BUG** — not caught) |
| Logical AND status | `{isActive && "Active"}` | Translated (**SCANNER BUG** — not caught) |
| Logical AND template | `{count > 0 && `` `${count} items selected` ``}` | Translated (**SCANNER BUG** — not caught) |
| `throw new Error("...")` | `throw new Error("Invalid configuration")` | SKIP |
| `console.error("...")` | `console.error("Component rendered...")` | SKIP |

**Sources:** blog (3 `&& 'No posts/tags found.'`), midday (status AND patterns), skateshop (empty states), taxonomy (EmptyPlaceholder), commerce (empty cart), platforms (empty subdomain list)

### 11. Advanced JSX Patterns (`app/advanced-jsx/page.tsx`)

| Case | Example | Expected |
|------|---------|----------|
| Template literal (no vars) | `{`` `Welcome to our platform` ``}` | Translated |
| Template literal (no vars, apostrophe) | `{`` `Don't miss out!` ``}` | Translated |
| Multi-line JSX text | `<p>Long paragraph\nspanning lines</p>` | Translated (single string) |
| Plural ternary | `{count === 1 ? "item" : "items"}` | Translated (both branches) |
| Plural ternary (phrases) | `{count === 1 ? "result found" : "results found"}` | Translated |
| Ternary display text | `{isCopied ? "Copied" : "Copy to clipboard"}` | Translated |
| Ternary status | `{isPublished ? "Published" : "Draft"}` | Translated |
| Ternary plan | `{plan === "pro" ? "Manage Subscription" : "Upgrade to Pro"}` | Translated |
| Custom prop: `heading` | `heading="Features"` | Translated |
| Custom prop: `subheading` | `subheading="What we offer"` | Translated |
| Custom prop: `content` | `content="Click to copy this value"` | Translated |
| Custom prop: `text` | `text="New"` | Translated |
| Custom prop: `message` | `message="Your session will expire soon..."` | Translated |
| Custom prop: `title` (on custom comp) | `title="No notifications"` | Translated |
| Custom prop: `description` | `description="You are all caught up!..."` | Translated |
| `dangerouslySetInnerHTML` | `dangerouslySetInnerHTML={{ __html: "..." }}` | SKIP (object expression, not matched) |

**Sources:** blog (template literal separators), commerce (no-var template literals), taxonomy/skateshop (custom component heading/text props), midday (ternary plurals), platforms (ternary display text)

### 12. Post-Migration Commands

| Command | Trigger | Expected |
|---------|---------|----------|
| `safe-i18n sync` | New strings added after migration | Finds untranslated strings, transforms, translates |
| `safe-i18n add-locale --to fr` | Add new language | Translates en.json to fr.json, merges existing |
| `safe-i18n migrate --to tr,fr` (re-run) | All locales exist | "All requested locales already exist" |
| `safe-i18n migrate --to tr,fr,de` (re-run) | de is new | Prompts "Add de? (y/n)", keeps tr/fr |

---

## Known Limitations

Patterns found in real-world projects that the scanner **cannot** handle due to architectural constraints (non-JSX contexts, data flow analysis, etc.). These are documented here but do NOT have test page entries.

### L1. Toast/Notification Call Arguments

**Prevalence:** 5/6 scanned projects (taxonomy, commerce, skateshop, midday, blog)

```tsx
toast.success("Profile updated successfully");
toast.error("Failed to save changes");
toast({ title: "Error", description: "Please try again." });
toast.promise(promise, { loading: "Deleting...", success: "Deleted!" });
```

**Why not caught:** Strings inside function call arguments, not in JSX context. The scanner only visits JSXText, JSXAttribute, and JSXExpressionContainer nodes.

**Potential fix:** Add a CallExpression visitor that checks for known toast/notification function names (toast, notify, sonner) and extracts string arguments. Medium complexity.

### L2. Metadata/SEO Exports

**Prevalence:** 6/6 scanned projects

```tsx
export const metadata: Metadata = {
  title: "My App - Dashboard",
  description: "Manage your projects and settings",
};
```

**Why not caught:** Object literal properties in module-level exports, not in JSX.

**Potential fix:** Add an ObjectProperty visitor for known metadata keys (`title`, `description`, `openGraph.title`). Would need to detect the `metadata` export context to avoid false positives. High complexity.

### L3. Form Validation Messages (Zod/Yup)

**Prevalence:** 2/6 scanned projects with explicit messages (skateshop, taxonomy uses defaults)

```tsx
z.string().email("Please enter a valid email");
z.string().min(8, { message: "Password too short" });
```

**Why not caught:** String arguments inside method chain calls, not in JSX.

**Potential fix:** Add a CallExpression visitor for Zod/Yup method names. Would need careful filtering to avoid catching schema keys vs. messages. Medium complexity.

### L4. Navigation/Route Config Objects

**Prevalence:** 6/6 scanned projects

```tsx
const navItems = [
  { label: "Home", href: "/" },
  { title: "Settings", href: "/settings" },
];
```

**Why not caught:** Object literals in arrays, not in JSX. Scanner cannot determine which object properties contain UI-visible text vs. config keys.

**Potential fix:** Add an ObjectProperty visitor for known label-like keys (`label`, `title`, `name`, `text`, `description`) in array contexts. Risk of false positives is moderate. High complexity.

### L5. Switch/Return Display Strings

**Prevalence:** 3/6 scanned projects (midday, skateshop, commerce)

```tsx
switch (status) {
  case "active": return "Active";
  case "pending": return "Pending Review";
}
// or
return "Error adding item to cart";
```

**Why not caught:** Return statements with string literals, not in JSX context.

**Potential fix:** Would require analyzing return statements in functions that eventually render in JSX. Very high complexity — requires data flow analysis.

### L6. String Arrays for Display

**Prevalence:** 2/6 scanned projects (skateshop, blog)

```tsx
const features = ["Fast Performance", "Easy Setup", "24/7 Support"];
{features.map(f => <li key={f}>{f}</li>)}
```

**Why not caught:** String literals in array expressions cannot be traced to their eventual JSX rendering.

**Potential fix:** Not feasible without full data flow analysis. Would require tracing variables from definition to usage in JSX `.map()` calls.

### L7. Spread Props with Text

**Prevalence:** Rare in scanned projects but common pattern

```tsx
const buttonProps = { children: "Click me", title: "Action" };
<button {...buttonProps} />
```

**Why not caught:** Scanner cannot resolve spread operator to see which properties contain text.

**Potential fix:** Not feasible — requires interprocedural analysis.

### L8. Nested Object Props in Arrays

**Prevalence:** 2/6 scanned projects (skateshop, midday)

```tsx
<Breadcrumb items={[{ label: "Home" }, { label: "Products" }]} />
```

**Why not caught:** String literals inside nested objects within JSX attribute expressions. The JSXAttribute visitor only handles direct StringLiteral values.

**Potential fix:** Would require recursively walking object/array expressions inside JSX attributes. Medium complexity, moderate false positive risk.

### L9. `window.confirm()` / `window.alert()` Calls

**Prevalence:** 0/6 scanned projects (rare in modern React apps)

```tsx
if (window.confirm("Delete this item?")) { ... }
```

**Why not caught:** Same as L1 — function call arguments, not JSX.

**Potential fix:** Same approach as L1 — add confirm/alert to known function names.

### L10. Enum Display Value Maps

**Prevalence:** 3/6 scanned projects (midday, skateshop, commerce)

```tsx
const statusLabels: Record<string, string> = {
  active: "Active",
  pending: "Pending Review",
};
```

**Why not caught:** Object literal values that map internal keys to display text. No way to distinguish from config objects.

**Potential fix:** Heuristic approach — flag objects where all keys are lowercase identifiers and all values are capitalized phrases. High false positive risk.

---

## Scanner Bugs Found

### BUG-1: LogicalExpression string operands not caught

**Severity:** Medium — affects empty state and status display patterns in 3/6 scanned projects.

**Pattern:**
```tsx
{!items.length && "No items found"}
{isPending && "Loading..."}
{isActive && "Active"}
{count > 0 && `${count} items selected`}
```

**Root cause:** The `JSXExpressionContainer` visitor in `scanner.ts` handles `StringLiteral`, `ConditionalExpression`, and `TemplateLiteral` expression types. It does NOT handle `LogicalExpression` where the right operand is a string literal or template literal.

**Fix needed in `src/core/scanner.ts`:** Add a LogicalExpression handler in the JSXExpressionContainer visitor that extracts the right operand when it's a StringLiteral or TemplateLiteral.

**Test cases:** `app/empty-states/page.tsx` — 6 logical AND patterns that will NOT be caught until this bug is fixed.

---

## Running Tests

```bash
# First migration
cd playground/test-suite
safe-i18n migrate --to tr --api-key-env OPENAI_API_KEY
npm run dev

# Verify in browser at http://localhost:3000
# Change locale in i18n/request.ts to "tr" and check translations

# Test sync (add new strings to a page, then run)
safe-i18n sync --api-key-env OPENAI_API_KEY

# Test add-locale
safe-i18n add-locale --to de --api-key-env OPENAI_API_KEY

# Test re-run detection
safe-i18n migrate --to tr,de --api-key-env OPENAI_API_KEY
```

## CI/CD Integration (TODO)

```bash
# 1. Scan and compare against expected counts
safe-i18n scan --json > scan-result.json

# 2. Verify no false positives in skip-cases page
# 3. Verify all strings in about/forms/edge-cases are captured
# 4. Run migrate with mock provider and verify en.json structure
# 5. Verify next.config.ts is valid after modification
# 6. Verify Icons.tsx is unchanged
```

## Research Sources

Patterns were identified by scanning 6 open-source Next.js/React projects:

| Project | GitHub | Key Patterns Found |
|---------|--------|--------------------|
| taxonomy (shadcn) | shadcn-ui/taxonomy | Toast `toast({title, description})`, AlertDialog, EmptyPlaceholder, heading/text props, nav configs |
| commerce (Vercel) | vercel/commerce | Sonner toast, error returns, metadata exports, sorting configs, dangerouslySetInnerHTML, aria-labels |
| platforms (Vercel) | vercel/platforms | Metadata exports, ternary display text, error messages in server actions, empty states |
| skateshop | sadmann7/skateshop | Toast (all variants), DialogTitle/Description, Zod validation, 30+ nav config entries, ternary display, pricing configs |
| starter-blog | timlrx/tailwind-nextjs-starter-blog | Logical AND empty states, siteMetadata config, nav config, template literal separators, theme display values |
| midday | midday-ai/midday | Toast, AlertDialogTitle, extensive plural ternary, status AND patterns, switch/return strings, 25+ metadata exports |
