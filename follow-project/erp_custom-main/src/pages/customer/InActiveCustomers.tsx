/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataTable } from "@/components/dashboard/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Users,
  UserCheck,
  DollarSign,
  UserPlus,
  PackagePlus,
  MapPin,
  Trash2,
  User,
  MoreHorizontal,
  Edit,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Link } from "react-router";
import {
  useDeleteCustomerMutation,
  useGetCustomerStatsQuery,
  useGetInactiveCustomersQuery,
} from "@/store/features/customers/customersApi";
import type { Customer } from "@/store/features/customers/types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppSelector } from "@/store/store";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import { MapEmbed } from "@/components/MapEmbed";

export default function InActiveCustomersList() {
  const [pageIndex, setPageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [mapLocation, setMapLocation] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  const pageSize = 10;
  const currentPage = pageIndex + 1;

  const currency = useAppSelector((state) => state.currency.value);

  // Fetch customers with pagination and search
  const { data, isLoading, error } = useGetInactiveCustomersQuery({
    page: currentPage,
    limit: pageSize,
    search: searchTerm || undefined,

  });

  const [deleteCustomer, { isLoading: isDeleting }] =
    useDeleteCustomerMutation();

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteCustomer(deleteId).unwrap();
      toast.success("Customer deleted successfully");
      setDeleteId(null);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error("Failed to delete customer");
    }
  };

  const customers = data?.data || [];
  // const totalPages = data?.pagination.totalPage || 1;
  const totalCustomers = data?.pagination.total || 0;

  // Calculate stats from customers

  const { data: customerStats } = useGetCustomerStatsQuery(undefined);

  const activeCustomers = customerStats?.data?.filter(
    (c: { label: string; value: number }) => c.label === "Active Customers"
  )?.[0]?.value || 0;

  console.log("activeCustomers", activeCustomers);

  const totalRevenue = customerStats?.data?.filter(
    (c: { label: string; value: number }) => c.label === "Total Revenue"
  )?.[0]?.value || 0;

  const totalNewCustomers = customerStats?.data?.filter(
    (c: { label: string; value: number }) => c.label === "New Customers"
  )?.[0]?.value || 0;

  const stats = [
    {
      label: "Active Customers",
      value: activeCustomers,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <UserCheck className="w-6 h-6 text-white" />,
    },
    {
      label: "Total Customers",
      value: totalCustomers,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <Users className="w-6 h-6 text-white" />,
    },
    {
      label: "Total Revenue",
      value: `${currency} ${totalRevenue?.toLocaleString() || 0}`,
      gradient: "from-amber-600 to-amber-400",
      shadow: "shadow-amber-500/30",
      icon: <DollarSign className="w-6 h-6 text-white" />,
    },
    {
      label: "New Customers",
      value: totalNewCustomers,
      gradient: "from-violet-600 to-violet-400",
      shadow: "shadow-violet-500/30",
      icon: <UserPlus className="w-6 h-6 text-white" />,
    },
  ];


  const customerColumns: ColumnDef<Customer>[] = [
    {
      accessorKey: "id",
      header: "ID",
      meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[60px]" } as any
    },
    {
      accessorKey: "name",
      header: "Name",
      meta: { className: "md:sticky md:left-[60px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any
    },
    {
      accessorKey: "thumb_url", header: "Image",
      cell: ({ row }) => {
        const thumbUrl = row.getValue("thumb_url") as string;
        const galleryItems = row.original.gallery_items || [];
        return thumbUrl ? (
          <img
            src={thumbUrl}
            alt="Customer"
            className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() =>
              setPreviewData({
                images: [thumbUrl, ...galleryItems].filter(Boolean),
                index: 0,
              })
            }
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
        );
      },
    },
    {
      accessorKey: "gallery_items",
      header: "Gallery",
      cell: ({ row }) => {
        const gallery = row.original.gallery_items || [];
        const thumbUrl = row.original.thumb_url;

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
                        images: [thumbUrl, ...gallery].filter(Boolean) as string[],
                        index: i + 1, // +1 because thumbUrl is at index 0
                      })
                    }
                  />
                ))}
                {gallery.length > 3 && (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium cursor-pointer"
                    onClick={() =>
                      setPreviewData({
                        images: [thumbUrl, ...gallery].filter(Boolean) as string[],
                        index: 4, // 1 thumbnail + 3 gallery items displayed
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
      accessorKey: "customer_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("customer_type") as string;
        return type === "business" ? "Business" : "Individual";
      },
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => {
        const customer = row.original;
        const parts = [customer.address, customer.city, customer.state].filter(
          Boolean
        );
        return parts.join(", ") || "-";
      },
    },
    {
      accessorKey: "credit_limit",
      header: () => (
        <div className="text-right">Credit Limit ({currency})</div>
      ),
      cell: ({ row }) => {
        const limit = row.getValue("credit_limit") as number;
        return (
          <div className="text-right">
            {limit ? `${Number(limit).toFixed(2)}` : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "outstanding_balance",
      header: () => <div className="text-right">Balance ({currency})</div>,
      cell: ({ row }) => {
        const balance = row.getValue("outstanding_balance") as number;
        return (
          <div className="text-right">
            {balance ? Number(balance).toFixed(2) : "0.00"}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        const variant = isActive ? "success" : "destructive";
        return (
          <Badge variant={variant} className="text-white">
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const { latitude, longitude, address, city, state, country } = row.original;
        const hasLocation = (latitude && longitude) || address;

        const handleMapClick = () => {
          let query = "";
          if (latitude && longitude) {
            query = `${latitude},${longitude}`;
          } else {
            query = [address, city, state, country].filter(Boolean).join(", ");
          }
          if (query) setMapLocation(query);
        };

        if (!hasLocation) return <span className="text-muted-foreground">-</span>;

        return (
          <Button variant="ghost" size="icon" onClick={handleMapClick}>
            <MapPin className="h-4 w-4 text-primary" />
          </Button>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const id = row.original.id;

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
              <DropdownMenuItem asChild>
                <Link to={`/dashboard/customers/${id}/edit`} className="flex items-center">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/dashboard/customers/${id}`} className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteId(id)}
                className="flex items-center text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="text-red-600">
          Error loading customers. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-3xl font-semibold">Inactive Customers</h2>

        <div className="flex flex-wrap items-center gap-4">
          <Link to="/dashboard/customers/create">
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
              <PackagePlus size={18} />
              Add Customer
            </button>
          </Link>

          <Link to="/dashboard/customers/map">
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-green-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-green-500/40 active:translate-y-0 active:shadow-none">
              <MapPin size={18} />
              Customer Map
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-6 mb-6">
        {stats?.map((item, idx) => (
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
          <CardTitle>Inactive Customers</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto w-full">
          {isLoading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : (
            <DataTable
              columns={customerColumns}
              data={customers}
              pageIndex={pageIndex}
              pageSize={pageSize}
              totalCount={totalCustomers}
              onPageChange={setPageIndex}
              onSearch={(value) => {
                setSearchTerm(value);
              }}
              isFetching={isLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              customer and remove their data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                  alt="Customer Preview"
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
      <Dialog
        open={!!mapLocation}
        onOpenChange={(open) => !open && setMapLocation(null)}
      >
        <DialogContent className="sm:max-w-[700px] p-5 overflow-hidden bg-white">
          <div className="w-full h-[450px]">
            {mapLocation && (
              <MapEmbed location={mapLocation} width={700} height={450} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
