import OutdoorAllCollections from '@/features/outdoor-all-collections'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const allCollectionsSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    from: z.string().catch(''),
    to: z.string().catch(''),
})

export const Route = createFileRoute(
    '/_authenticated/dashboard/outdoor/reception/all-collections/',
)({
    validateSearch: (search) => allCollectionsSearchSchema.parse(search),
    component: AllCollectionsPage,
})

function AllCollectionsPage() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
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
    const setFrom = (newFrom: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
    };
    const setTo = (newTo: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
    };

    return (
        <OutdoorAllCollections
            page={page}
            limit={limit}
            search={search}
            from={from}
            to={to}
            setPage={setPage}
            setLimit={setLimit}
            setSearch={setSearch}
            setFrom={setFrom}
            setTo={setTo}
            scope="all"
        />
    )
}
