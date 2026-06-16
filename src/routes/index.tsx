import { createFileRoute } from '@tanstack/react-router'
import { LandingPageWrapper } from '@/components/layout/landing-layout'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { StatsSection } from '@/components/landing/stats-section'
import { CtaSection } from '@/components/landing/cta-section'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
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
