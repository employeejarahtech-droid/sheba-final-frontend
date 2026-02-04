import { ContentSection } from '../components/content-section'
import { PrefixForm } from './prefix-form'

export function SettingsPrefix() {
    return (
        <ContentSection
            title='Prefix Settings'
            desc='Manage prefix settings for invoices and other entities.'
        >
            <PrefixForm />
        </ContentSection>
    )
}
