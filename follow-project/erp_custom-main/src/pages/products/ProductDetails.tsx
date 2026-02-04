import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link, useParams } from "react-router";
import {
  useGetAllStockMovementsQuery,
  useGetProductByIdQuery,
} from "@/store/features/admin/productsApiService";
import type { Product, StockMovement } from "@/types/types";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { useState } from "react";
import EditStockForm from "@/components/products/EditStockForm";
import { useAppSelector } from "@/store/store";
import { BackButton } from "@/components/BackButton";

export default function ProductDetailsPage() {
  const [open, setOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;
  const productId = useParams().productId;

  const { data: fetchedProduct } = useGetProductByIdQuery(Number(productId), {
    skip: !productId,
  });

  const product: Product | undefined = fetchedProduct?.data;

  const currency = useAppSelector((state) => state.currency.value);

  const {
    data: fetchedStockMovements,
    refetch: refetchStockMovements,
    isFetching,
  } = useGetAllStockMovementsQuery(
    { id: Number(productId), page, limit, search },
    {
      skip: !productId,
    }
  );

  // console.log("Fetched Stock Movements: ", fetchedStockMovements);

  const columns: ColumnDef<StockMovement>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => {
        const dateStr = getValue<string>();
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(date.getDate()).padStart(2, "0")} ${String(
          date.getHours()
        ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      },
    },
    {
      accessorKey: "movement_type",
      header: "Movement Type",
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => row?.original?.quantity,
    },
    {
      accessorKey: "reference_type",
      header: "Reference Number",
      cell: ({ row }) => row.original.reference_type,
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => row.original.notes,
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Product: {product?.name}</h1>

        <div className="flex gap-3">
          <Link to={`/dashboard/products/${product?.id}/edit`}>
            <Button variant="outline-info">✏️ Edit</Button>
          </Link>
          <BackButton />
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="col-span-1 space-y-6">
          {/* Overview */}
          <Card className="py-6">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>SKU:</strong> {product?.sku}
              </p>
              <p>
                <strong>Category:</strong> {product?.category?.name}
              </p>
              <p className="flex items-center gap-2">
                <strong>Status:</strong>
                <Badge variant="outline" className="bg-gray-200 text-gray-700">
                  {product?.is_active ? "Active" : "Inactive"}
                </Badge>
              </p>
              <div className="flex flex-col gap-4">
                <strong>Product Image:</strong>
                <img
                  src={product?.thumb_url}
                  alt={product?.name}
                  className="w-20 h-20 rounded-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="py-6">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                <strong>Unit Price:</strong> {currency} {product?.price?.toFixed(2)}
              </p>
              <p>
                <strong>Cost Price:</strong> {currency} {product?.cost?.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Stock */}
          <Card className="py-6">
            <CardHeader>
              <CardTitle>Stock</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <p>
                <strong>InitialStock:</strong> {product?.initial_stock}{" "}
                {product?.unit?.name}
              </p>
              <p>
                <strong>Stock:</strong> {product?.stock_quantity}{" "}
                {product?.unit?.name}
              </p>
              <p>
                <strong>Min:</strong> {product?.min_stock_level} &nbsp; | &nbsp;
                <strong>Max:</strong> {product?.max_stock_level}
              </p>

              <Separator />

              <div className="flex justify-center">
                <EditStockForm
                  productId={Number(productId)}
                  open={open}
                  setOpen={setOpen}
                  refetchStockMovements={refetchStockMovements}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Recent Stock Movements */}
          <Card className="py-6">
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={fetchedStockMovements?.data}
                pageIndex={page - 1}
                pageSize={limit}
                totalCount={fetchedStockMovements?.pagination?.total ?? 0}
                search={search}
                onSearch={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                isFetching={isFetching}
              />
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="py-6">
            <CardHeader>
              <CardTitle>Recent Orders Containing This Product</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              No recent orders for this product.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
