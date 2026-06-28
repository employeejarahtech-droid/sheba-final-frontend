import { createFileRoute } from '@tanstack/react-router'
import { LandingPageWrapper } from '@/components/layout/landing-layout'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { StatsSection } from '@/components/landing/stats-section'
import { CtaSection } from '@/components/landing/cta-section'
import { TenantHome } from '@/features/tenant/tenant-home'
import { getSubdomainInfo } from '@/lib/subdomain'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { isCompanyPortal } = getSubdomainInfo()

  // Tenant subdomain (e.g. sheba.lvh.me).
  // The root is always the tenant home page — it adapts to auth state
  // (Sign In when logged out, Go to Dashboard when logged in). The login
  // form lives at /login, so / and /login stay distinct pages.
  if (isCompanyPortal) {
    return <TenantHome />
  }

  // Platform base domain (e.g. lvh.me) → marketing landing page.
  return (
    <LandingPageWrapper>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <PricingSection />
      <CtaSection />
    </LandingPageWrapper>
  )
}
