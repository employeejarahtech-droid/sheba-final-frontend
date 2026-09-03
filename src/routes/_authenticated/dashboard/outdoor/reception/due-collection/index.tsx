import DueCollection from '@/features/due-collection'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const dueCollectionSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    from: z.string().catch(''),
    to: z.string().catch(''),
    orderBy: z.string().catch('DESC'),
})

export const Route = createFileRoute(
    '/_authenticated/dashboard/outdoor/reception/due-collection/',
)({
    validateSearch: (search) => dueCollectionSearchSchema.parse(search),
    component: DueCollectionPage,
})

function DueCollectionPage() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
    const from = searchParams?.from || "";
    const to = searchParams?.to || "";
    const orderBy = searchParams?.orderBy || "DESC";

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
        <DueCollection
            page={page}
            limit={limit}
            search={search}
            from={from}
            to={to}
            orderBy={orderBy}
            setPage={setPage}
            setLimit={setLimit}
            setSearch={setSearch}
            setFrom={setFrom}
            setTo={setTo}
        />
    )
}
