import { createFileRoute } from '@tanstack/react-router'
import EditServicePage from '@/features/services/edit-page'

export const Route = createFileRoute(
  '/_authenticated/indoor/master/services/edit/$id',
)({
  component: () => {
    const { id } = Route.useParams()
    return <EditServicePage id={id} />
  },
})
