"use client"; /**
 * TEST: Component without directive — should get "use client" auto-added
 *
 * EXPECT: "use client" directive added at top
 * EXPECT: useTranslations hook added
 * EXPECT TRANSLATED: nav link texts, logo text, button text
 * EXPECT SKIPPED: href values, className
 */
import Link from "next/link";import { useTranslations } from "next-intl";

export default function Header() {const t = useTranslations("common");
  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          TestApp
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/about" className="text-gray-600 hover:text-gray-900">{t("about")}

          </Link>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">{t("dashboard")}

          </Link>
          <Link href="/forms" className="text-gray-600 hover:text-gray-900">{t("contact")}

          </Link>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">{t("signIn")}

          </button>
        </div>
      </nav>
    </header>);

}