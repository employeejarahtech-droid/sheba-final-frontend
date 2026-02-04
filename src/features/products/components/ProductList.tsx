"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
    MoreHorizontal,
    Plus,
    Search as SearchIcon,
    AlertTriangle,
    Boxes,
    PackagePlus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";

import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import type { Product } from "@/types/types";
import { useProducts, useProductStats, useDeleteProduct } from "../api/queries";
import EditStockForm from "@/components/products/EditStockForm";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { topNav } from "@/data/data";

// --- COLUMN DEFINITION ---

export const columns = (
    currency: string,
    handleDelete: (id: number) => void,
    setEditingStockProduct: (id: number | null) => void
): ColumnDef<Product>[] => [
        {
            accessorKey: "image",
            header: "Image",
            cell: ({ row }) => (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
                    <img
                        src={row.original.thumb_url || "https://placehold.co/150"}
                        alt={row.original.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                </div>
            ),
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {row.original.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{row.original.sku}</span>
                </div>
            ),
        },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                    {row.original.category?.name || "Uncategorized"}
                </span>
            ),
        },
        {
            accessorKey: "price",
            header: `Price (${currency})`,
            cell: ({ row }) => (
                <span className="font-medium text-gray-900 dark:text-gray-100">
                    {row.original.price.toFixed(2)}
                </span>
            ),
        },
        {
            accessorKey: "stock_quantity",
            header: "Stock",
            cell: ({ row }) => {
                const stock = row.original.stock_quantity;
                const minStock = row.original.min_stock_level;
                const isLow = stock <= minStock;

                return (
                    <div className="flex items-center gap-2">
                        <span
                            className={`font-semibold ${isLow ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                }`}
                        >
                            {stock}
                        </span>
                        {isLow && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.is_active
                        ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900"
                        : "bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                        }`}
                >
                    {row.original.is_active ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            accessorKey: "actions",
            header: "Actions", // Changed from "" to "Actions" for clarity
            cell: ({ row }) => {
                const product = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link to={`/products/$productId`} params={{ productId: String(product.id) }} className="w-full cursor-pointer">
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to={`/products/$productId/edit`} params={{ productId: String(product.id) }} className="w-full cursor-pointer">
                                    Edit Product
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setEditingStockProduct(product.id)}
                                className="cursor-pointer"
                            >
                                Update Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

export default function ProductList() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;
    // Simple currency constant - replace with your preferred currency
    const currency = "$";

    const { data: fetchedProducts } = useProducts({ page, limit, search });
    const { data: stats } = useProductStats();
    const { mutate: deleteProduct } = useDeleteProduct();

    const products: Product[] = fetchedProducts?.data || [];
    const pagination = fetchedProducts?.pagination ?? {
        total: 0,
        per_page: limit,
        current_page: 1,
        last_page: 1,
    };

    const [editingStockProduct, setEditingStockProduct] = useState<number | null>(null);

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this product?")) {
            deleteProduct(id, {
                onSuccess: () => toast.success("Product deleted successfully"),
                onError: () => toast.error("Failed to delete product"),
            });
        }
    };

    const productColumns = columns(currency, handleDelete, setEditingStockProduct);

    const statCards = [
        {
            label: "Total Products",
            value: stats?.totalProducts || 0,
            gradient: "from-blue-600 to-blue-400",
            shadow: "shadow-blue-500/30",
            icon: <PackagePlus className="w-6 h-6 text-white" />,
        },
        {
            label: "Low Stock",
            value: stats?.lowStockCount || 0,
            gradient: "from-rose-600 to-rose-400",
            shadow: "shadow-rose-500/30",
            icon: <AlertTriangle className="w-6 h-6 text-white" />,
        },
        {
            label: "Total Stock",
            value: stats?.totalStockCount || 0,
            gradient: "from-cyan-600 to-cyan-400",
            shadow: "shadow-cyan-500/30",
            icon: <Boxes className="w-6 h-6 text-white" />,
        },
    ];

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
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
                        <p className="text-muted-foreground">
                            Manage your inventory and product catalog
                        </p>
                    </div>
                    <Link to="/products/create">
                        <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {statCards.map((item, idx) => (
                        <div
                            key={idx}
                            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
                        >
                            {/* Background Pattern */}
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

                            <div className="relative flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/90">{item.label}</p>
                                    <h3 className="mt-2 text-3xl font-bold text-white">
                                        {item.value}
                                    </h3>
                                </div>
                                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                    {item.icon}
                                </div>
                            </div>

                            {/* Progress/Indicator line (optional visual flair) */}
                            <div className="mt-4 h-1 w-full rounded-full bg-black/10">
                                <div className="h-full w-2/3 rounded-full bg-white/40" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="pl-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 focus:ring-blue-500 transition-all duration-300"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            columns={productColumns}
                            data={products}
                            meta={{
                                page: page,
                                limit: limit,
                                total: pagination.total,
                            }}
                            onPageChange={(newPageIndex) => setPage(newPageIndex)} // Corrected: removed +1/-1 logic if DataTable handles 1-based index or just passes raw number
                            search={search}
                            onSearchChange={(value) => {
                                setSearch(value);
                                setPage(1);
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Edit Stock Dialog */}
                {editingStockProduct && (
                    <EditStockForm
                        productId={editingStockProduct}
                        open={!!editingStockProduct}
                        setOpen={(v) => !v && setEditingStockProduct(null)}
                        refetchStockMovements={() => { }} // No-op for now unless we add stock movement query here
                    />
                )}
            </main>
        </>
    );
}
