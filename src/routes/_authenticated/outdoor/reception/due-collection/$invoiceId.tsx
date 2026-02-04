import DueCollectionDetails from '@/features/due-collection/DueCollectionDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outdoor/reception/due-collection/$invoiceId')({
    component: DueCollectionDetails,
})
