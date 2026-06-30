import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | Edikit",
  description: "Terms and Conditions for using the Edikit platform.",
};

export default function TermsPage() {
  return (
    <div className="bg-background text-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 border-b border-border pb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Terms &amp; Conditions of{" "}
            <span className="text-primary italic">Edikit</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Please read these Terms carefully before using Edikit. By creating
            an account or using the service you agree to be bound by them.
          </p>
          <p className="mt-4 text-sm font-medium bg-secondary w-fit px-3 py-1 rounded-full text-secondary-foreground">
            Last updated: June 30, 2026
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar TOC */}
          <aside className="lg:w-1/4 hidden lg:block">
            <nav className="sticky top-24">
              <h2 className="text-lg font-bold mb-6 uppercase tracking-wider text-primary">
                Table of contents
              </h2>
              <ul className="space-y-4 text-sm">
                {[
                  ["#acceptance", "Acceptance of Terms"],
                  ["#service", "Description of Service"],
                  ["#accounts", "Account Registration"],
                  ["#payments", "Payments & Subscriptions"],
                  ["#content", "Content & Intellectual Property"],
                  ["#acceptable-use", "Acceptable Use"],
                  ["#disclaimers", "Disclaimers"],
                  ["#liability", "Limitation of Liability"],
                  ["#termination", "Termination"],
                  ["#governing-law", "Governing Law"],
                  ["#changes", "Changes to These Terms"],
                  ["#contact", "Contact"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <main className="lg:w-3/4 space-y-16">
            {/* 1 */}
            <section id="acceptance" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using Edikit ("Service", "Platform") you confirm
                that you are at least 18 years old, that you have read and
                understood these Terms, and that you agree to be bound by them.
                If you are using the Service on behalf of a company or other
                legal entity, you represent that you have the authority to bind
                that entity to these Terms. If you do not agree to these Terms,
                do not use the Service.
              </p>
            </section>

            {/* 2 */}
            <section id="service" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                2. Description of Service
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Edikit is an online platform that allows users to create
                professional motion-graphics videos by customising pre-built
                templates and by using AI-assisted generation tools. Rendered
                videos are produced on our infrastructure and made available for
                download.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any part
                of the Service at any time with or without notice. We will not
                be liable to you or any third party for any such modification,
                suspension, or discontinuation.
              </p>
            </section>

            {/* 3 */}
            <section id="accounts" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                3. Account Registration
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To access most features you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide accurate and complete registration information.</li>
                <li>Keep your password confidential and not share it with others.</li>
                <li>Notify us immediately of any unauthorised use of your account.</li>
                <li>
                  Be responsible for all activities that occur under your account.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We reserve the right to suspend or terminate accounts that
                violate these Terms or that we reasonably believe have been
                compromised.
              </p>
            </section>

            {/* 4 */}
            <section id="payments" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                4. Payments &amp; Subscriptions
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Certain features require the purchase of credits or a paid
                  subscription plan. All payments are processed securely by
                  Stripe, Inc. By providing payment information you authorise us
                  to charge the applicable fees.
                </p>
                <p>
                  <strong className="text-foreground">Subscriptions</strong>{" "}
                  renew automatically at the end of each billing period unless
                  cancelled before the renewal date. You can manage or cancel
                  your subscription at any time from your account settings.
                </p>
                <p>
                  <strong className="text-foreground">Credits</strong> are
                  non-refundable and have no cash value. Unused credits do not
                  carry over beyond their stated expiry unless otherwise
                  specified.
                </p>
                <p>
                  <strong className="text-foreground">Refunds</strong> are
                  issued at our sole discretion. If you believe you are entitled
                  to a refund, contact us at{" "}
                  <a
                    href="mailto:Info@edikit.net"
                    className="text-primary hover:underline"
                  >
                    Info@edikit.net
                  </a>{" "}
                  within 14 days of the charge.
                </p>
                <p>
                  Prices are exclusive of applicable taxes. We reserve the right
                  to change prices at any time; any price changes will be
                  communicated with at least 14 days' notice.
                </p>
              </div>
            </section>

            {/* 5 */}
            <section id="content" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                5. Content &amp; Intellectual Property
              </h2>
              <div className="space-y-6">
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="text-lg font-bold mb-2">Your content</h3>
                  <p className="text-muted-foreground">
                    You retain ownership of any images, logos, or text you
                    upload to the Service ("User Content"). By uploading User
                    Content you grant Edikit a limited, worldwide, royalty-free
                    licence to process and store it solely for the purpose of
                    providing the Service to you. We do not use your content to
                    train AI models or share it with third parties except as
                    required to render your videos (e.g. our AWS Lambda
                    workers).
                  </p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="text-lg font-bold mb-2">Our content</h3>
                  <p className="text-muted-foreground">
                    All templates, software, branding, and platform design are
                    the intellectual property of Edikit or its licensors and are
                    protected by applicable intellectual property laws. You may
                    not copy, modify, distribute, or create derivative works of
                    any platform content without our prior written permission.
                  </p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="text-lg font-bold mb-2">Rendered videos</h3>
                  <p className="text-muted-foreground">
                    Videos you generate using your own content and our templates
                    are yours to use for personal and commercial purposes,
                    subject to any third-party licences embedded in the
                    templates (e.g. audio tracks sourced via Freesound). You
                    are responsible for ensuring your use of rendered videos
                    complies with applicable laws and third-party licences.
                  </p>
                </div>
              </div>
            </section>

            {/* 6 */}
            <section id="acceptable-use" className="scroll-mt-24 bg-secondary/30 p-8 rounded-2xl border border-border">
              <h2 className="text-3xl font-bold mb-6 pb-2">
                6. Acceptable Use
              </h2>
              <p className="text-muted-foreground mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                {[
                  "Violate any applicable law or regulation.",
                  "Infringe the intellectual property rights of others.",
                  "Upload content that is unlawful, harmful, defamatory, or obscene.",
                  "Attempt to gain unauthorised access to our systems.",
                  "Reverse-engineer, decompile, or disassemble any part of the platform.",
                  "Use automated tools to scrape or bulk-download content.",
                  "Resell or sublicense access to the Service without our consent.",
                  "Impersonate any person or entity.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 bg-card p-3 rounded-lg border border-border">
                    <span className="text-destructive font-bold mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* 7 */}
            <section id="disclaimers" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                7. Disclaimers
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided on an "as is" and "as available" basis
                without warranties of any kind, either express or implied,
                including but not limited to warranties of merchantability,
                fitness for a particular purpose, and non-infringement. We do
                not warrant that the Service will be uninterrupted, error-free,
                or free of viruses or other harmful components. AI-generated
                content may contain inaccuracies and you are solely responsible
                for reviewing it before use.
              </p>
            </section>

            {/* 8 */}
            <section id="liability" className="scroll-mt-24 bg-card p-8 rounded-2xl border border-primary/20">
              <h2 className="text-3xl font-bold mb-6 pb-2 text-primary">
                8. Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To the fullest extent permitted by law, Edikit and its
                affiliates, directors, employees, and agents shall not be liable
                for any indirect, incidental, special, consequential, or
                punitive damages arising from your use of or inability to use
                the Service.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our total liability to you for any claim arising out of or
                relating to these Terms or the Service shall not exceed the
                greater of (a) the amount you paid us in the 12 months
                preceding the event giving rise to the claim or (b) €100.
              </p>
            </section>

            {/* 9 */}
            <section id="termination" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                9. Termination
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You may delete your account at any time from your account
                settings. Upon deletion we will remove your personal data in
                accordance with our{" "}
                <Link
                  href="https://www.iubenda.com/privacy-policy/82026734"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or terminate your access to the Service
                immediately, without prior notice, if you breach these Terms or
                if we are required to do so by law. On termination, all licences
                granted to you under these Terms will immediately cease.
              </p>
            </section>

            {/* 10 */}
            <section id="governing-law" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                10. Governing Law
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms are governed by and construed in accordance with the
                laws of Italy, without regard to its conflict of law provisions.
                Any dispute arising from or relating to these Terms shall be
                subject to the exclusive jurisdiction of the courts of Italy,
                unless mandatory consumer-protection laws in your country of
                residence grant you additional rights.
              </p>
            </section>

            {/* 11 */}
            <section id="changes" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                11. Changes to These Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these Terms from time to time. We will notify you
                of material changes by posting the new Terms on this page and
                updating the "Last updated" date above. Your continued use of
                the Service after the effective date of the revised Terms
                constitutes your acceptance of them. If you do not agree to the
                new Terms, you must stop using the Service.
              </p>
            </section>

            {/* 12 */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                12. Contact
              </h2>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-xl font-semibold text-primary mb-2">
                  Alessandro Perrota
                </p>
                <p className="text-muted-foreground">
                  Questions about these Terms?{" "}
                  <a
                    href="mailto:Info@edikit.net"
                    className="text-primary hover:underline font-medium"
                  >
                    Info@edikit.net
                  </a>
                </p>
              </div>
            </section>
          </main>
        </div>

        {/* Footer helper */}
        <footer className="mt-20 pt-12 border-t border-border">
          <div className="bg-primary/5 p-10 rounded-3xl text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Have questions?</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              If anything in these Terms is unclear, reach out and we will be
              happy to explain.
            </p>
            <a
              href="mailto:Info@edikit.net"
              className="inline-flex items-center justify-center px-8 py-3 font-bold text-white bg-primary rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/25"
            >
              Contact us
            </a>
          </div>
          <div className="mt-12 text-center text-xs text-muted-foreground space-y-2">
            <p>
              See also our{" "}
              <Link
                href="https://www.iubenda.com/privacy-policy/82026734"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="https://www.iubenda.com/privacy-policy/82026734/cookie-policy"
                className="text-primary hover:underline"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
