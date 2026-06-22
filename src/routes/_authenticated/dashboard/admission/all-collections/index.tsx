import { createFileRoute } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'

export const Route = createFileRoute('/_authenticated/dashboard/admission/all-collections/')({
    component: AllCollectionsPage,
})

function AllCollectionsPage() {
    return (
        <>
            <AppHeader />
            <Main fluid>
                <div className="p-4">
                    <PageHeader title="All Collections" description="All payment collections across users" />
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-sm">
                        This report is under construction.
                    </div>
                </div>
            </Main>
        </>
    )
}
