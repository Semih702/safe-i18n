"use client"; /**
 * TEST: Component without directive — another "use client" auto-add case
 *
 * EXPECT TRANSLATED: footer text, link texts, copyright notice
 * EXPECT SKIPPED: href values, mailto: link
 */
import Link from "next/link";import { useTranslations } from "next-intl";

export default function Footer() {const t = useTranslations("common");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-3">{t("product")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features" className="hover:text-white">{t("features")}</Link></li>
              <li><Link href="/pricing" className="hover:text-white">{t("pricing")}</Link></li>
              <li><Link href="/changelog" className="hover:text-white">{t("changelog")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">{t("company")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">{t("aboutUs")}</Link></li>
              <li><Link href="/careers" className="hover:text-white">{t("careers")}</Link></li>
              <li><Link href="/blog" className="hover:text-white">{t("blog")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">{t("support")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="hover:text-white">{t("helpCenter")}</Link></li>
              <li><Link href="/docs" className="hover:text-white">{t("documentation")}</Link></li>
              <li><Link href="/contact" className="hover:text-white">{t("contactUs")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-sm text-center">
          <p>{t("allRightsReserved")}</p>
        </div>
      </div>
    </footer>);

}