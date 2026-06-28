import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { fetchLandingData } from '@/services/platform-public'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const defaultPlans = [
  {
    id: 1,
    slug: 'free',
    name: 'Free',
    description: 'Get started with basic hospital management',
    price: { monthly: 0, yearly: 0 },
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
    description: 'Unlimited access with dedicated database',
    price: { monthly: 199, yearly: 1900 },
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

function calculateSavings(monthly: number, yearly: number): number {
  if (monthly === 0) return 0
  return Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100)
}

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  const { data } = useQuery({
    queryKey: ['public', 'landing'],
    queryFn: () => fetchLandingData().then((r) => r.data),
  })

  const apiPlans = data?.plans || []
  const plans =
    apiPlans.length > 0
      ? apiPlans.map((p: any) => ({
          ...p,
          features: p.features || [],
          price: p.price || { monthly: 0, yearly: 0 },
        }))
      : defaultPlans

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, no
            surprises.
          </p>
        </div>

        {/* Monthly/Yearly Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span
            className={`text-sm font-medium ${
              !isYearly ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              isYearly ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isYearly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              isYearly ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            Yearly
            {isYearly && (
              <span className="ml-1.5 text-xs text-emerald-600 font-semibold">
                Save up to 20%
              </span>
            )}
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan: any) => {
            const isPro = plan.slug === 'pro'
            const monthlyPrice = plan.price?.monthly || 0
            const yearlyPrice = plan.price?.yearly || 0
            const displayPrice = isYearly
              ? Math.round(yearlyPrice / 12)
              : monthlyPrice

            return (
              <Card
                key={plan.id || plan.slug}
                className={`relative flex flex-col ${
                  isPro
                    ? 'border-blue-600 border-2 shadow-xl scale-[1.02]'
                    : 'border-border/50'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1 text-xs font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">
                        ${displayPrice.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                    {isYearly && yearlyPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${yearlyPrice.toLocaleString()} billed annually
                        {monthlyPrice > 0 && (
                          <>
                            {' '}
                            &middot; Save{' '}
                            {calculateSavings(monthlyPrice, yearlyPrice)}%
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {(plan.features || []).map((f: any, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <Check
                          className={`size-4 mt-0.5 shrink-0 ${
                            f.included
                              ? 'text-blue-600'
                              : 'text-muted-foreground/40'
                          }`}
                        />
                        <span
                          className={
                            f.included ? '' : 'text-muted-foreground/60'
                          }
                        >
                          {typeof f.name === 'string'
                            ? f.name
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, (l) => l.toUpperCase())
                            : f.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    asChild
                    variant={isPro ? 'default' : 'outline'}
                    className={`w-full ${
                      isPro
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'hover:border-blue-600 hover:text-blue-600'
                    }`}
                  >
                    <Link
                      to="/register"
                      search={{
                        plan: plan.slug,
                        cycle: isYearly ? 'yearly' : 'monthly',
                      }}
                    >
                      {monthlyPrice === 0
                        ? 'Get Started Free'
                        : 'Get Started'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
