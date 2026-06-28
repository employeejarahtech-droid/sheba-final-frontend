/**
 * Privacy Policy Page
 *
 * Marketing/legal page wrapped in the home LandingPageWrapper (header + footer)
 * and styled with the Sheba blue brand. Content is a general template and
 * should be reviewed by legal counsel before production use.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { Sparkles, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LandingPageWrapper } from '@/components/layout/landing-layout'

export const Route = createFileRoute('/(platform)/privacy')({
  component: PrivacyPage,
})

const LAST_UPDATED = 'June 28, 2026'

const sections = [
  {
    id: 'introduction',
    title: 'Introduction',
    body: [
      'HMS ("we", "us", or "our") provides a hospital management platform for healthcare facilities. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our website and services.',
      'By accessing or using the platform, you agree to the practices described in this policy. If you do not agree, please discontinue use of the services.',
    ],
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    body: [
      'We collect information you provide directly to us, such as your name, email address, phone number, hospital or company details, and any content you submit through registration or contact forms.',
      'We also collect technical information automatically, including IP address, browser type, device information, and usage data, to operate and improve the platform.',
    ],
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    body: [
      'We use the information we collect to provide, maintain, and improve our services; to process registrations and payments; to communicate with you; to provide customer support; and to ensure the security and integrity of the platform.',
      'We do not sell your personal information to third parties.',
    ],
  },
  {
    id: 'data-isolation',
    title: 'Patient Data & Tenant Isolation',
    body: [
      'Each hospital on our platform is provisioned with its own dedicated, encrypted database. Patient records and clinical data belonging to one hospital are never co-mingled with or accessible to another tenant.',
      'Hospitals act as the data controller for the patient information they store, and HMS acts as the data processor, handling that information solely on the hospital’s instructions.',
    ],
  },
  {
    id: 'data-security',
    title: 'Data Security',
    body: [
      'We implement administrative, technical, and physical safeguards designed to protect your information, including encryption in transit and at rest, access controls, and ongoing monitoring.',
      'No method of transmission or storage is completely secure, and we cannot guarantee absolute security. We encourage you to use strong credentials and to keep them confidential.',
    ],
  },
  {
    id: 'sharing',
    title: 'How We Share Information',
    body: [
      'We may share information with trusted service providers who perform services on our behalf (such as payment processing and hosting), under contractual obligations to protect your data.',
      'We may also disclose information where required by law, to enforce our terms, or to protect the rights, property, and safety of our users and the public.',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies & Tracking',
    body: [
      'We use cookies and similar technologies to keep you signed in, remember your preferences, and analyze how the platform is used. You can control cookies through your browser settings, though some features may not function properly if disabled.',
    ],
  },
  {
    id: 'retention',
    title: 'Data Retention',
    body: [
      'We retain personal information for as long as necessary to provide the services and fulfill the purposes described in this policy, unless a longer retention period is required or permitted by law.',
      'Upon termination of a hospital account, data is handled in accordance with our agreement with that hospital and applicable legal requirements.',
    ],
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    body: [
      'Depending on your jurisdiction, you may have the right to access, correct, update, or delete your personal information, and to object to or restrict certain processing.',
      'To exercise these rights, please contact us using the details below. Patients should direct requests to the hospital that holds their records.',
    ],
  },
  {
    id: 'children',
    title: "Children's Privacy",
    body: [
      'Our services are intended for use by healthcare organizations and are not directed to children. We do not knowingly collect personal information directly from children outside of the clinical records managed by hospitals.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date above. Material changes will be communicated through the platform or by email where appropriate.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: [
      'If you have questions about this Privacy Policy or our data practices, please reach out to us at support@hms.com or through our contact page.',
    ],
  },
]

function PrivacyPage() {
  return (
    <LandingPageWrapper>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-slate-50">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-100 blur-3xl mix-blend-multiply" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sky-100 blur-3xl mix-blend-multiply" />
        </div>
        <div className="relative container mx-auto px-4 py-16 text-center md:py-20">
          <Badge
            variant="secondary"
            className="mb-5 border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700"
          >
            <Sparkles className="mr-2 size-3.5 text-blue-500" />
            Legal
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Privacy <span className="text-blue-600">Policy</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Your privacy matters to us. This policy explains what we collect, how
            we use it, and the choices you have.
          </p>
          <p className="mt-4 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[260px_1fr]">
            {/* Table of contents */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="mb-4 text-sm font-semibold text-slate-900">
                  On this page
                </p>
                <nav className="space-y-2 border-l border-slate-200">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="-ml-px block border-l-2 border-transparent pl-4 text-sm text-slate-500 transition-colors hover:border-blue-600 hover:text-blue-600"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Body */}
            <div className="max-w-3xl">
              {/* Highlight callout */}
              <div className="mb-10 flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <ShieldCheck className="size-5" />
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                  Every hospital on HMS runs on its own dedicated, encrypted
                  database. Patient data is never shared between tenants — security
                  and isolation are built into our foundation.
                </p>
              </div>

              <div className="space-y-12">
                {sections.map((section) => (
                  <div key={section.id} id={section.id} className="scroll-mt-24">
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">
                      {section.title}
                    </h2>
                    <div className="space-y-4">
                      {section.body.map((paragraph, i) => (
                        <p
                          key={i}
                          className="leading-relaxed text-slate-600"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 border-t border-slate-200 pt-8 text-sm text-slate-500">
                Questions about this policy?{' '}
                <Link
                  to="/contact"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Get in touch
                </Link>
                .
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingPageWrapper>
  )
}
