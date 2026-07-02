/**
 * TEST: Server Component — Various HTML Elements
 *
 * EXPECT TRANSLATED: all visible text (h1-h4, p, span, li, blockquote, figcaption, dt, dd, caption, th, td)
 * EXPECT SKIPPED: nothing — all are user-visible text
 */
export default function AboutPage() {  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">About Us</h1>
      <p className="text-gray-600">We are a team of passionate developers building tools that make
        internationalization easy and safe.


      </p>

      <h2 className="text-2xl font-semibold">Our Mission</h2>
      <p className="text-gray-600">To simplify internationalization and make every app accessible to users
        around the world.


      </p>

      <h3 className="text-xl font-semibold">Our Values</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li className="text-gray-700">Transparency in everything we do</li>
        <li className="text-gray-700">Quality over quantity</li>
        <li className="text-gray-700">Community-driven development</li>
        <li className="text-gray-700">Accessibility as a core principle</li>
      </ul>

      <h4 className="text-lg font-semibold">What Our Users Say</h4>
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600">This tool saved us weeks of manual work during our i18n migration.

      </blockquote>
      <figcaption className="text-sm text-gray-500">— Jane Smith, Engineering Lead at TechCorp

      </figcaption>

      <h3 className="text-xl font-semibold">Key Features</h3>
      <dl className="space-y-4">
        <dt className="font-semibold text-gray-800">Automatic Detection</dt>
        <dd className="text-gray-600 ml-4">Scans your codebase and finds all translatable strings automatically.

        </dd>
        <dt className="font-semibold text-gray-800">Safe Transforms</dt>
        <dd className="text-gray-600 ml-4">Risk classification ensures your code stays safe during migration.

        </dd>
      </dl>

      <h3 className="text-xl font-semibold">Statistics</h3>
      <table className="w-full border-collapse">
        <caption className="text-sm text-gray-500 mb-2">Platform usage statistics for the last quarter

        </caption>
        <thead>
          <tr>
            <th className="border p-2 text-left">Metric</th>
            <th className="border p-2 text-left">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">Active Users</td>
            <td className="border p-2">12,500</td>
          </tr>
          <tr>
            <td className="border p-2">Projects Migrated</td>
            <td className="border p-2">3,200</td>
          </tr>
          <tr>
            <td className="border p-2">Languages Supported</td>
            <td className="border p-2">45</td>
          </tr>
        </tbody>
      </table>
    </div>);

}