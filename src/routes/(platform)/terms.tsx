/**
 * Terms of Service Page
 *
 * Marketing/legal page wrapped in the home LandingPageWrapper (header + footer)
 * and styled with the Sheba blue brand. Content is a general template and
 * should be reviewed by legal counsel before production use.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { Sparkles, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LandingPageWrapper } from '@/components/layout/landing-layout'

export const Route = createFileRoute('/(platform)/terms')({
  component: TermsPage,
})

const LAST_UPDATED = 'June 28, 2026'

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    body: [
      'These Terms of Service ("Terms") govern your access to and use of the HMS platform, website, and related services (collectively, the "Services") provided by HMS ("we", "us", or "our").',
      'By creating an account, accessing, or using the Services, you agree to be bound by these Terms. If you are entering into these Terms on behalf of a hospital or organization, you represent that you have the authority to bind that entity.',
    ],
  },
  {
    id: 'eligibility',
    title: 'Eligibility & Accounts',
    body: [
      'You must provide accurate and complete information when registering and keep it up to date. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.',
      'Notify us immediately of any unauthorized use of your account or any other breach of security.',
    ],
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions & Billing',
    body: [
      'Certain Services are billed on a subscription basis (monthly or yearly). By selecting a paid plan, you authorize us and our payment processors to charge the applicable fees to your chosen payment method.',
      'Fees are billed in advance and are non-refundable except where required by law. Plan changes take effect according to the terms presented at the time of the change.',
    ],
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use',
    body: [
      'You agree not to misuse the Services, including by attempting to access data belonging to other tenants, interfering with the platform’s operation, reverse engineering, introducing malicious code, or using the Services to violate any applicable law.',
      'You are responsible for ensuring that your use of the Services complies with all laws and regulations applicable to your hospital or organization.',
    ],
  },
  {
    id: 'customer-data',
    title: 'Customer Data & Responsibilities',
    body: [
      'You retain all rights to the data you and your users submit to the Services ("Customer Data"). You grant us a limited license to host, process, and transmit Customer Data solely to provide and support the Services.',
      'You are responsible for the accuracy, quality, and legality of Customer Data, including patient records, and for obtaining all necessary consents to process such data through the Services.',
    ],
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    body: [
      'The Services, including all software, design, text, and trademarks, are owned by us or our licensors and are protected by intellectual property laws. These Terms do not grant you any right, title, or interest in the Services other than the limited right to use them as permitted here.',
    ],
  },
  {
    id: 'availability',
    title: 'Service Availability',
    body: [
      'We strive to keep the Services available and reliable for critical-care operations. However, the Services may occasionally be unavailable due to maintenance, updates, or factors beyond our control.',
      'We may modify, suspend, or discontinue features of the Services at any time, and will provide reasonable notice of material changes where practicable.',
    ],
  },
  {
    id: 'termination',
    title: 'Termination',
    body: [
      'You may cancel your subscription at any time; access continues until the end of the current billing period. We may suspend or terminate your access if you breach these Terms or use the Services in a manner that risks harm to other users or the platform.',
      'Upon termination, your right to use the Services ceases. Customer Data is handled in accordance with our agreement with you and applicable law.',
    ],
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: [
      'The Services are provided "as is" and "as available" without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.',
      'The Services are administrative tools and do not provide medical advice. Clinical decisions remain the sole responsibility of qualified healthcare professionals.',
    ],
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    body: [
      'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, revenue, or profits arising from your use of the Services.',
      'Our total liability for any claim arising out of these Terms shall not exceed the amounts paid by you for the Services during the twelve months preceding the claim.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to These Terms',
    body: [
      'We may update these Terms from time to time. When we do, we will revise the "Last updated" date above. Material changes will be communicated through the platform or by email where appropriate. Continued use of the Services after changes take effect constitutes acceptance of the revised Terms.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: [
      'If you have questions about these Terms, please reach out to us at support@hms.com or through our contact page.',
    ],
  },
]

function TermsPage() {
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
            Terms of <span className="text-blue-600">Service</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Please read these terms carefully. They govern your access to and use
            of the HMS platform and services.
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
                  <FileText className="size-5" />
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                  By using HMS you agree to these Terms. They cover your
                  account, subscriptions, acceptable use, and the responsibilities
                  of both parties.
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
                        <p key={i} className="leading-relaxed text-slate-600">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 border-t border-slate-200 pt-8 text-sm text-slate-500">
                Questions about these terms?{' '}
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
