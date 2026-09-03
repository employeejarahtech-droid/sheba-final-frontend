import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AdmittedPatientsList } from '@/features/admission/AdmittedPatientsList'

const patientsSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    status: z.string().optional(),
    sort: z.string().catch('admission_prefix'),
    order: z.string().catch('DESC'),
    from: z.string().catch(''),
    to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/admission/patients/')({
    validateSearch: (search) => patientsSearchSchema.parse(search),
    component: PatientsPage,
})

function PatientsPage() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
    const sort = searchParams?.sort || "admission_prefix";
    const order = searchParams?.order || "DESC";
    const from = searchParams?.from || "";
    const to = searchParams?.to || "";

    const setPage = (newPage: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
    };
    const setLimit = (newLimit: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
    };
    const setSearch = (newSearch: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
    };
    const setSort = (newSort: string, newOrder: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, sort: newSort, order: newOrder, page: 1 }) });
    };
    const setFrom = (newFrom: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
    };
    const setTo = (newTo: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
    };

    return (
        <AdmittedPatientsList
            page={page}
            limit={limit}
            search={search}
            sort={sort}
            order={order}
            from={from}
            to={to}
            setPage={setPage}
            setLimit={setLimit}
            setSearch={setSearch}
            setSort={setSort}
            setFrom={setFrom}
            setTo={setTo}
        />
    )
}
