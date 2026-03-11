import Link from 'next/link';

import { MarketingPageTemplate } from '@/components/marketing-page-template';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/about', label: 'About' },
];

export default function CookiePolicyPage() {
  return (
    <MarketingPageTemplate navLinks={navLinks}>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Cookie Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: March 11, 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              1. What Are Cookies?
            </h2>
            <p className="mt-2">
              Cookies are small text files stored on your device by a website.
              They are widely used to make websites work efficiently, remember
              your preferences, and provide information to website operators.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              2. How News Aggregator Uses Storage
            </h2>
            <p className="mt-2">
              News Aggregator is a modern web application that primarily uses
              your browser&apos;s <strong>localStorage</strong> rather than
              traditional cookies for session management. Here is what we store
              and why:
            </p>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-[#333333] dark:text-white">
                      Storage key
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#333333] dark:text-white">
                      Type
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#333333] dark:text-white">
                      Purpose
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#333333] dark:text-white">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">auth_token</td>
                    <td className="px-4 py-3">localStorage</td>
                    <td className="px-4 py-3">
                      Stores your JWT authentication token to keep you logged in
                      across page loads.
                    </td>
                    <td className="px-4 py-3">Until logout or expiry</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">theme</td>
                    <td className="px-4 py-3">localStorage</td>
                    <td className="px-4 py-3">
                      Remembers your light/dark mode preference.
                    </td>
                    <td className="px-4 py-3">Persistent</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              We do <strong>not</strong> use tracking cookies, advertising
              cookies, or third-party analytics cookies. No data stored in
              localStorage is shared with advertising networks.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              3. Third-Party Services
            </h2>
            <p className="mt-2">
              If you choose to sign in using a social provider (Google, Facebook,
              or X), those providers may set their own cookies during the OAuth
              authentication flow. These cookies are governed by each
              provider&apos;s own cookie and privacy policies:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#4A90E2] hover:underline"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/policy.php"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#4A90E2] hover:underline"
                >
                  Facebook Data Policy
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/en/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#4A90E2] hover:underline"
                >
                  X (Twitter) Privacy Policy
                </a>
              </li>
            </ul>
            <p className="mt-2">
              These interactions occur on the provider&apos;s own domains and are
              outside our control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              4. Managing Your Storage
            </h2>
            <p className="mt-2">
              You can clear localStorage data at any time through your
              browser&apos;s developer tools or settings. Note that clearing
              auth-related storage will log you out of the platform.
            </p>
            <p className="mt-2">
              Most browsers also allow you to block or delete cookies. Refer to
              your browser&apos;s help documentation for instructions. Blocking
              certain storage may affect the functionality of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              5. Changes to This Policy
            </h2>
            <p className="mt-2">
              We may update this Cookie Policy as the Service evolves. We will
              update the &quot;Last updated&quot; date at the top of this page when
              changes are made.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              6. Contact
            </h2>
            <p className="mt-2">
              If you have questions about this Cookie Policy, contact us at{' '}
              <span className="text-[#4A90E2]">privacy@newsaggregator.app</span>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 flex gap-4 border-t border-slate-200 pt-8 text-sm dark:border-slate-800">
          <Link href="/privacy" className="text-[#4A90E2] hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-[#4A90E2] hover:underline">
            Terms of Service
          </Link>
        </div>
      </section>
    </MarketingPageTemplate>
  );
}
