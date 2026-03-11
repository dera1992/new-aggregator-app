import Link from 'next/link';

import { MarketingPageTemplate } from '@/components/marketing-page-template';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/about', label: 'About' },
];

export default function TermsOfServicePage() {
  return (
    <MarketingPageTemplate navLinks={navLinks}>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: March 11, 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By accessing or using News Aggregator (the &quot;Service&quot;), you agree
              to be bound by these Terms of Service. If you do not agree, do not
              use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              2. Description of the Service
            </h2>
            <p className="mt-2">
              News Aggregator is an AI-powered news intelligence platform that
              collects and clusters publicly available news articles from RSS
              feeds, generates AI summaries and story perspectives, and provides
              content creation tools (viral post generation, analysis, comment
              generation, and jokes) for creators, journalists, and analysts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              3. Account Registration
            </h2>
            <p className="mt-2">
              You must create an account to access most features. You may
              register with an email address and password or via OAuth (Google,
              Facebook, or X). You are responsible for maintaining the security
              of your account credentials and for all activity that occurs under
              your account.
            </p>
            <p className="mt-2">
              You must provide accurate, current, and complete information during
              registration. We reserve the right to suspend or terminate accounts
              that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              4. Acceptable Use
            </h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable laws or regulations.
              </li>
              <li>
                Attempt to circumvent rate limits, authentication, or other
                security mechanisms.
              </li>
              <li>
                Scrape, copy, or redistribute the Service&apos;s AI-generated
                content at scale without permission.
              </li>
              <li>
                Submit URLs or content designed to extract confidential
                information or manipulate AI outputs.
              </li>
              <li>
                Impersonate any person or entity or misrepresent your affiliation
                with any person or entity.
              </li>
              <li>
                Use the Service to generate content that is defamatory, harassing,
                hateful, or otherwise harmful.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              5. AI-Generated Content Disclaimer
            </h2>
            <p className="mt-2">
              The Service uses OpenAI&apos;s language models to generate summaries,
              analyses, viral posts, comments, and jokes. AI-generated content:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                May contain inaccuracies, errors, or outdated information. It
                should not be relied upon as a sole source of factual reporting.
              </li>
              <li>
                Does not represent the editorial opinions of News Aggregator.
              </li>
              <li>
                Is provided for informational and creative purposes only. You are
                responsible for verifying any content before publishing it.
              </li>
            </ul>
            <p className="mt-2">
              You retain responsibility for any content you publish using the
              Service&apos;s tools.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              6. Subscription Plans and Billing
            </h2>
            <p className="mt-2">
              News Aggregator offers a free Starter plan and paid Pro and
              Business plans. Paid plans are billed monthly. By subscribing to a
              paid plan, you authorise us to charge your payment method on a
              recurring basis.
            </p>
            <p className="mt-2">
              You may cancel your subscription at any time. Cancellation takes
              effect at the end of the current billing period. We do not provide
              refunds for partial billing periods unless required by applicable
              law.
            </p>
            <p className="mt-2">
              We reserve the right to change pricing with reasonable prior notice.
              Continued use of the Service after a price change constitutes
              acceptance of the new pricing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              7. Intellectual Property
            </h2>
            <p className="mt-2">
              The News Aggregator platform, including its design, software, and
              original content, is owned by News Aggregator and protected by
              applicable intellectual property laws. News articles aggregated by
              the Service remain the property of their respective publishers.
            </p>
            <p className="mt-2">
              AI-generated outputs produced using your inputs are yours to use,
              subject to OpenAI&apos;s usage policies and these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              8. Third-Party Links and Content
            </h2>
            <p className="mt-2">
              The Service links to third-party news articles and sources. We are
              not responsible for the content, accuracy, or practices of
              third-party websites. Links do not imply endorsement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              9. Limitation of Liability
            </h2>
            <p className="mt-2">
              To the maximum extent permitted by law, News Aggregator shall not
              be liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of or inability to use the
              Service — including but not limited to damages for loss of data,
              profits, or goodwill.
            </p>
            <p className="mt-2">
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, either express or implied.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              10. Termination
            </h2>
            <p className="mt-2">
              We may suspend or terminate your access to the Service at any time
              for violation of these Terms or for any other reason at our
              discretion. Upon termination, your right to use the Service ceases
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              11. Changes to These Terms
            </h2>
            <p className="mt-2">
              We may update these Terms from time to time. We will update the
              &quot;Last updated&quot; date at the top of this page. Your continued use of
              the Service after changes constitutes acceptance of the updated
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              12. Contact
            </h2>
            <p className="mt-2">
              For questions about these Terms, contact us at{' '}
              <span className="text-[#4A90E2]">legal@newsaggregator.app</span>.
            </p>
          </section>
        </div>

        <div className="mt-10 flex gap-4 border-t border-slate-200 pt-8 text-sm dark:border-slate-800">
          <Link href="/privacy" className="text-[#4A90E2] hover:underline">
            Privacy Policy
          </Link>
          <Link href="/cookies" className="text-[#4A90E2] hover:underline">
            Cookie Policy
          </Link>
        </div>
      </section>
    </MarketingPageTemplate>
  );
}
