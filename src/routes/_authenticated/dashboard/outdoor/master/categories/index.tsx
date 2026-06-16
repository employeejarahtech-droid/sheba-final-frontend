import Categories from '@/features/categories'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const categoriesSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    department: z.string().catch('all'),
})

export const Route = createFileRoute(
    '/_authenticated/dashboard/outdoor/master/categories/',
)({
    validateSearch: (search) => categoriesSearchSchema.parse(search),
    component: CategoriesPage,
})

function CategoriesPage() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
    const departmentId = searchParams?.department || "all";

    const setPage = (newPage: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
    };
    const setLimit = (newLimit: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
    };
    const setSearch = (newSearch: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
    };
    const setDepartmentId = (newDepartment: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, department: newDepartment, page: 1 }) });
    };

    return (
        <Categories
            page={page}
            limit={limit}
            search={search}
            departmentId={departmentId}
            setPage={setPage}
            setLimit={setLimit}
            setSearch={setSearch}
            setDepartmentId={setDepartmentId}
        />
    )
}
