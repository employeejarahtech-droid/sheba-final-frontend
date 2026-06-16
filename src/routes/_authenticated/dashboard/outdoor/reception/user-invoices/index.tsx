import UserInvoices from '@/features/user-invoices'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const userInvoicesSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    status: z.string().catch('all'),
    user: z.string().catch('all'),
    from: z.string().catch(''),
    to: z.string().catch(''),
})

export const Route = createFileRoute(
    '/_authenticated/dashboard/outdoor/reception/user-invoices/',
)({
    validateSearch: (search) => userInvoicesSearchSchema.parse(search),
    component: UserInvoicesPage,
})

function UserInvoicesPage() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
    const statusFilter = searchParams?.status || "all";
    const selectedUser = searchParams?.user || "all";
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
    const setStatusFilter = (newStatus: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, status: newStatus, page: 1 }) });
    };
    const setSelectedUser = (newUser: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, user: newUser, page: 1 }) });
    };
    const setFrom = (newFrom: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
    };
    const setTo = (newTo: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
    };

    return (
        <UserInvoices
            page={page}
            limit={limit}
            search={search}
            statusFilter={statusFilter}
            selectedUser={selectedUser}
            from={from}
            to={to}
            setPage={setPage}
            setLimit={setLimit}
            setSearch={setSearch}
            setStatusFilter={setStatusFilter}
            setSelectedUser={setSelectedUser}
            setFrom={setFrom}
            setTo={setTo}
        />
    )
}
