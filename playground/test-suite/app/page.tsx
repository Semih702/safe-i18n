/**
 * TEST: Server Component — Basic Translations
 *
 * EXPECT TRANSLATED: h1, p, link texts, span badge
 * EXPECT SKIPPED: href, className
 */
import Link from "next/link";export default function HomePage() {  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">New

        </span>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Welcome to Our Platform

        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Build something amazing with our tools. Start your journey today and
          discover what's possible.


        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">Get Started


        </Link>
        <Link
          href="/about"
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium">Learn More


        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg">Fast Performance</h3>
          <p className="text-gray-600 mt-2">Lightning-fast load times with optimized builds.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg">Easy to Use</h3>
          <p className="text-gray-600 mt-2">Intuitive interface designed for developers of all levels.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg">Secure by Default</h3>
          <p className="text-gray-600 mt-2">Enterprise-grade security out of the box.</p>
        </div>
      </div>
    </div>);

}