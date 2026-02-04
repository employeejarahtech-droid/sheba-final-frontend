import { DataTable } from "@/components/dashboard/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";


type FinishedGood = {
    id: string;
    batchNumber: string;
    product: string;
    quantity: number;
    costPrice: number;
    salesPrice: number;
    date: string;
};

const dummyFG: FinishedGood[] = [
    { id: "FG-2024-001", batchNumber: "B-205", product: "Men's Cotton T-Shirt", quantity: 350, costPrice: 5.50, salesPrice: 15.00, date: "2024-03-25" },
    { id: "FG-2024-002", batchNumber: "B-204", product: "Summer Dress", quantity: 120, costPrice: 12.00, salesPrice: 35.00, date: "2024-03-20" },
];

export default function FinishedGoodsList() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filteredData = dummyFG.filter(f => f.product.toLowerCase().includes(search.toLowerCase()) || f.batchNumber.toLowerCase().includes(search.toLowerCase()));

    const columns: ColumnDef<FinishedGood>[] = [
        { accessorKey: "id", header: "Entry ID" },
        { accessorKey: "date", header: "Date" },
        { accessorKey: "batchNumber", header: "Batch #" },
        { accessorKey: "product", header: "Product" },
        { accessorKey: "quantity", header: "Qty Added" },
        {
            accessorKey: "costPrice",
            header: "Cost Price",
            cell: ({ row }) => <span>${row.original.costPrice.toFixed(2)}</span>
        },
        {
            accessorKey: "salesPrice",
            header: "Sales Price",
            cell: ({ row }) => <span className="font-semibold text-green-600">${row.original.salesPrice.toFixed(2)}</span>
        },
    ];

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-wrap justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold">Finished Goods (Stock Entry)</h2>
                <Link to="/dashboard/production/finished-goods/create">
                    <Button className="bg-blue-600 hover:bg-blue-500">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Stock
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Production to Stock History</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        totalCount={filteredData.length}
                        pageIndex={page - 1}
                        pageSize={10}
                        onPageChange={p => setPage(p + 1)}
                        onSearch={setSearch}
                        isFetching={false}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
