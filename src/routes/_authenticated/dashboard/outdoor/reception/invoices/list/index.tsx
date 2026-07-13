import Invoices from '@/features/invoices'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const invoicesSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    status: z.string().catch('all'),
    from: z.string().catch(''),
    to: z.string().catch(''),
    sort: z.string().catch('invoice_prefix'),
    order: z.string().catch('DESC'),
})

export const Route = createFileRoute(
    '/_authenticated/dashboard/outdoor/reception/invoices/list/',
)({
    validateSearch: (search) => invoicesSearchSchema.parse(search),
    component: InvoicesPage,
})

function InvoicesPage() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
    const statusFilter = searchParams?.status || "all";
    const from = searchParams?.from || "";
    const to = searchParams?.to || "";
    const sort = searchParams?.sort || "invoice_prefix";
    const order = searchParams?.order || "DESC";

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
    const setFrom = (newFrom: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
    };
    const setTo = (newTo: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
    };
    const setSort = (newSort: string, newOrder: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, sort: newSort, order: newOrder, page: 1 }) });
    };

    return (
        <Invoices
            page={page}
            limit={limit}
            search={search}
            statusFilter={statusFilter}
            from={from}
            to={to}
            sort={sort}
            order={order}
            setPage={setPage}
            setLimit={setLimit}
            setSearch={setSearch}
            setStatusFilter={setStatusFilter}
            setFrom={setFrom}
            setTo={setTo}
            setSort={setSort}
        />
    )
}
