/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataTable } from "@/components/dashboard/components/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
//import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import {
  // AlertCircle,
  AlertTriangle,
  Boxes,
  CheckCircle,
  Eye,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Tags,
  Trash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import type { Product } from "@/types/types";
import { useState } from "react";
import {
  useDeleteProductMutation,
  useGetAllProductsQuery,
  useGetProductStatsQuery,
} from "@/store/features/admin/productsApiService";
import { toast } from "sonner";
import { useAppSelector } from "@/store/store";
import { selectCurrency } from "@/store/currencySlice";
// import { ProductPermission } from "@/config/permissions";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function Products() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [previewData, setPreviewData] = useState<{
    images: string[];
    index: number;
  } | null>(null);
  const limit = 10;
  // const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);
  // const canCreateProduct = userPermissions.includes(ProductPermission.CREATE)|| userPermissions.includes(SuperAdminPermission.ACCESS_ALL);

  const { data: productStatsData } = useGetProductStatsQuery(undefined);

  //const productStats = productStatsData?.data;
  console.log("productStats", productStatsData);

  const totalProductsCount = productStatsData?.data?.filter(
    (p: { label: string; value: number }) => p.label === "Total Products"
  )?.[0]?.value || 0;

  const activeProductsCount = productStatsData?.data?.filter(
    (p: { label: string; value: number }) => p.label === "Active Products"
  )?.[0]?.value || 0;

  const lowStockCount = productStatsData?.data?.filter(
    (p: { label: string; value: number }) => p.label === "Low Stock"
  )?.[0]?.value || 0;

  const totalStockCount = productStatsData?.data?.filter(
    (p: { label: string; value: number }) => p.label === "Total Stock"
  )?.[0]?.value || 0;

  const stats = [
    {
      label: "Total Products",
      value: totalProductsCount,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <Boxes className="w-6 h-6 text-white" />,
    },
    {
      label: "Active Products",
      value: activeProductsCount,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <CheckCircle className="w-6 h-6 text-white" />,
    },
    {
      label: "Low Stock",
      value: lowStockCount,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <AlertTriangle className="w-6 h-6 text-white" />,
    },
    {
      label: "Total Stock",
      value: totalStockCount,
      gradient: "from-cyan-600 to-cyan-400",
      shadow: "shadow-cyan-500/30",
      icon: <Boxes className="w-6 h-6 text-white" />,
    },
  ];

  const {
    data: fetchedProducts,
    isFetching,
    refetch: refetchProducts,
  } = useGetAllProductsQuery({ page, limit, search });

  const products: Product[] = fetchedProducts?.data || [];
  //console.log("Fetched Products: ", fetchedProducts);
  const pagination = fetchedProducts?.pagination ?? {
    total: 0,
    page: 1,
    limit: 10,
    totalPage: 1,
  };

  const [deleteProduct] = useDeleteProductMutation();
  const handleDeleteProduct = async (id: number) => {
    // Ask for confirmation using a simple toast with prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      toast("Are you sure you want to delete this product?", {
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
      const res = await deleteProduct(id).unwrap();
      if (res.status) {
        toast.success("Product deleted successfully");
        refetchProducts();
      } else {
        toast.error("Failed to delete unit");
      }
    } catch (error: any) {
      console.error("Error deleting unit:", error);
      toast.error(error?.data?.message || "Failed to delete unit");
    }
  };

  const currency = useAppSelector(selectCurrency);

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
        <img
          src={row.original.thumb_url}
          alt={row.original.name}
          className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() =>
            setPreviewData({
              images: [
                row.original.thumb_url,
                ...(row.original.gallery_items || []),
              ].filter(Boolean),
              index: 0,
            })
          }
        />
      ),
    },
    {
      accessorKey: "gallery_items",
      header: "Gallery",
      cell: ({ row }) => {
        const gallery = row.original.gallery_items || [];
        return (
          <div className="flex items-center gap-1">
            {gallery.length > 0 ? (
              <div className="flex -space-x-2 overflow-hidden hover:space-x-1 transition-all duration-300 p-1">
                {gallery.slice(0, 3).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Gallery ${i}`}
                    className="w-8 h-8 rounded-full border-2 border-background object-cover cursor-pointer hover:scale-110 transition-transform"
                    onClick={() =>
                      setPreviewData({
                        images: [
                          row.original.thumb_url,
                          ...(row.original.gallery_items || []),
                        ].filter(Boolean),
                        index: i + 1,
                      })
                    }
                  />
                ))}
                {gallery.length > 3 && (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium cursor-pointer"
                    onClick={() =>
                      setPreviewData({
                        images: [
                          row.original.thumb_url,
                          ...(row.original.gallery_items || []),
                        ].filter(Boolean),
                        index: 4,
                      })
                    }
                  >
                    +{gallery.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row?.original?.category?.name
    },
    {
      accessorKey: "cost",
      header: () => (
        <div className="text-right">
          Cost Price {currency ? `(${currency})` : ""}
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {parseFloat(row.getValue("cost")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: () => (
        <div className="text-right">
          Selling Price {currency ? `(${currency})` : ""}
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {parseFloat(row.getValue("price")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "purchase_tax",
      header: () => (
        <div className="text-right">
          Purchase Tax {currency ? `(${currency})` : ""}
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {parseFloat(row.getValue("purchase_tax")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "sales_tax",
      header: () => (
        <div className="text-right">
          Sales Tax {currency ? `(${currency})` : ""}
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {parseFloat(row.getValue("sales_tax")).toFixed(2)}
        </div>
      ),
    },
    // {
    //   accessorKey: "unit",
    //   header: "Unit",
    //   cell: ({ row }) =>
    //     `${row.original.unit.name} (${row.original.unit.symbol})`,
    // },
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
                  to={`/dashboard/products/${product.id}/edit`}
                  className="w-full flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link
                  to={`/dashboard/products/${product.id}`}
                  className="w-full flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteProduct(product.id)}
                className="cursor-pointer flex items-center gap-2"
              >
                <Trash className="w-4 h-4" />
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
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-3xl font-semibold">Product Management</h2>

        <div className="flex flex-wrap items-center gap-4">
          {/* <button className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-lg shadow-sm hover:bg-yellow-300">
            <AlertCircle size={18} />
            Stock Alerts
          </button> */}

          <Link to="/dashboard/products/categories">
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyan-500/40 active:translate-y-0 active:shadow-none">
              <Tags size={18} />
              Categories
            </button>
          </Link>

          <Link to="/dashboard/products/create">
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
              <PackagePlus size={18} />
              Add Product
            </button>
          </Link>


        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-6 mb-6">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className={`relative flex-1 min-w-[240px] overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
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
      <Card className="pt-6 pb-2">
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={productColumns}
            data={products}
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
        </CardContent>
      </Card>
      <Dialog
        open={!!previewData}
        onOpenChange={(open) => !open && setPreviewData(null)}
      >
        <DialogContent className="max-w-3xl p-5 overflow-hidden bg-white">
          <div className="relative flex items-center justify-center">
            {previewData && (
              <>
                <img
                  src={previewData.images[previewData.index]}
                  alt="Product Preview"
                  className="max-w-full max-h-[70vh] rounded-lg object-contain"
                />

                {/* Left Arrow (Previous) */}
                {previewData.images.length > 1 && (
                  <button
                    onClick={() =>
                      setPreviewData((prev) =>
                        prev
                          ? {
                            ...prev,
                            index:
                              prev.index === 0
                                ? prev.images.length - 1
                                : prev.index - 1,
                          }
                          : null
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                )}

                {/* Right Arrow (Next) */}
                {previewData.images.length > 1 && (
                  <button
                    onClick={() =>
                      setPreviewData((prev) =>
                        prev
                          ? {
                            ...prev,
                            index:
                              prev.index === prev.images.length - 1
                                ? 0
                                : prev.index + 1,
                          }
                          : null
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                )}

                {/* Counter */}
                {previewData.images.length > 1 && (
                  <div className="absolute bottom-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
                    {previewData.index + 1} / {previewData.images.length}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
