"use client";

import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useProduct, useStockMovements } from "../api/queries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import type { StockMovement } from "@/types/types";
import EditStockForm from "@/components/products/EditStockForm";
import { Route as ProductDetailsRoute } from "@/routes/_authenticated/products/$productId/index";
import BackButton from "@/components/BackButton";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { topNav } from "@/data/data";

// --- COLUMN DEFINITION ---

export const stockColumns: ColumnDef<StockMovement>[] = [
    {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
    },
    {
        accessorKey: "movement_type",
        header: "Type",
        cell: ({ row }) => (
            <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${row.original.movement_type === "in"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                    }`}
            >
                {row.original.movement_type === "in" ? "Stock In" : "Stock Out"}
            </span>
        ),
    },
    {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => (
            <span
                className={`font-medium ${row.original.movement_type === "in" ? "text-green-600" : "text-red-600"
                    }`}
            >
                {row.original.movement_type === "in" ? "+" : "-"}
                {row.original.quantity}
            </span>
        ),
    },
    {
        accessorKey: "reference_type",
        header: "Reference",
    },
    {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => <span className="text-gray-500 italic">{row.original.notes}</span>,
    },
];

export default function ProductDetails() {
    const { productId } = useParams({ from: ProductDetailsRoute.id });
    const id = Number(productId);
    // Simple currency constant - replace with your preferred currency
    const currency = "$";

    const { data: productData, isLoading: isProductLoading } = useProduct(id);
    const product = productData?.data;

    const [page, setPage] = useState(1);
    const limit = 5;

    const { data: fetchedStockMovements } = useStockMovements({ page, limit });

    const [isEditStockOpen, setIsEditStockOpen] = useState(false);

    const columns = stockColumns;

    if (isProductLoading) {
        return <div className="p-6">Loading product details...</div>;
    }

    if (!product) {
        return <div className="p-6">Product not found.</div>;
    }

    return (
        <>
            <Header fixed>
                <TopNav links={topNav} />
                <div className="ms-auto flex items-center space-x-4">
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>
            <main className="p-6 lg:p-10">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton />
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
                            <p className="text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/products/$productId/edit" params={{ productId: String(productId) }}>
                            <Button variant="outline">✏️ Edit</Button>
                        </Link>
                        <Button onClick={() => setIsEditStockOpen(true)}>📦 Adjust Stock</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Overview Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Category</span>
                                <span className="font-medium">{product.category?.name || "N/A"}</span>
                            </div>
                            {/* <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Unit</span>
                            <span className="font-medium">{product.unit.name} ({product.unit.symbol})</span>
                        </div> */}
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Status</span>
                                <span
                                    className={`px-2 py-0.5 rounded text-xs font-semibold ${product.is_active
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                        }`}
                                >
                                    {product.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <div className="pt-2">
                                <span className="text-gray-500 block mb-1">Description</span>
                                <p className="text-sm text-gray-700">{product.description || "No description provided."}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Cost Price</span>
                                <span className="font-medium">{product.cost.toFixed(2)} {currency}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Selling Price</span>
                                <span className="font-medium text-blue-600">{product.price.toFixed(2)} {currency}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Purchase Tax</span>
                                <span className="font-medium">{product.purchase_tax}%</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Sales Tax</span>
                                <span className="font-medium">{product.sales_tax}%</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Stock Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Current Stock</span>
                                <span className="text-2xl font-bold">{product.stock_quantity}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Min. Alert Level</span>
                                <span className="font-medium text-red-600">{product.min_stock_level}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Max. Stock Level</span>
                                <span className="font-medium text-blue-600">{product.max_stock_level}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stock Movement History */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Recent Stock Movements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={fetchedStockMovements?.data || []}
                            meta={{
                                page: page,
                                limit: limit,
                                total: fetchedStockMovements?.pagination?.total || 0,
                            }}
                            onPageChange={(newPage) => setPage(newPage)}
                        />
                    </CardContent>
                </Card>

                {/* Edit Stock Modal */}
                <EditStockForm
                    productId={id}
                    open={isEditStockOpen}
                    setOpen={setIsEditStockOpen}
                    refetchStockMovements={() => { /* stock movements query handles itself */ }}
                />
            </main>
        </>
    );
}
