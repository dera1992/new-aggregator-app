import Link from 'next/link';

import { MarketingPageTemplate } from '@/components/marketing-page-template';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/about', label: 'About' },
];

export default function PrivacyPolicyPage() {
  return (
    <MarketingPageTemplate navLinks={navLinks}>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: March 11, 2026
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              1. Introduction
            </h2>
            <p className="mt-2">
              News Aggregator (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your
              personal information. This Privacy Policy explains how we collect,
              use, store, and share information when you use our platform — a
              real-time AI-powered news aggregation and content creation service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              2. Information We Collect
            </h2>
            <p className="mt-2">
              We collect the following categories of information:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Account information:</strong> Email address and hashed
                password when you register with email/password. If you sign in
                via Google, Facebook, or X (Twitter), we receive your email
                address and OAuth provider ID from that service.
              </li>
              <li>
                <strong>Profile information:</strong> Full name, timezone, and
                avatar URL, which you may optionally provide in your profile
                settings.
              </li>
              <li>
                <strong>Preferences:</strong> Your preferred news categories
                (e.g. Tech, Business, Politics) and preferred news sources,
                which you set to personalise your feed.
              </li>
              <li>
                <strong>Reading activity:</strong> Articles you save or mark as
                read within the platform, used to personalise your experience.
              </li>
              <li>
                <strong>Usage data:</strong> Standard server logs including IP
                address, browser type, and pages visited, collected automatically
                when you use the service.
              </li>
              <li>
                <strong>Content you submit:</strong> URLs (article links,
                YouTube URLs) you provide in the Compose tool for AI-assisted
                content generation.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              3. How We Use Your Information
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>To create and manage your account and authenticate you securely.</li>
              <li>
                To personalise your news feed based on your preferred categories
                and sources.
              </li>
              <li>
                To deliver email digests at your chosen schedule if you enable
                digest notifications.
              </li>
              <li>
                To generate AI-powered summaries, viral posts, analyses, jokes,
                and comments using content you or the platform supplies.
              </li>
              <li>To maintain and improve the reliability and quality of the service.</li>
              <li>To detect abuse, enforce rate limits, and ensure platform security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              4. AI and Third-Party Services
            </h2>
            <p className="mt-2">
              News Aggregator uses OpenAI&apos;s API to generate summaries,
              analyses, viral posts, comments, and jokes. When you trigger AI
              generation, relevant article content or your submitted URL text is
              sent to OpenAI&apos;s servers for processing. Please review{' '}
              <a
                href="https://openai.com/policies/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="text-[#4A90E2] hover:underline"
              >
                OpenAI&apos;s Privacy Policy
              </a>{' '}
              for details on how they handle data.
            </p>
            <p className="mt-2">
              We aggregate news from publicly available RSS feeds and news
              sources. We do not share your personal data with these sources.
            </p>
            <p className="mt-2">
              If you authenticate via Google, Facebook, or X, those providers
              share limited profile data with us (email and provider ID) per
              their own OAuth consent screens. We do not receive or store your
              social media passwords.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              5. Data Storage and Security
            </h2>
            <p className="mt-2">
              Your data is stored in a PostgreSQL database. Passwords are hashed
              using bcrypt and are never stored in plain text. Authentication
              tokens (JWTs) are stored in your browser&apos;s localStorage and
              expire after a set period.
            </p>
            <p className="mt-2">
              We implement rate limiting on authentication endpoints and CSRF
              protections on state-changing operations. While we take reasonable
              security precautions, no system is completely secure, and we cannot
              guarantee the absolute security of your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              6. Data Retention
            </h2>
            <p className="mt-2">
              We retain your account data for as long as your account is active.
              AI-generated output is cached for up to 12 hours to reduce
              duplicate API calls. News articles and cluster data are retained
              for platform operation and are periodically pruned. You may request
              deletion of your account and associated data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              7. Your Rights
            </h2>
            <p className="mt-2">
              Depending on your location, you may have the right to access,
              correct, or delete your personal data. To exercise any of these
              rights, please contact us using the information below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              8. Children&apos;s Privacy
            </h2>
            <p className="mt-2">
              News Aggregator is not directed to children under 13. We do not
              knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              9. Changes to This Policy
            </h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. When we do,
              we will update the &quot;Last updated&quot; date at the top of this page. We
              encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#333333] dark:text-white">
              10. Contact
            </h2>
            <p className="mt-2">
              If you have questions about this Privacy Policy, please contact us
              at{' '}
              <span className="text-[#4A90E2]">privacy@newsaggregator.app</span>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 flex gap-4 border-t border-slate-200 pt-8 text-sm dark:border-slate-800">
          <Link href="/terms" className="text-[#4A90E2] hover:underline">
            Terms of Service
          </Link>
          <Link href="/cookies" className="text-[#4A90E2] hover:underline">
            Cookie Policy
          </Link>
        </div>
      </section>
    </MarketingPageTemplate>
  );
}
