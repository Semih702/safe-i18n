/**
 * TEST: Server Component — Edge Cases
 *
 * EXPECT TRANSLATED:
 * - Short words: "or", "and", "to", "by", "at", "on"
 * - Ternary strings (both branches)
 * - Text with special characters: "Don't miss out!", "It's free — forever."
 * - Text with numbers: "Over 100 satisfied customers"
 * - Questions: "Need help?"
 * - Exclamations: "Welcome back!"
 * - Single word in visible element: "Subscribe"
 * - Text after JSX expression: "items in cart"
 *
 * EXPECT SKIPPED:
 * - Template literal with className
 * - URL patterns
 */
const isLoggedIn = false;
const cartCount = 3;
const userPlan: string = "free";

export default function EdgeCasesPage() {  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Edge Cases</h1>

      {/* Short words */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Short Words</h2>
        <p className="text-gray-600">Sign up
          <em>or</em>log in to continue.
        </p>
        <p className="text-gray-600">Terms and conditions apply.

        </p>
      </section>

      {/* Ternary expressions */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Conditional Text</h2>
        <p className="text-gray-600">
          {isLoggedIn ? "Welcome back!" : "Please sign in to continue."}
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          {isLoggedIn ? "Go to Dashboard" : "Sign In"}
        </button>
        <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100">
          {userPlan === "pro" ? "Professional Plan" : "Free Plan"}
        </span>
      </section>

      {/* Special characters */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Special Characters</h2>
        <p className="text-gray-600">Don't miss out on this opportunity!</p>
        <p className="text-gray-600">It's completely free — no credit card required.</p>
        <p className="text-gray-600">Trusted by 10,000+ companies worldwide.</p>
        <p className="text-gray-600">Need help? We're here for you.</p>
      </section>

      {/* Mixed content with JSX */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Mixed Content</h2>
        <p className="text-gray-600">You have
          <strong>{cartCount}</strong>items in your cart.
        </p>
        <p className="text-gray-600">Over
          <span className="font-bold text-blue-600">100</span>satisfied customers.
        </p>
      </section>

      {/* Buttons and labels */}
      <section className="p-6 bg-white rounded-xl shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Subscribe</button>
          <button className="px-4 py-2 bg-green-600 text-white rounded">Download Now</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Cancel</button>
          <button className="px-4 py-2 border border-red-500 text-red-500 rounded">Remove Account

          </button>
        </div>
      </section>
    </div>);

}