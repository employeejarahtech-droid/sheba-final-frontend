import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable'
import { testData } from '@/data/data'


type TestItem = {
    id: string;
    name: string;
    category: string;
    status: "passed" | "failed" | "pending";
    score: number;
};

const tests: TestItem[] = testData;


export default function ListOfServices() {
    const columns: ColumnDef<TestItem>[] = [
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
            accessorKey: "name",
            header: "Test Name",
        },
        {
            accessorKey: "category",
            header: "Category",
        },

        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                const color =
                    status === "passed"
                        ? "bg-green-500"
                        : status === "failed"
                            ? "bg-red-500"
                            : "bg-yellow-500";

                return <Badge className={color + " text-white"}>{status}</Badge>;
            },
        },

        {
            accessorKey: "score",
            header: "Score",
        },

        // Actions Column
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => alert("View " + item.id)}>
                            View
                        </Button>
                        <Button size="sm" variant="default" onClick={() => alert("Edit " + item.id)}>
                            Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => alert("Delete " + item.id)}>
                            Delete
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
                <h1 className="text-2xl font-bold tracking-tight mb-4">List of Tests</h1>
                {/* <CreateTestForm /> */}
            </div>
            <DataTable columns={columns} data={tests} />
        </Main>
    </>
}