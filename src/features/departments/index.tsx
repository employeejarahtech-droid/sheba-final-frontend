import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable'
import { CreateDepartmentForm } from './components/CreateDepartmentForm'
import { EditDepartmentForm } from './components/EditDepartmentForm'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'


type DepartmentItem = {
    id: string;
    name: string;
};

export default function Departments() {
    const [openEditForm, setOpenEditForm] = useState<boolean>(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const limit = 10;


    const token = getCookie('accessToken');
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ["deparmtent", page],

        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/department?page=${page}&limit=${limit}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch departments");
            return res.json(); // MUST match placeholderData
        },

        enabled: !!token,

        // ⭐ Perfect smooth pagination
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

    // Delete mutation




    console.log(data?.data);

    const columns: ColumnDef<DepartmentItem>[] = [
        // Row selection
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(Boolean(value))
                    }
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "id",
            header: "Department ID",
        },
        {
            accessorKey: "name",
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
                            onClick={() => navigate({ to: `/outdoor/master/departments/${item.id}` })}
                        >
                            View
                        </Button>
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                                setSelectedDepartmentId(item.id);
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
                <h1 className="text-2xl font-bold tracking-tight mb-4">List of Departments</h1>
                <CreateDepartmentForm />
            </div>
            <DataTable columns={columns} data={data?.data?.items || []} meta={data?.data?.meta} onPageChange={(newPage) => setPage(newPage)} />
            <EditDepartmentForm open={openEditForm} setOpen={setOpenEditForm} departmentId={selectedDepartmentId} />
        </Main>
    </>
}