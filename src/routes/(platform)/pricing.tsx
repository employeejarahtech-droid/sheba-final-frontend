/**
 * Pricing Page — Subscription plans display
 *
 * Shows all active plans from GET /api/public/plans with monthly/yearly toggle.
 */

import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, X, ArrowRight } from 'lucide-react'
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
import { fetchPublicPlans } from '@/services/platform-public'

export const Route = createFileRoute('/(platform)/pricing')({
  component: PricingPage,
})

function PricingPage() {
  const [annual, setAnnual] = useState(false)

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['public', 'plans'],
    queryFn: () => fetchPublicPlans().then((r) => r.data),
  })

  const plans = plansData || []

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">Pricing Plans</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Choose the perfect plan for your hospital. All plans include core features.
          </p>

          {/* Monthly / Yearly toggle */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-primary/20 data-[state=active]:bg-primary"
              data-state={annual ? 'active' : 'inactive'}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${annual ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span
              className={`text-sm font-medium ${annual ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              Yearly
              <Badge variant="secondary" className="ml-1 text-xs">
                Save 17%
              </Badge>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading plans...</div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {plans.map((plan) => {
              const price = annual
                ? plan.price?.yearly || 0
                : plan.price?.monthly || 0
              const isPopular = plan.display_order === 2

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.description && (
                      <CardDescription>{plan.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-5xl font-bold">${price}</span>
                      <span className="text-muted-foreground">
                        /{annual ? 'year' : 'month'}
                      </span>
                    </div>

                    {/* Features */}
                    {plan.features && plan.features.length > 0 && (
                      <ul className="space-y-3">
                        {plan.features.map((feature, fi) => (
                          <li key={fi} className="flex items-start gap-2 text-sm">
                            {feature.included ? (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                            )}
                            <span className={feature.included ? '' : 'text-muted-foreground'}>
                              {feature.name}
                              {feature.limit ? ` (up to ${feature.limit})` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Limits */}
                    {plan.limits && (
                      <div className="mt-6 rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Users</span>
                          <span className="font-medium">{plan.max_users || plan.limits.users || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Storage</span>
                          <span className="font-medium">{plan.limits.storage || '—'} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">API Calls</span>
                          <span className="font-medium">
                            {plan.limits.apiCallsPerMonth === -1
                              ? 'Unlimited'
                              : plan.limits.apiCallsPerMonth
                                ? `${(plan.limits.apiCallsPerMonth / 1000).toFixed(0)}K`
                                : '—'}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Link to="/register" className="w-full">
                      <Button
                        className="w-full gap-2"
                        variant={isPopular ? 'default' : 'outline'}
                        size="lg"
                      >
                        Get Started
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Need a custom plan?{' '}
            <Link to="/contact" className="text-primary hover:underline font-medium">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
