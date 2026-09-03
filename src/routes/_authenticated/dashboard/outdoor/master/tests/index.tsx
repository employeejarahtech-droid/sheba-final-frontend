import ListOfTests from '@/components/ListOfTests'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useEffect } from 'react'

const testsSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    category_id: z.coerce.number().optional().catch(undefined),
    match_table_name: z.string().optional().catch(undefined),
    status: z.enum(['active', 'inactive']).optional().catch(undefined),
    orderBy: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/dashboard/outdoor/master/tests/')({
    validateSearch: (search) => testsSearchSchema.parse(search),
    component: TestsPage,
})

function TestsPage() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
    const categoryId = searchParams?.category_id || undefined;
    const matchTableName = searchParams?.match_table_name || undefined;
    const status = searchParams?.status || undefined;
    const orderBy = searchParams?.orderBy || "DESC";

    // Reflect the default sort (ID DESC) in the URL — mirrors the pathology list pages.
    useEffect(() => {
        if (!searchParams?.orderBy) {
            navigate({ to: '.', search: (prev: any) => ({ ...prev, orderBy: 'DESC' }), replace: true });
        }
    }, []);

    const setPage = (newPage: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
    };
    const setLimit = (newLimit: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
    };
    const setSearch = (newSearch: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
    };
    const setCategoryId = (newCategoryId: number | undefined) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, category_id: newCategoryId, page: 1 }) });
    };
    const setMatchTableName = (newMatchTableName: string | undefined) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, match_table_name: newMatchTableName, page: 1 }) });
    };
    const setStatus = (newStatus: string | undefined) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, status: newStatus, page: 1 }) });
    };

    return <ListOfTests page={page} limit={limit} search={search} categoryId={categoryId} matchTableName={matchTableName} status={status} orderBy={orderBy} setPage={setPage} setLimit={setLimit} setSearch={setSearch} setCategoryId={setCategoryId} setMatchTableName={setMatchTableName} setStatus={setStatus} />
}
