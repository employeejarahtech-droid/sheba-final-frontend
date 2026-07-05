import { ContentSection } from '../components/content-section'
import { DomainConfigurationForm } from './domain-configuration-form'

export function SettingsDomainConfiguration() {
  return (
    <ContentSection
      title='Domain Configuration'
      desc='Request a custom domain for your hospital. Our team handles DNS, SSL, and going live.'
    >
      <DomainConfigurationForm />
    </ContentSection>
  )
}
