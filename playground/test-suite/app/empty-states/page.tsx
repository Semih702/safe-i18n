/**
 * TEST: Server Component — Empty States & Logical Expressions
 *
 * Tests patterns found across blog, midday, skateshop, taxonomy, platforms, commerce.
 *
 * EXPECT TRANSLATED:
 * - Empty state text in standard elements (<p>No items found</p>)
 * - Empty state text in custom components (CommandEmpty, EmptyState)
 * - Error boundary fallback text
 * - Logical AND with string: {!items.length && "No items found"} — SCANNER BUG (not caught)
 * - Logical AND with template literal: {count > 0 && `${count} items selected`} — SCANNER BUG
 * - Status text via logical AND: {isActive && "Active"} — SCANNER BUG
 *
 * EXPECT SKIPPED:
 * - throw new Error("...") strings (developer-facing, not user-visible)
 * - Error constructor strings
 * - console.error strings
 */

function CommandEmpty({ children }: {children: React.ReactNode;}) {
  return <p className="py-6 text-center text-sm text-gray-500">{children}</p>;
}

function EmptyState({
  title,
  description



}: {title: string;description: string;}) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>);

}

export default function EmptyStatesPage() {  const items: string[] = [];
  const posts: string[] = [];
  const searchResults: string[] = [];
  const count: number = 0;
  const isActive: boolean = false;
  const isPending: boolean = true;
  const isError: boolean = false;

  // EXPECT SKIPPED: throw new Error — developer-facing messages
  if (typeof window === "undefined" && false) {
    throw new Error("Invalid configuration");
    throw new TypeError("Expected a string value");
    throw new Error("User not found");
  }

  // EXPECT SKIPPED: console calls
  console.error("Component rendered with empty data");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Empty States and Error Patterns</h1>
      <p className="text-gray-600">This page tests empty state, error boundary, and logical expression
        patterns from real-world projects.


      </p>

      {/* Standard empty state text — should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Standard Empty States</h2>

        {items.length === 0 &&
        <div className="text-center py-8">
            <p className="text-gray-500">No items found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters to find what you are looking
              for.


          </p>
          </div>
        }

        {posts.length === 0 &&
        <div className="text-center py-8">
            <h3 className="font-medium">No posts created</h3>
            <p className="text-sm text-gray-500">You do not have any posts yet. Start creating content.

          </p>
          </div>
        }
      </section>

      {/* Custom component empty states — should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Component Empty States</h2>

        <CommandEmpty>No results found.</CommandEmpty>

        <EmptyState
          title="No files uploaded"
          description="Upload some files to see them here" />
        

        <EmptyState
          title="No notifications"
          description="You are all caught up!" />
        
      </section>

      {/* Logical AND with strings — SCANNER BUG: not currently caught */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Logical AND Expressions</h2>
        <p className="text-sm text-gray-400">These use logical AND to conditionally show strings. Scanner should
          catch these but currently does not.


        </p>

        <div className="space-y-2">
          <p className="text-gray-600">
            {!items.length && "No items available"}
          </p>
          <p className="text-gray-600">
            {isPending && "Loading..."}
          </p>
          <p className="text-gray-600">
            {isError && "Something went wrong"}
          </p>
          <p className="text-gray-600">
            {isActive && "Active"}
          </p>
          <p className="text-gray-600">
            {count > 0 && `${count} items selected`}
          </p>
          <p className="text-gray-600">
            {searchResults.length === 0 && "No search results"}
          </p>
        </div>
      </section>

      {/* Error boundary fallback — JSX text should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Error Boundary Fallback</h2>

        <div className="border border-red-200 bg-red-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Something went wrong

          </h3>
          <p className="text-sm text-red-600 mt-2">There was an issue with our application. This could be a temporary
            issue, please try your action again.


          </p>
          <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Try Again

          </button>
        </div>
      </section>

      {/* Not Found page pattern — JSX text should be translated */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Not Found States</h2>

        <div className="text-center py-8">
          <h3 className="text-2xl font-bold">Page Not Found</h3>
          <p className="text-gray-500 mt-2">Sorry, we could not find the page you are looking for.

          </p>
          <p className="text-gray-400 text-sm mt-1">But do not worry, you can find plenty of other things on our
            homepage.


          </p>
          <a href="/" className="mt-4 inline-block text-blue-600 underline">Back to homepage

          </a>
        </div>
      </section>
    </div>);

}