import { getTranslations } from "next-intl/server"; /**
 * TEST: Server Component — Form Elements & Translatable Props
 *
 * EXPECT TRANSLATED:
 * - placeholder values (even kebab-case like "your-email")
 * - aria-label values
 * - alt text on images
 * - title attributes
 * - label text
 * - button text
 * - legend text
 * - option text
 *
 * EXPECT SKIPPED:
 * - htmlFor, id, name, type, autoComplete values
 * - input pattern attribute
 */
export default async function FormsPage() {const t = await getTranslations("forms");return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t("contactUs")}</h1>
      <p className="text-gray-600">{t("fillOutTheFormBelowAnd")}

      </p>

      <form className="space-y-6 max-w-lg">
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">{t("personalInformation")}</legend>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t("fullName")}

            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t("placeholder_johnDoe")}
              aria-label={t("aria-label_enterYourFullName")}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
            
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t("emailAddress")}

            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("placeholder_youremailexamplecom")}
              aria-label={t("aria-label_enterYourEmailAddress")}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
            
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{t("phoneNumber")}

            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder={t("placeholder_yourphonenumber")}
              aria-label={t("aria-label_enterYourPhoneNumber")}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
            
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">{t("messageDetails")}</legend>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">{t("subject")}

            </label>
            <select
              id="subject"
              name="subject"
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              aria-label={t("aria-label_selectASubject")}>
              
              <option value="">{t("chooseATopic")}</option>
              <option value="general">{t("generalInquiry")}</option>
              <option value="support">{t("technicalSupport")}</option>
              <option value="billing">{t("billingQuestion")}</option>
              <option value="feedback">{t("feedback")}</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">{t("yourMessage")}

            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder={t("placeholder_tellUsHowWeCanHelp")}
              aria-label={t("aria-label_typeYourMessage")}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
            
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="agree" name="agree" className="h-4 w-4" />
            <label htmlFor="agree" className="text-sm text-gray-600">{t("iAgreeToTheTermsAnd")}

            </label>
          </div>
        </fieldset>

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg">{t("sendMessage")}


          </button>
          <button
            type="reset"
            className="px-6 py-2 border border-gray-300 rounded-lg">{t("clearForm")}


          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">{t("youCanAlsoReachUsAt")}

        </p>
      </div>
    </div>);

}