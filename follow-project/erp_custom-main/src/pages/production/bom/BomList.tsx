import { DataTable } from "@/components/dashboard/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

type BOM = {
    id: string;
    productName: string;
    itemsCount: number;
    status: "Active" | "Draft" | "Archived";
    lastUpdated: string;
};

const dummyBOMs: BOM[] = [
    { id: "BOM-001", productName: "Men's Cotton T-Shirt (M)", itemsCount: 4, status: "Active", lastUpdated: "2024-03-01" },
    { id: "BOM-002", productName: "Denim Jeans (32)", itemsCount: 6, status: "Draft", lastUpdated: "2024-03-28" },
];

export default function BomList() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filteredData = dummyBOMs.filter(b => b.productName.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase()));

    const columns: ColumnDef<BOM>[] = [
        { accessorKey: "id", header: "BOM ID" },
        { accessorKey: "productName", header: "Product" },
        { accessorKey: "itemsCount", header: "Materials Count" },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const colors = {
                    Active: "bg-green-500",
                    Draft: "bg-gray-400",
                    Archived: "bg-red-500"
                };
                return <Badge className={colors[row.original.status]}>{row.original.status}</Badge>;
            }
        },
        { accessorKey: "lastUpdated", header: "Last Updated" },
    ];

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-wrap justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold">Bill of Materials (Recipes)</h2>
                <Link to="/dashboard/production/bom/create">
                    <Button className="bg-blue-600 hover:bg-blue-500">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Recipe
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>BOM Library</CardTitle>
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
