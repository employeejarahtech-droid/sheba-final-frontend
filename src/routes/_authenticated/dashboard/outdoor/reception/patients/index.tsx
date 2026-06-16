
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'



import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/dashboard/outdoor/reception/patients/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <>
    <AppHeader fixed />
    <Main>
      <div className="mb-4">
        <h1 className='text-2xl font-bold tracking-tight'>List of Patients</h1>
      </div>
    </Main>
  </>
}
