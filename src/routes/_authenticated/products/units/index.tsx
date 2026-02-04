/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { createFileRoute } from "@tanstack/react-router";

import AddProductUnitForm from "@/features/products/units/AddProductUnitForm";
import { CheckCircle, Layers, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useUnits, useAllUnits, useDeleteUnit } from "@/features/products/api/unitQueries";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { topNav } from "@/data/data";
import { DataTable } from "@/components/DataTable";
import { Unit } from "@/types/types";
import EditProductUnitForm from "@/features/products/units/EditProductUnitForm";

export const Route = createFileRoute("/_authenticated/products/units/")({
    component: UnitsPage,
});

function UnitsPage() {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [openEditForm, setOpenEditForm] = useState<boolean>(false);
    const [unitId, setUnitId] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [search, setSearch] = useState<string>("");
    const limit = 10;

    // Main query for table (paginated)
    const { data: fetchedUnits } = useUnits({
        page,
        limit,
        search,
    });

    // Secondary query for stats (fetch all to calculate active/inactive)
    const { data: allUnitsData } = useAllUnits();
    const allUnits = allUnitsData?.data || [];

    const totalUnits = fetchedUnits?.pagination?.total || 0;
    const activeUnits = allUnits.filter((u: Unit) => u.is_active).length;
    const inactiveUnits = allUnits.filter((u: Unit) => !u.is_active).length;

    const stats = [
        {
            label: "Total Units",
            value: totalUnits,
            gradient: "from-blue-600 to-blue-400",
            shadow: "shadow-blue-500/30",
            icon: <Layers className="w-6 h-6 text-white" />,
        },
        {
            label: "Active Units",
            value: activeUnits,
            gradient: "from-emerald-600 to-emerald-400",
            shadow: "shadow-emerald-500/30",
            icon: <CheckCircle className="w-6 h-6 text-white" />,
        },
        {
            label: "Inactive Units",
            value: inactiveUnits,
            gradient: "from-rose-600 to-rose-400",
            shadow: "shadow-rose-500/30",
            icon: <XCircle className="w-6 h-6 text-white" />,
        },
    ];

    const units: Unit[] = fetchedUnits?.data || [];
    const pagination = fetchedUnits?.pagination ?? {
        total: 0,
        page: 1,
        limit: 10,
        totalPage: 1,
    };

    const { mutate: deleteUnit } = useDeleteUnit();

    const handleDeleteUnit = async (id: number) => {
        // Ask for confirmation
        const confirmed = window.confirm("Are you sure you want to delete this unit?");

        if (!confirmed) return;

        deleteUnit(id, {
            onSuccess: (data) => {
                if (data.status) {
                    toast.success("Unit deleted successfully");
                } else {
                    toast.error("Failed to delete unit");
                }
            },
            onError: (error: any) => {
                console.error("Error deleting unit:", error);
                toast.error(error?.message || "Failed to delete unit");
            },
        });
    };

    // Define columns for DataTable
    const unitColumns: ColumnDef<Unit>[] = [
        {
            accessorKey: "id",
            header: "ID",
            meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[60px]" } as any,
        },
        {
            accessorKey: "name",
            header: "Unit Name",
            meta: { className: "md:sticky md:left-[60px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.original.is_active;

                return (
                    <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                    >
                        {isActive ? "Active" : "Inactive"}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => {
                const unitId = row.original.id;

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                                setUnitId(unitId);
                                setOpenEditForm(true);
                            }}
                        >
                            Edit
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUnit(unitId)}
                        >
                            Delete
                        </Button>
                    </div>
                );
            },
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
                {/* Header and Add Unit Button */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Product Units</h2>
                        <p className="text-muted-foreground">Manage measurement units for products</p>
                    </div>
                    {/* Add Unit form */}
                    <AddProductUnitForm open={sheetOpen} setOpen={setSheetOpen} />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {stats.map((item, idx) => (
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

                {/* DataTable */}
                <DataTable
                    columns={unitColumns}
                    data={units}
                    meta={{
                        page: page,
                        limit: limit,
                        total: pagination.total,
                    }}
                    onPageChange={(newPage) => setPage(newPage)}
                    onSearchChange={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                />
                {/* Edit unit form */}
                <EditProductUnitForm
                    open={openEditForm}
                    setOpen={setOpenEditForm}
                    unitId={unitId}
                />
            </main>
        </>
    );
}
