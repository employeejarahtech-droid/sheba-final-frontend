import { createFileRoute } from '@tanstack/react-router'
import { LandingPageWrapper } from '@/components/layout/landing-layout'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { StatsSection } from '@/components/landing/stats-section'
import { CtaSection } from '@/components/landing/cta-section'
import { Login } from '@/features/auth/sign-in/login'
import { TenantHome } from '@/features/tenant/tenant-home'
import { getSubdomainInfo } from '@/lib/subdomain'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { isCompanyPortal } = getSubdomainInfo()
  const accessToken = useAuthStore((s) => s.accessToken)

  // Tenant subdomain (e.g. sheba.lvh.me).
  if (isCompanyPortal) {
    // Logged in → browsable branded home page; logged out → login page.
    return accessToken ? <TenantHome /> : <Login />
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
