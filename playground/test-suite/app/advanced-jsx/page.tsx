/**
 * TEST: Server Component — Advanced JSX Patterns
 *
 * Tests patterns found across commerce, blog, midday, skateshop, taxonomy, platforms.
 *
 * EXPECT TRANSLATED:
 * - Template literal without expressions in JSX: {`Welcome to our platform`}
 * - Multi-line JSX text (single continuous text node)
 * - Plural ternary: {count === 1 ? "item" : "items"}
 * - Custom component props: heading="...", text="...", message="...",
 *   content="...", subheading="..."
 * - Ternary display text: {isCopied ? "Copied" : "Copy to clipboard"}
 *
 * EXPECT SKIPPED:
 * - dangerouslySetInnerHTML content
 * - Spread props with text (known limitation — scanner can't see through spread)
 */

function Card({
  heading,
  subheading,
  children




}: {heading: string;subheading?: string;children?: React.ReactNode;}) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">{heading}</h3>
      {subheading && <p className="text-sm text-gray-500">{subheading}</p>}
      {children}
    </div>);

}

function Tooltip({ content, children }: {content: string;children: React.ReactNode;}) {
  return <span title={content}>{children}</span>;
}

function Badge({ text }: {text: string;}) {
  return (
    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
      {text}
    </span>);

}

function Alert({ message }: {message: string;}) {
  return (
    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
      {message}
    </div>);

}

function EmptyPlaceholder({
  title,
  description



}: {title: string;description: string;}) {
  return (
    <div className="text-center py-8">
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>);

}

export default function AdvancedJsxPage() {  const count: number = 5;
  const isCopied = false;
  const isPublished = true;
  const planType: string = "free";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Advanced JSX Patterns</h1>
      <p className="text-gray-600">This page tests template literals, multi-line text, custom component
        props, plural patterns, and other advanced JSX patterns.


      </p>

      {/* Template literal without expressions — should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Template Literals Without Variables</h2>
        <p className="text-gray-600">{`Welcome to our platform`}</p>
        <p className="text-gray-600">{`Don't miss out on this opportunity!`}</p>
        <p className="text-gray-600">
          {`This is a complete sentence in a template literal.`}
        </p>
      </section>

      {/* Multi-line JSX text — should merge into single string */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Multi-line Text</h2>
        <p className="text-gray-600">This is a long paragraph that spans multiple lines in the source code
          and should be treated as a single translatable string by the scanner.


        </p>
        <p className="text-gray-600">Our platform helps you build, deploy, and scale your applications with
          ease. Get started today and see the difference.


        </p>
      </section>

      {/* Plural ternary patterns — should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Plural Patterns</h2>
        <p className="text-gray-600">
          {count} {count === 1 ? "item" : "items"}in your cart
        </p>
        <p className="text-gray-600">
          {count} {count === 1 ? "result found" : "results found"}
        </p>
      </section>

      {/* Ternary display text — should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Ternary Display Text</h2>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 border rounded">
            {isCopied ? "Copied" : "Copy to clipboard"}
          </button>
          <span className="px-2 py-1 text-sm rounded bg-gray-100">
            {isPublished ? "Published" : "Draft"}
          </span>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            {planType === "pro" ? "Manage Subscription" : "Upgrade to Pro"}
          </button>
        </div>
      </section>

      {/* Custom component props — should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Custom Component Props</h2>

        <Card heading="Features" subheading="What we offer">
          <p className="text-gray-600 mt-2">Explore our comprehensive feature set.

          </p>
        </Card>

        <Card heading="Getting Started" subheading="Quick setup guide">
          <p className="text-gray-600 mt-2">Follow these steps to set up your project.

          </p>
        </Card>

        <Tooltip content="Click to copy this value">
          <button className="px-3 py-1 border rounded text-sm">Copy link

          </button>
        </Tooltip>

        <div className="flex gap-2 flex-wrap">
          <Badge text="New" />
          <Badge text="Featured" />
          <Badge text="Popular" />
        </div>

        <Alert message="Your session will expire soon. Please save your work." />

        <EmptyPlaceholder
          title="No notifications"
          description="You are all caught up! Check back later for updates." />
        
      </section>

      {/* dangerouslySetInnerHTML — should be SKIPPED */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Dangerous HTML</h2>
        <div
          dangerouslySetInnerHTML={{
            __html: "<strong>Bold text</strong> with <em>emphasis</em>"
          }} />
        
        <div
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({ "@type": "WebPage", name: "Test" })
          }} />
        
      </section>

      {/* Spread props — KNOWN LIMITATION, scanner can't see through spread */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Spread Props</h2>
        <p className="text-sm text-gray-400">Scanner cannot trace text values through spread operators. This is a
          known limitation.


        </p>
      </section>
    </div>);

}