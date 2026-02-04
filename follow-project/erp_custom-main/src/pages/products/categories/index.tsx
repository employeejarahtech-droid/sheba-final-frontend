/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/components/DataTable";

import AddProductCategoryForm from "@/components/products/AddProductCategoryForm";
import EditProductCategoryForm from "@/components/products/EditProductCategoryForm";
import type { Category } from "@/types/types";
import {
  useDeleteCategoryMutation,
  useGetAllCategoriesQuery,
} from "@/store/features/admin/productsApiService";
import { useAppSelector } from "@/store/store";
import { ProductPermission, SuperAdminPermission } from "@/config/permissions";
import { CheckCircle, Layers, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function CategoryPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openEditForm, setOpenEditForm] = useState<boolean>(false);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;
  const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);
  const canDeleteCategory =
    userPermissions.includes(ProductPermission.DELETE_CATEGORIES) ||
    userPermissions.includes(SuperAdminPermission.ACCESS_ALL);

  // Main query for table (paginated)
  const { data: fetchedCategories, isFetching } = useGetAllCategoriesQuery({
    page,
    limit,
    search,
  });

  // Secondary query for stats (fetch more to calculate active/inactive)
  // Note: This is a frontend approximation. ideally backend should provide stats.
  const { data: allCategoriesData } = useGetAllCategoriesQuery({ limit: 1000 });
  const allCategories = allCategoriesData?.data || [];

  const totalCategories = fetchedCategories?.pagination?.total || 0;
  const activeCategories = allCategories.filter((c) => c.is_active).length;
  const inactiveCategories = allCategories.filter((c) => !c.is_active).length;

  const stats = [
    {
      label: "Total Categories",
      value: totalCategories,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <Layers className="w-6 h-6 text-white" />,
    },
    {
      label: "Active Categories",
      value: activeCategories,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <CheckCircle className="w-6 h-6 text-white" />,
    },
    {
      label: "Inactive Categories",
      value: inactiveCategories,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <XCircle className="w-6 h-6 text-white" />,
    },
  ];

  const categories: Category[] = fetchedCategories?.data || [];
  const pagination = fetchedCategories?.pagination ?? {
    total: 0,
    page: 1,
    limit: 10,
    totalPage: 1,
  };

  const [deleteCategory] = useDeleteCategoryMutation();
  const handleDeleteCategory = async (id: number) => {
    // Check permission first
    if (!canDeleteCategory) {
      toast.error("You do not have permission to delete categories.");
      return;
    }

    // Ask for confirmation using a simple toast with prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      toast("Are you sure you want to delete this category?", {
        action: {
          label: "Delete",
          onClick: () => resolve(true), // user confirmed
        },
        duration: 10000, // auto-dismiss after 5s
      });

      // resolve false if toast disappears automatically
      setTimeout(() => resolve(false), 10000);
    });

    console.log("User confirmed deletion: ", confirmed);

    if (!confirmed) return; // stop if user didn’t confirm

    try {
      const res = await deleteCategory(id).unwrap();
      if (res.status) {
        toast.success("Category deleted successfully");
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error?.data?.message || "Failed to delete category");
    }
  };


  // Define columns for DataTable
  const categoryColumns: ColumnDef<Category>[] = [
    {
      accessorKey: "id",
      header: "ID",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[60px]" } as any,
    },
    {
      accessorKey: "name",
      header: "Category",
      meta: { className: "md:sticky md:left-[60px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
    },
    {
      accessorKey: "description",
      header: "Description",
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
        const categoryId = row.original.id;

        return (
          <div className="flex items-center gap-2">

            <Button
              variant="success"
              size="sm"
              onClick={() => {
                setCategoryId(categoryId);
                setOpenEditForm(true);
              }}
            >
              Edit
            </Button>


            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteCategory(categoryId)}

            >
              Delete
            </Button>


          </div>
        );
      },
    },
  ];


  return (
    <div className="space-y-6">
      {/* Header and Add Category Button */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">Product Categories</h1>
        {/* Add Category form */}
        <AddProductCategoryForm open={sheetOpen} setOpen={setSheetOpen} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* ShadCN DataTable */}
      <DataTable
        columns={categoryColumns}
        data={categories}
        pageIndex={page - 1}
        pageSize={limit}
        totalCount={pagination.total}
        onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        isFetching={isFetching}
      />
      {/* Edit category form */}
      <EditProductCategoryForm
        open={openEditForm}
        setOpen={setOpenEditForm}
        categoryId={categoryId}
      />
    </div>
  );
}
