import { DataTable } from "@/components/dashboard/components/DataTable";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import {
    MoreHorizontal,
    PlusCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useState } from "react";
import { Link } from "react-router";

type ProductionBatch = {
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    startDate: string;
    dueDate: string;
    status: "Planned" | "In Progress" | "Completed" | "QA Check";
    supervisor: string;
};

const dummyBatches: ProductionBatch[] = [
    { id: "B-205", productName: "Men's Cotton T-Shirt", sku: "TS-M-001", quantity: 500, startDate: "2024-03-10", dueDate: "2024-03-15", status: "In Progress", supervisor: "Ali Hasan" },
    { id: "B-206", productName: "Slim Fit Jeans", sku: "JN-S-005", quantity: 200, startDate: "2024-03-12", dueDate: "2024-03-20", status: "Planned", supervisor: "Rezaul Karim" },
    { id: "B-201", productName: "Hoodie XL", sku: "HD-XL-002", quantity: 150, startDate: "2024-03-01", dueDate: "2024-03-05", status: "Completed", supervisor: "Ali Hasan" },
    { id: "B-204", productName: "Summer Dress", sku: "DR-S-010", quantity: 300, startDate: "2024-03-08", dueDate: "2024-03-14", status: "QA Check", supervisor: "Sarah Khan" },
];

export default function ProductionList() {
    const [page, setPage] = useState<number>(1);
    const [search, setSearch] = useState<string>("");
    const limit = 10;

    const [batches, setBatches] = useState<ProductionBatch[]>(dummyBatches);

    // Filter batches based on search
    const filteredBatches = batches.filter(item =>
        item.productName.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.supervisor.toLowerCase().includes(search.toLowerCase())
    );

    const paginatedBatches = filteredBatches.slice((page - 1) * limit, page * limit);

    const handleDelete = (id: string) => {
        setBatches(prev => prev.filter(b => b.id !== id));
    };


    const columns: ColumnDef<ProductionBatch>[] = [
        {
            accessorKey: "id",
            header: "Batch ID",
        },
        {
            accessorKey: "productName",
            header: "Product",
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.productName}</div>
                    <div className="text-xs text-gray-500">{row.original.sku}</div>
                </div>
            )
        },
        {
            accessorKey: "quantity",
            header: "Quantity",
        },
        {
            accessorKey: "startDate",
            header: "Timeline",
            cell: ({ row }) => (
                <div className="text-xs">
                    <div>Start: {row.original.startDate}</div>
                    <div className="text-gray-500">Due: {row.original.dueDate}</div>
                </div>
            ),
        },
        {
            accessorKey: "supervisor",
            header: "Supervisor",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const { status } = row.original;
                let colorClass = "bg-gray-500";
                if (status === "In Progress") colorClass = "bg-blue-500";
                else if (status === "Completed") colorClass = "bg-green-500";
                else if (status === "QA Check") colorClass = "bg-orange-500";
                else if (status === "Planned") colorClass = "bg-yellow-500";

                return (
                    <span
                        className={`py-1 px-2 rounded-full text-xs text-white font-medium ${colorClass}`}
                    >
                        {status}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link to={`/dashboard/production/${row.original.id}`} className="w-full">View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Link to="#" className="w-full">Update Status</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="text-red-600 focus:text-red-600">
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <div className="w-full">
            <div className="flex flex-wrap justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold">All Productions</h2>

                <Link to="/dashboard/production/create">
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-500">
                        <PlusCircle size={18} />
                        New Production
                    </button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Production Batches</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={paginatedBatches}
                        pageIndex={page - 1}
                        pageSize={limit}
                        totalCount={filteredBatches.length}
                        onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
                        onSearch={(value) => {
                            setSearch(value);
                            setPage(1);
                        }}
                        isFetching={false}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

