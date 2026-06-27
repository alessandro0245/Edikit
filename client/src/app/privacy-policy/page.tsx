import React from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background text-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 border-b border-border pb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Privacy Policy of <span className="text-primary italic">edikit.vercel.app</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Welcome to the privacy policy of edikit.vercel.app. This policy will help you understand what data we collect, why we collect it, and what your rights are in relation to it.
          </p>
          <p className="mt-4 text-sm font-medium bg-secondary w-fit px-3 py-1 rounded-full text-secondary-foreground">
            Latest update: June 23, 2026
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Table of Contents - Desktop Sidebar */}
          <aside className="lg:w-1/4 hidden lg:block">
            <nav className="sticky top-24">
              <h2 className="text-lg font-bold mb-6 uppercase tracking-wider text-primary">
                Table of contents
              </h2>
              <ul className="space-y-4 text-sm">
                <li>
                  <a href="#owner-and-data-controller" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    Owner and Data Controller
                  </a>
                </li>
                <li>
                  <a href="#types-of-data" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    Types of Data collected
                  </a>
                </li>
                <li>
                  <a href="#mode-and-place" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    Mode and place of processing the Data
                  </a>
                </li>
                <li>
                  <a href="#purpose-of-processing" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    The purposes of processing
                  </a>
                </li>
                <li>
                  <a href="#cookie-policy" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#further-info-eu-users" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    Further Information for Users in the EU
                  </a>
                </li>
                <li>
                  <a href="#further-info-ch-users" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    Further Information for Users in Switzerland
                  </a>
                </li>
                <li>
                  <a href="#further-info-br-users" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    Further Information for Users in Brazil
                  </a>
                </li>
                <li>
                  <a href="#further-info-us-users" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    Further Information for Users in the USA
                  </a>
                </li>
                <li>
                  <a href="#additional-info-on-collection-and-processing" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    Additional info on Data collection
                  </a>
                </li>
                <li>
                  <a href="#definitions_and_legal_references" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    Definitions and legal references
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:w-3/4 space-y-16">
            {/* Owner and Data Controller */}
            <section id="owner-and-data-controller" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border shadow-sm">
                Owner and Data Controller
              </h2>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-xl font-semibold text-primary mb-2">Alessandro Perrota</p>
                <p className="flex items-center gap-2">
                  <span className="font-bold">Owner contact email:</span>
                  <a href="mailto:Info@edikit.net" className="hover:underline text-primary">
                    Info@edikit.net
                  </a>
                </p>
              </div>
            </section>

            {/* Types of Data collected */}
            <section id="types-of-data" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                Type of Data we collect
              </h2>
              <div className="prose prose-blue dark:prose-invert max-w-none space-y-4">
                <p>The owner does not provide a list of Personal Data types collected.</p>
                <p>
                  Complete details on each type of Personal Data collected are provided in the dedicated sections of this privacy policy or by specific explanation texts displayed prior to the Data collection.
                </p>
                <p>
                  Personal Data may be freely provided by the User, or, in case of Usage Data, collected automatically when using this Application.
                  Unless specified otherwise, all Data requested by this Application is mandatory and failure to provide this Data may make it impossible for this Application to provide its services. In cases where this Application specifically states that some Data is not mandatory, Users are free not to communicate this Data without consequences to the availability or the functioning of the Service.
                </p>
                <p>
                  Users who are uncertain about which Personal Data is mandatory are welcome to contact the Owner.
                  Any use of Cookies – or of other tracking tools — by this Application or by the owners of third-party services used by this Application serves the purpose of providing the Service required by the User, in addition to any other purposes described in the present document and in the Cookie Policy.
                </p>
                <p className="font-medium text-destructive">
                  Users are responsible for any third-party Personal Data obtained, published or shared through this Application.
                </p>
              </div>
            </section>

            {/* Mode and place of processing the Data */}
            <section id="mode-and-place" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                Mode and place of processing the Data
              </h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Methods of processing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Owner takes appropriate security measures to prevent unauthorized access, disclosure, modification, or unauthorized destruction of the Data.
                    The Data processing is carried out using computers and/or IT enabled tools, following organizational procedures and modes strictly related to the purposes indicated. In addition to the Owner, in some cases, the Data may be accessible to certain types of persons in charge, involved with the operation of this Application (administration, sales, marketing, legal, system administration) or external parties (such as third-party technical service providers, mail carriers, hosting providers, IT companies, communications agencies) appointed, if necessary, as Data Processors by the Owner. The updated list of these parties may be requested from the Owner at any time.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4">Place</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Data is processed at the Owner's operating offices and in any other places where the parties involved in the processing are located.
                    Depending on the User's location, data transfers may involve transferring the User's Data to a country other than their own. To find out more about the place of processing of such transferred Data, Users can check the section containing details about the processing of Personal Data.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4">Retention time</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Unless specified otherwise in this document, Personal Data shall be processed and stored for as long as required by the purpose they have been collected for and may be retained for longer due to applicable legal obligation or based on the Users’ consent.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookie Policy */}
            <section id="cookie-policy" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                Cookie Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                This Application uses Trackers. To learn more, Users may consult the{" "}
                <Link href="#" className="text-primary hover:underline font-bold">
                  Cookie Policy
                </Link>.
              </p>
            </section>

            {/* Further Information for Users in the European Union */}
            <section id="further-info-eu-users" className="scroll-mt-24 bg-secondary/30 p-8 rounded-2xl border border-border">
              <h2 className="text-3xl font-bold mb-6 pb-2">
                Further Information for Users in the European Union
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3">Legal basis of processing</h3>
                  <p className="text-muted-foreground mb-4">The Owner may process Personal Data relating to Users if one of the following applies:</p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Users have given their consent for one or more specific purposes.</li>
                    <li>Provision of Data is necessary for the performance of an agreement with the User.</li>
                    <li>Processing is necessary for compliance with a legal obligation to which the Owner is subject.</li>
                    <li>Processing is related to a task that is carried out in the public interest.</li>
                    <li>Processing is necessary for the purposes of the legitimate interests pursued by the Owner.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">The rights of Users based on the GDPR</h3>
                  <p className="text-muted-foreground mb-4">In particular, Users have the right to do the following, to the extent permitted by law:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Withdraw their consent at any time.",
                      "Object to processing of their Data.",
                      "Access their Data.",
                      "Verify and seek rectification.",
                      "Restrict the processing of their Data.",
                      "Have their Personal Data deleted or otherwise removed.",
                      "Receive their Data and have it transferred to another controller.",
                      "Lodge a complaint.",
                    ].map((right, index) => (
                      <li key={index} className="bg-card p-4 rounded-lg border border-border text-sm flex items-start gap-3">
                        <span className="text-primary font-bold">{index + 1}.</span>
                        {right}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Further information for Users in Switzerland */}
            <section id="further-info-ch-users" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                Further information for Users in Switzerland
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This section applies to Users in Switzerland, and, for such Users, supersedes any other possibly divergent or conflicting information contained in the privacy policy.
              </p>
              <h3 className="text-xl font-bold mb-3 text-foreground">The rights of Users according to the Swiss Federal Act on Data Protection</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Right of access to Personal Data.</li>
                <li>Right to object to the processing of their Personal Data.</li>
                <li>Right to receive their Personal Data and have it transferred to another controller.</li>
                <li>Right to ask for incorrect Personal Data to be corrected.</li>
              </ul>
            </section>

            {/* Further information for Users in Brazil */}
            <section id="further-info-br-users" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                Further information for Users in Brazil
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This section applies to all Users in Brazil according to the "Lei Geral de Proteção de Dados" (the "LGPD").
              </p>
              <h3 className="text-xl font-bold mb-3 text-foreground">Your Brazilian privacy rights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                {[
                  "Obtain confirmation of the existence of processing activities.",
                  "Access to your personal information.",
                  "Have incomplete, inaccurate or outdated personal information rectified.",
                  "Obtain the anonymization, blocking or elimination of unnecessary data.",
                  "Obtain information on the possibility to provide or deny your consent.",
                  "Obtain information about third parties with whom we share data.",
                  "Portability of your personal information.",
                  "Revoke your consent at any time.",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            {/* Further information for Users in the United States */}
            <section id="further-info-us-users" className="scroll-mt-24 bg-card p-8 rounded-2xl border border-primary/20 shadow-lg">
              <h2 className="text-3xl font-bold mb-6 pb-2 text-primary">
                Further information for Users in the United States
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 italic">
                This section applies to residents of California, Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Nevada, Delaware, Iowa, New Hampshire, New Jersey, Nebraska, Tennessee, Minnesota, Maryland, Indiana, Kentucky, Rhode Island and Montana.
              </p>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="p-1 bg-primary text-primary-foreground rounded text-xs">NOTICE</span>
                    Notice at collection
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We collect Personal Information either directly or indirectly from you when you use this Application. For example, you directly provide your Personal Information when you submit requests via any forms.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Your privacy rights under US state laws</h3>
                  <div className="bg-background rounded-lg border border-border divide-y divide-border">
                    {[
                      { title: "Right to access", desc: "The right to know if we are processing your info and access it." },
                      { title: "Right to correct", desc: "The right to request correction of inaccurate info." },
                      { title: "Right to delete", desc: "The right to request deletion of your info." },
                      { title: "Right to portability", desc: "The right to obtain a copy of your info in a portable format." },
                      { title: "Right to opt out", desc: "The right to opt out from the Sale of your info." },
                    ].map((right, i) => (
                      <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="font-bold text-foreground">{right.title}</span>
                        <span className="text-sm text-muted-foreground sm:text-right">{right.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Additional information about Data collection and processing */}
            <section id="additional-info-on-collection-and-processing" className="scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                Additional information about Data collection and processing
              </h2>
              <div className="space-y-6 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Legal action:</strong> The User's Personal Data may be used for legal purposes by the Owner in Court or in the stages leading to possible legal action.
                </p>
                <p>
                  <strong className="text-foreground">System logs:</strong> For operation and maintenance purposes, this Application may collect files that record interaction (System logs) or use IP Addresses.
                </p>
                <p>
                  <strong className="text-foreground">Changes to this policy:</strong> The Owner reserves the right to make changes to this privacy policy at any time by notifying its Users on this page.
                </p>
              </div>
            </section>

            {/* Definitions and legal references */}
            <section id="definitions_and_legal_references" className="scroll-mt-24 bg-secondary/10 p-8 rounded-xl border border-dashed border-border">
              <h2 className="text-3xl font-bold mb-6 pb-2">
                Definitions and legal references
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div>
                  <h4 className="font-bold text-foreground mb-2">Personal Data (or Data)</h4>
                  <p className="text-muted-foreground">Any information that allows for the identification or identifiability of a natural person.</p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">Usage Data</h4>
                  <p className="text-muted-foreground">Information collected automatically, such as IP addresses, browser features, and time details per visit.</p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">Data Subject</h4>
                  <p className="text-muted-foreground">The natural person to whom the Personal Data refers.</p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">Data Controller (or Owner)</h4>
                  <p className="text-muted-foreground">The body which determines the purposes and means of the processing of Personal Data.</p>
                </div>
              </div>
            </section>
          </main>
        </div>

        {/* Footer Helper */}
        <footer className="mt-20 pt-12 border-t border-border">
          <div className="bg-primary/5 p-10 rounded-3xl text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">How can we help?</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              While we strive to create a positive user experience, we understand that issues may occasionally arise. 
              If this is the case, please feel free to contact us.
            </p>
            <a 
              href="mailto:anatv333555@gmail.com" 
              className="inline-flex items-center justify-center px-8 py-3 font-bold text-white bg-primary rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/25"
            >
              Contact us
            </a>
          </div>
          <div className="mt-12 text-center text-xs text-muted-foreground space-y-2">
            <p>This policy relates solely to this Application, if not stated otherwise within this document.</p>
            <p>Generated with iubenda Privacy and Cookie Policy Generator.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
