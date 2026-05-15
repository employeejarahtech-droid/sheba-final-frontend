import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import DoctorTypes from '@/features/doctor-types'

const doctorTypesSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/indoor/master/doctor-types/')({
    validateSearch: (search) => doctorTypesSearchSchema.parse(search),
    component: DoctorTypesPage,
})

function DoctorTypesPage() {
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

    return <DoctorTypes page={page} limit={limit} search={search} setPage={setPage} setLimit={setLimit} setSearch={setSearch} />
}
