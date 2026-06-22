import { createFileRoute } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'

export const Route = createFileRoute('/_authenticated/dashboard/admission/user-wise-collections/')({
    component: UserWiseCollectionsPage,
})

function UserWiseCollectionsPage() {
    return (
        <>
            <AppHeader />
            <Main fluid>
                <div className="p-4">
                    <PageHeader title="User Wise Collections" description="Payment collections grouped by user" />
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-sm">
                        This report is under construction.
                    </div>
                </div>
            </Main>
        </>
    )
}
