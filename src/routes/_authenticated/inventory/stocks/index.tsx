import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Package, AlertTriangle, XCircle, DollarSign } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
// import AddStockForm from "@/components/products/AddStockForm"; 
import { useProducts, type Product } from "@/features/products/api/queries";

import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { topNav } from "@/data/data";

export const Route = createFileRoute('/_authenticated/inventory/stocks/')({
    component: StockManagement,
})

export default function StockManagement() {
    const [openAddStockForm, setOpenAddStockForm] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [search, setSearch] = useState<string>("");
    const limit = 10;

    const {
        data: fetchedProducts,
    } = useProducts({ page, limit, search });

    const products: Product[] = (fetchedProducts?.data as unknown as Product[]) || [];

    const pagination = fetchedProducts?.pagination ?? {
        total: 0,
        per_page: 10,
        current_page: 1,
        last_page: 1,
        totalPage: 1
    };

    const currency = "BDT";

    const productColumns: ColumnDef<Product>[] = [
        {
            accessorKey: "sku",
            header: "SKU",
            meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[60px]" } as any
        },
        {
            accessorKey: "name",
            header: "Product Name",
            meta: { className: "md:sticky md:left-[60px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any
        },
        {
            accessorKey: "thumb_url",
            header: "Image",
            cell: ({ row }) => (
                row.original.thumb_url ? (
                    <img
                        src={row.original.thumb_url}
                        alt={row.original.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-500" />
                    </div>
                )
            ),
        },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => (row.original as any).category?.name || '-',
        },
        {
            accessorKey: "cost",
            header: () => (
                <div className="text-right">Cost Price ({currency})</div>
            ),
            cell: ({ row }) => (
                <div className="text-right">{Number(row.original.cost).toFixed(2)}</div>
            ),
        },
        {
            accessorKey: "price",
            header: () => (
                <div className="text-right">Selling Price ({currency})</div>
            ),
            cell: ({ row }) => (
                <div className="text-right">{Number(row.original.price).toFixed(2)}</div>
            ),
        },
        {
            accessorKey: "stock_quantity",
            header: () => <div className="text-right">Stock</div>,
            cell: ({ row }) => (
                <div className="text-right">{row.original.stock_quantity}</div>
            ),
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.is_active;
                const bgColor = status ? "bg-green-500" : "bg-red-500";
                return (
                    <span
                        className={`py-1 px-2 rounded-full text-xs text-white font-medium ${bgColor}`}
                    >
                        {status ? "Active" : "Inactive"}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const product = row.original;

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
                                <Link
                                    to="/products/$productId"
                                    params={{ productId: String(product.id) }}
                                    className="w-full"
                                >
                                    View Stock
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    // Calculate statistics
    const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0).length;
    const outOfStockProducts = products.filter(p => p.stock_quantity === 0).length;
    const totalStockValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.cost), 0);

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
                <div className="space-y-6">
                    {/* Page Header */}
                    <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                Stock Management
                            </h1>
                            <p className="text-muted-foreground mt-2">Monitor and manage product inventory</p>
                        </div>
                        {/* Placeholder button until AddStockForm is available */}
                        <Button onClick={() => setOpenAddStockForm(true)} disabled data-state={openAddStockForm ? 'open' : 'closed'}>
                            Add Stock (Coming Soon)
                        </Button>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Total Products */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 p-6 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                            {/* Background Pattern */}
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

                            <div className="relative flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/90">Total Products</p>
                                    <h3 className="mt-2 text-3xl font-bold text-white">
                                        {pagination.total}
                                    </h3>
                                </div>
                                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Low Stock */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 to-orange-400 p-6 shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

                            <div className="relative flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/90">Low Stock</p>
                                    <h3 className="mt-2 text-3xl font-bold text-white">
                                        {lowStockProducts}
                                    </h3>
                                </div>
                                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Out of Stock */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-400 p-6 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

                            <div className="relative flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/90">Out of Stock</p>
                                    <h3 className="mt-2 text-3xl font-bold text-white">
                                        {outOfStockProducts}
                                    </h3>
                                </div>
                                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                    <XCircle className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Total Stock Value */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-green-400 p-6 shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

                            <div className="relative flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/90">Total Stock Value</p>
                                    <h3 className="mt-2 text-3xl font-bold text-white">
                                        {currency} {totalStockValue.toFixed(2)}
                                    </h3>
                                </div>
                                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DataTable
                        columns={productColumns}
                        data={products}
                        meta={{
                            page,
                            limit,
                            total: pagination.total,
                        }}
                        onPageChange={(newPage) => setPage(newPage)}
                        search={search}
                        onSearchChange={(value) => {
                            setSearch(value);
                            setPage(1);
                        }}
                    />
                </div>
            </main>
        </>
    );
}
