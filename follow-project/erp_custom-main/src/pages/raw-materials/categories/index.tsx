import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/components/DataTable";
import AddRawMaterialCategoryForm from "@/components/raw-materials/AddRawMaterialCategoryForm";
import EditRawMaterialCategoryForm from "@/components/raw-materials/EditRawMaterialCategoryForm";
import { toast } from "sonner";
import {
  useGetAllRawMaterialCategoriesQuery,
  useDeleteRawMaterialCategoryMutation,
} from "@/store/features/admin/rawMaterialApiService";

interface RawMaterialCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export default function RawMaterialCategoriesPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openEditForm, setOpenEditForm] = useState<boolean>(false);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;

  const { data: fetchedCategories, isFetching, refetch } = useGetAllRawMaterialCategoriesQuery({
    page,
    limit,
    search,
  });

  const categories: RawMaterialCategory[] = fetchedCategories?.data || [];
  const pagination = fetchedCategories?.pagination ?? {
    total: 0,
    page: 1,
    limit: 10,
    totalPage: 1,
  };

  const [deleteCategory] = useDeleteRawMaterialCategoryMutation();

  const handleDeleteCategory = async (id: number) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast("Are you sure you want to delete this category?", {
        action: {
          label: "Delete",
          onClick: () => resolve(true),
        },
        duration: 10000,
      });

      setTimeout(() => resolve(false), 10000);
    });

    if (!confirmed) return;

    try {
      const res = await deleteCategory(id).unwrap();
      if (res.status) {
        toast.success("Category deleted successfully");
        refetch();
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(
        "Failed to delete category" +
          (error instanceof Error ? ": " + error.message : "")
      );
    }
  };

  const categoryColumns: ColumnDef<RawMaterialCategory>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "Category",
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
            className={`px-2 py-1 text-xs rounded-full font-medium ${
              isActive
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
        const id = row.original.id;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => {
                setCategoryId(id);
                setOpenEditForm(true);
              }}
            >
              Edit
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteCategory(id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header and Add Category Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Raw Material Categories</h1>
        <Button onClick={() => setSheetOpen(true)}>+ Add Category</Button>
      </div>

      {/* Add Form */}
      <AddRawMaterialCategoryForm open={sheetOpen} setOpen={setSheetOpen} />

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
      <EditRawMaterialCategoryForm
        open={openEditForm}
        setOpen={setOpenEditForm}
        categoryId={categoryId}
        onSuccess={refetch}
      />
    </div>
  );
}
