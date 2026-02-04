import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable'
import { CreateCategoryForm } from './components/CreateCategoryForm'
import { useState } from 'react'
import { EditCategoryForm } from './components/EditCategoryForm'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'

type CategoryItem = {
    id: number;
    name: string;
    department_id: number;
    department_name: string;
    created_at: string;
};

export default function Categories() {
    const [openEditForm, setOpenEditForm] = useState<boolean>(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;


    const token = getCookie('accessToken');
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ["category", page, search],

        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-category?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch categories");
            return res.json();
        },

        enabled: !!token,

        placeholderData: (prev) =>
            prev
                ? prev
                : {
                    data: {
                        items: [],
                        meta: {
                            page,
                            limit,
                            total: 0,
                        },
                    },
                },
    });

    console.log('data', data);

    // Delete mutation




    console.log(data?.data);

    const columns: ColumnDef<CategoryItem>[] = [

        {
            accessorKey: "id",
            header: "Category ID",
        },
        {
            accessorKey: "name",
            header: "Category Name",
        },
        {
            accessorKey: "department_name",
            header: "Department Name",
        },
        // Actions Column
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate({ to: `/outdoor/master/categories/${item.id}` })}
                        >
                            View
                        </Button>
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                                setSelectedCategoryId(item.id);
                                setOpenEditForm(true);
                            }}
                        >
                            Edit
                        </Button>
                    </div>
                );
            },
        },
    ];

    return <>
        <Header>
            <Search />
            <div className='ms-auto flex items-center space-x-4'>
                <ThemeSwitch />
                <ConfigDrawer />
                <ProfileDropdown />
            </div>
        </Header>

        <Main>
            <div className="flex flex-wrap items-end justify-between gap-2">
                <h1 className="text-2xl font-bold tracking-tight mb-4">List of Categories</h1>
                <CreateCategoryForm />
            </div>
            <DataTable columns={columns} data={data?.data?.items || []} meta={data?.data?.meta} onPageChange={setPage} search={search} onSearchChange={setSearch} />
            <EditCategoryForm open={openEditForm} setOpen={setOpenEditForm} categoryId={selectedCategoryId} />
        </Main>
    </>
}