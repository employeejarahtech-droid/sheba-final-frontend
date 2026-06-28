import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { BalanceDistributedListPage } from '@/features/admission/BalanceDistributedListPage'

const balanceDistributedSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    status: z.string().catch('all'),
    payment_status: z.string().catch('all'),
})

export const Route = createFileRoute('/_authenticated/dashboard/admission/patients/balance-distributed-list/')({
    validateSearch: (search) => balanceDistributedSearchSchema.parse(search),
    component: BalanceDistributedListPageWrapper,
})

function BalanceDistributedListPageWrapper() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
    const status = searchParams?.status || "all";
    const paymentStatus = searchParams?.payment_status || "all";

    const setPage = (newPage: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
    };
    const setLimit = (newLimit: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
    };
    const setSearch = (newSearch: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
    };
    const setStatus = (newStatus: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, status: newStatus, page: 1 }) });
    };
    const setPaymentStatus = (newPaymentStatus: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, payment_status: newPaymentStatus, page: 1 }) });
    };

    return (
        <BalanceDistributedListPage
            page={page}
            limit={limit}
            search={search}
            statusFilter={status}
            paymentFilter={paymentStatus}
            setPage={setPage}
            setLimit={setLimit}
            setSearch={setSearch}
            setStatusFilter={setStatus}
            setPaymentFilter={setPaymentStatus}
        />
    );
}
