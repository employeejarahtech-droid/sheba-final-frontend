import SampleCollectionRooms from '@/features/sample-collection-rooms'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outdoor/master/sample-collection-rooms/')({
  component: SampleCollectionRooms,
})
