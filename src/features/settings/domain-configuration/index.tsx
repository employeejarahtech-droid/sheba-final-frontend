import { ContentSection } from '../components/content-section'
import { DomainConfigurationForm } from './domain-configuration-form'

export function SettingsDomainConfiguration() {
  return (
    <ContentSection
      title='Domain Configuration'
      desc='Add and manage custom domains for your hospital. Configure DNS, SSL certificates, and domain verification.'
    >
      <DomainConfigurationForm />
    </ContentSection>
  )
}
