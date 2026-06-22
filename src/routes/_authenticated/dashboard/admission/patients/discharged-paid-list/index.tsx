import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DischargedPatientListPage } from '@/features/admission/DischargedPatientListPage'

const dischargedPaidListSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/admission/patients/discharged-paid-list/')({
    validateSearch: (search) => dischargedPaidListSearchSchema.parse(search),
    component: DischargedPaidListPage,
})

function DischargedPaidListPage() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";

    const setPage = (newPage: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
    };
    const setLimit = (newLimit: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
    };
    const setSearch = (newSearch: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
    };

    return (
        <DischargedPatientListPage
            page={page}
            limit={limit}
            search={search}
            setPage={setPage}
            setLimit={setLimit}
            setSearch={setSearch}
            paymentStatus="fully_paid"
        />
    )
}
