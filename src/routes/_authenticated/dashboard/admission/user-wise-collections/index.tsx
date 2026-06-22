import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import IndoorAllCollections from '@/features/indoor-all-collections'

const userWiseCollectionsSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    from: z.string().catch(''),
    to: z.string().catch(''),
    user: z.string().catch('all'),
})

export const Route = createFileRoute('/_authenticated/dashboard/admission/user-wise-collections/')({
    validateSearch: (search) => userWiseCollectionsSearchSchema.parse(search),
    component: UserWiseCollectionsPage,
})

function UserWiseCollectionsPage() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
    const from = searchParams?.from || "";
    const to = searchParams?.to || "";
    const user = searchParams?.user || "all";

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
    const setUser = (newUser: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, user: newUser, page: 1 }) });
    };

    return (
        <IndoorAllCollections
            page={page}
            limit={limit}
            search={search}
            from={from}
            to={to}
            user={user}
            setPage={setPage}
            setLimit={setLimit}
            setSearch={setSearch}
            setFrom={setFrom}
            setTo={setTo}
            setUser={setUser}
            scope="user-wise"
        />
    )
}
