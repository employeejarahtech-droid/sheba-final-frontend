import { createFileRoute } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Gallery } from '@/features/gallery'

export const Route = createFileRoute('/_authenticated/dashboard/gallery/')({
  component: GalleryPage,
})

function GalleryPage() {
  return (
    <>
      <AppHeader fixed />
      <Main fixed>
        <Gallery />
      </Main>
    </>
  )
}
