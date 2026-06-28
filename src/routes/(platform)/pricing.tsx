/**
 * Pricing Page — Subscription plans display
 *
 * Wrapped in the marketing LandingPageWrapper (home header + footer) and
 * styled with the Sheba blue brand. Shows all active plans from
 * GET /api/public/plans with a monthly/yearly toggle, falling back to a
 * sensible default set when the API is unavailable. Includes an FAQ and a
 * closing call-to-action.
 */

import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Check, X, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LandingPageWrapper } from '@/components/layout/landing-layout'
import { CtaSection } from '@/components/landing/cta-section'
import { fetchPublicPlans } from '@/services/platform-public'

export const Route = createFileRoute('/(platform)/pricing')({
  component: PricingPage,
})

// Fallback plans shown when the public API is unreachable, so the page is
// never empty. Mirrors the marketing PricingSection defaults.
const defaultPlans = [
  {
    id: 1,
    slug: 'free',
    name: 'Free',
    description: 'Get started with basic hospital management',
    price: { monthly: 0, yearly: 0 },
    max_users: 5,
    limits: { storage: 1, apiCallsPerMonth: 5000 },
    display_order: 1,
    features: [
      { name: 'Basic Modules', included: true },
      { name: 'Up to 5 Users', included: true },
      { name: '1 Department', included: true },
      { name: 'Basic Reports', included: true },
      { name: 'Advanced Reports', included: false },
      { name: 'API Access', included: false },
      { name: 'Priority Support', included: false },
    ],
  },
  {
    id: 2,
    slug: 'pro',
    name: 'Pro',
    description: 'Full hospital management for growing facilities',
    price: { monthly: 49, yearly: 470 },
    max_users: 25,
    limits: { storage: 50, apiCallsPerMonth: 100000 },
    display_order: 2,
    features: [
      { name: 'All Modules', included: true },
      { name: 'Up to 25 Users', included: true },
      { name: '5 Departments', included: true },
      { name: 'Advanced Reports', included: true },
      { name: 'API Access', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Custom Domain', included: false },
    ],
  },
  {
    id: 3,
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Unlimited access with a dedicated database',
    price: { monthly: 199, yearly: 1900 },
    max_users: null,
    limits: { storage: 500, apiCallsPerMonth: -1 },
    display_order: 3,
    features: [
      { name: 'All Modules', included: true },
      { name: 'Unlimited Users', included: true },
      { name: 'Unlimited Departments', included: true },
      { name: 'Advanced Reports', included: true },
      { name: 'API Access', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Custom Domain', included: true },
    ],
  },
]

const faqs = [
  {
    q: 'Can I change my plan later?',
    a: 'Yes. Upgrade or downgrade at any time from your dashboard — changes take effect immediately and billing is prorated.',
  },
  {
    q: 'Is my hospital data isolated?',
    a: 'Every hospital runs on its own dedicated, encrypted database. Your data is never shared with other tenants on the platform.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'International cards and Apple Pay via Stripe, plus bKash, Nagad, Rocket and local cards via SSLCommerz for customers in Bangladesh.',
  },
  {
    q: 'Do you offer a free plan?',
    a: 'Yes. The Free plan lets you explore core hospital management features with up to 5 users — no card required to get started.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. There are no long-term contracts. Cancel whenever you like and you retain access until the end of your billing period.',
  },
  {
    q: 'Need something custom?',
    a: 'Larger hospital groups can get tailored limits, onboarding and SLAs. Reach out to our team and we will build a plan that fits.',
  },
]

// Plans may arrive with price as an object or a JSON string. Normalise both.
function parsePrice(price: unknown): { monthly: number; yearly: number } {
  if (!price) return { monthly: 0, yearly: 0 }
  if (typeof price === 'string') {
    try {
      return JSON.parse(price)
    } catch {
      return { monthly: 0, yearly: 0 }
    }
  }
  return price as { monthly: number; yearly: number }
}

function calculateSavings(monthly: number, yearly: number): number {
  if (monthly === 0) return 0
  return Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100)
}

function PricingPage() {
  const [annual, setAnnual] = useState(false)

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['public', 'plans'],
    queryFn: () => fetchPublicPlans().then((r) => r.data),
  })

  const plans = plansData && plansData.length > 0 ? plansData : defaultPlans

  return (
    <LandingPageWrapper>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-50 border-b border-slate-100">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-blue-100 blur-3xl mix-blend-multiply" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sky-100 blur-3xl mix-blend-multiply" />
        </div>
        <div className="relative container mx-auto px-4 py-16 md:py-20 text-center">
          <Badge
            variant="secondary"
            className="mb-5 border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700"
          >
            <Sparkles className="mr-2 size-3.5 text-blue-500" />
            Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Plans that scale with your <span className="text-blue-600">hospital</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Start free and upgrade when you need more. Every plan includes core
            hospital management with a dedicated, encrypted database.
          </p>

          {/* Monthly / Yearly toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium ${!annual ? 'text-slate-900' : 'text-slate-500'}`}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                annual ? 'bg-blue-600' : 'bg-slate-300'
              }`}
              aria-label="Toggle annual billing"
            >
              <span
                className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  annual ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${annual ? 'text-slate-900' : 'text-slate-500'}`}
            >
              Yearly
              <span className="ml-1.5 text-xs font-semibold text-emerald-600">
                Save up to 20%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Loading plans...</div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {plans.map((plan: any) => {
                const price = parsePrice(plan.price)
                const monthlyPrice = price.monthly || 0
                const yearlyPrice = price.yearly || 0
                const displayPrice = annual
                  ? Math.round(yearlyPrice / 12)
                  : monthlyPrice
                const isPopular =
                  plan.slug === 'pro' || plan.display_order === 2
                const apiCalls = plan.limits?.apiCallsPerMonth

                return (
                  <Card
                    key={plan.id || plan.slug}
                    className={`relative flex flex-col ${
                      isPopular
                        ? 'border-2 border-blue-600 shadow-xl lg:scale-[1.03]'
                        : 'border-slate-200'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <Badge className="bg-blue-600 px-4 py-1 text-xs font-semibold text-white hover:bg-blue-600">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center">
                      <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                      {plan.description && (
                        <CardDescription>{plan.description}</CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col">
                      {/* Price */}
                      <div className="mb-6 text-center">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold text-slate-900">
                            ${displayPrice.toLocaleString()}
                          </span>
                          <span className="text-slate-500">/mo</span>
                        </div>
                        {annual && yearlyPrice > 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            ${yearlyPrice.toLocaleString()} billed annually
                            {monthlyPrice > 0 && (
                              <> &middot; Save {calculateSavings(monthlyPrice, yearlyPrice)}%</>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Features */}
                      {plan.features && plan.features.length > 0 && (
                        <ul className="mb-6 flex-1 space-y-3">
                          {plan.features.map((feature: any, fi: number) => (
                            <li key={fi} className="flex items-start gap-2.5 text-sm">
                              {feature.included ? (
                                <Check className="mt-0.5 size-4 shrink-0 text-blue-600" />
                              ) : (
                                <X className="mt-0.5 size-4 shrink-0 text-slate-300" />
                              )}
                              <span className={feature.included ? '' : 'text-slate-400'}>
                                {typeof feature.name === 'string'
                                  ? feature.name
                                      .replace(/_/g, ' ')
                                      .replace(/\b\w/g, (l: string) => l.toUpperCase())
                                  : feature.name}
                                {feature.limit ? ` (up to ${feature.limit})` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Limits */}
                      {plan.limits && (
                        <div className="mb-6 space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Users</span>
                            <span className="font-medium">
                              {plan.max_users ?? plan.limits.users ?? 'Unlimited'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Storage</span>
                            <span className="font-medium">
                              {plan.limits.storage ? `${plan.limits.storage} GB` : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">API Calls</span>
                            <span className="font-medium">
                              {apiCalls === -1
                                ? 'Unlimited'
                                : apiCalls
                                  ? `${(apiCalls / 1000).toFixed(0)}K`
                                  : '—'}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Button
                        asChild
                        size="lg"
                        variant={isPopular ? 'default' : 'outline'}
                        className={`w-full gap-2 ${
                          isPopular
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <Link
                          to="/register"
                          search={{
                            plan: plan.slug,
                            cycle: annual ? 'yearly' : 'monthly',
                            status: '',
                            reason: '',
                          }}
                        >
                          {monthlyPrice === 0 ? 'Get Started Free' : 'Get Started'}
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Everything you need to know about plans and billing.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="mb-2 font-semibold text-slate-900">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-slate-600">
            Still have questions?{' '}
            <Link
              to="/contact"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Contact us
            </Link>
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <CtaSection />
    </LandingPageWrapper>
  )
}
