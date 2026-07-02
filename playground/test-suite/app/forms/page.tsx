/**
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
export default function FormsPage() {  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="text-gray-600">Fill out the form below and we will get back to you shortly.

      </p>

      <form className="space-y-6 max-w-lg">
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Personal Information</legend>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name

            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              aria-label="Enter your full name"
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
            
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address

            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="your-email@example.com"
              aria-label="Enter your email address"
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
            
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number

            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="your-phone-number"
              aria-label="Enter your phone number"
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
            
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Message Details</legend>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject

            </label>
            <select
              id="subject"
              name="subject"
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              aria-label="Select a subject">
              
              <option value="">Choose a topic...</option>
              <option value="general">General Inquiry</option>
              <option value="support">Technical Support</option>
              <option value="billing">Billing Question</option>
              <option value="feedback">Feedback</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Your Message

            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="Tell us how we can help you..."
              aria-label="Type your message"
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
            
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="agree" name="agree" className="h-4 w-4" />
            <label htmlFor="agree" className="text-sm text-gray-600">I agree to the terms and conditions.

            </label>
          </div>
        </fieldset>

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg">Send Message


          </button>
          <button
            type="reset"
            className="px-6 py-2 border border-gray-300 rounded-lg">Clear Form


          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">You can also reach us at support@example.com

        </p>
      </div>
    </div>);

}