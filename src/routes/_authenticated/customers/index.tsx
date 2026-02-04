import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from "@/components/layout/header"
import { TopNav } from "@/components/layout/top-nav"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Search } from "@/components/search"
import { ThemeSwitch } from "@/components/theme-switch"
import { ConfigDrawer } from "@/components/config-drawer"
import { topNav } from "@/data/data"
import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    useDeleteCustomerMutation,
    useGetAllCustomersQuery,
    type Customer
} from "@/features/customers/api/queries";
import type { ColumnDef } from "@tanstack/react-table";
import {
    Edit,
    Trash2,
    Users,
    UserCheck,
    UserPlus,
    User,
    MoreHorizontal,
    Eye,
    DollarSign,
    PackagePlus,
    MapPin,
} from "lucide-react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

export const Route = createFileRoute('/_authenticated/customers/')({
    component: CustomersList,
})

function CustomersList() {
    //const navigate = useNavigate();
    const [page, setPage] = useState<number>(1);
    const [search, setSearch] = useState<string>("");
    const limit = 10;

    const { data: customersData, isLoading } = useGetAllCustomersQuery({ search, page, limit });
    const { mutate: deleteCustomer, isPending: isDeleting } = useDeleteCustomerMutation();

    // Fetch all for stats (simplified frontend calculation)
    const { data: allCustomersData } = useGetAllCustomersQuery({ limit: 1000 });
    const allCustomers: Customer[] = allCustomersData?.data || [];

    const totalCustomers = customersData?.pagination?.total || 0;
    const activeCustomers = allCustomers.filter(c => c.is_active).length;
    // New Customers logic effectively is just total for now without date filtering
    const newCustomers = allCustomers.length;

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
        // We don't have revenue data yet, simplified
        {
            label: "Total Revenue",
            value: "RM 0.00",
            gradient: "from-amber-600 to-amber-400",
            shadow: "shadow-amber-500/30",
            icon: <DollarSign className="w-6 h-6 text-white" />,
        },
        {
            label: "New Customers",
            value: newCustomers, // Placeholder logic
            gradient: "from-violet-600 to-violet-400",
            shadow: "shadow-violet-500/30",
            icon: <UserPlus className="w-6 h-6 text-white" />,
        },
    ];

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [previewData, setPreviewData] = useState<{
        images: string[];
        index: number;
    } | null>(null);

    const handleDelete = () => {
        if (!deleteId) return;

        deleteCustomer(deleteId, {
            onSuccess: () => {
                toast.success("Customer deleted successfully");
                setDeleteId(null);
            },
            onError: () => {
                toast.error("Failed to delete customer");
            }
        });
    };

    const customerColumns: ColumnDef<Customer>[] = [
        {
            accessorKey: "id",
            header: "ID",
            meta: { className: "md:sticky md:left-0 z-20 bg-background min-w-[60px]" } as any
        },
        {
            accessorKey: "name",
            header: "Name",
            meta: { className: "md:sticky md:left-[60px] z-20 bg-background md:shadow-[4px_0px_5px_-2px_rgba(0,0,0,0.1)]" } as any,
            cell: ({ row }) => (
                <Link to="/customers/$id" params={{ id: row.original.id.toString() }} className="font-medium hover:underline">
                    {row.original.name}
                </Link>
            )
        },
        {
            accessorKey: "thumb_url",
            header: "Image",
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
                                                images: [thumbUrl || "", ...gallery].filter(Boolean) as string[],
                                                index: (thumbUrl ? 1 : 0) + i,
                                            })
                                        }
                                    />
                                ))}
                                {gallery.length > 3 && (
                                    <div
                                        className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium cursor-pointer"
                                        onClick={() =>
                                            setPreviewData({
                                                images: [thumbUrl || "", ...gallery].filter(Boolean) as string[],
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
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "phone",
            header: "Phone",
        },
        {
            accessorKey: "address",
            header: "Address",
            cell: ({ row }) => {
                const customer = row.original;
                const parts = [customer.address, customer.city, customer.state].filter(Boolean);
                return parts.length > 0 ? parts.join(", ") : "-";
            },
        },
        {
            accessorKey: "customer_type",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("customer_type") as string;
                return <Badge variant={type === 'business' ? 'default' : 'secondary'} className="capitalize">{type || 'individual'}</Badge>;
            }
        },
        {
            accessorKey: "credit_limit",
            header: "Credit Limit",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("credit_limit") as string || "0");
                return <div className="font-medium">{new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount)}</div>;
            }
        },
        {
            accessorKey: "outstanding_balance",
            header: "Balance",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("outstanding_balance") as string || "0");
                return <div className={amount > 0 ? "text-red-500 font-medium" : "text-green-600 font-medium"}>{new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount)}</div>;
            }
        },
        {
            id: "location",
            header: "Location",
            cell: ({ row }) => {
                const lat = row.original.latitude;
                const lng = row.original.longitude;

                if (!lat && !lng) return <span className="text-muted-foreground">-</span>;

                return (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        title="View on Maps"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank')}
                    >
                        <MapPin className="h-4 w-4" />
                    </Button>
                );
            }
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("is_active") as boolean;
                const color = status ? "bg-green-600" : "bg-red-600";
                return <Badge className={`${color} text-white`}>{status ? "Active" : "Inactive"}</Badge>;
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
                                <Link to="/customers/$id" params={{ id: id.toString() }} className="flex items-center cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to="/customers/$id/edit" params={{ id: id.toString() }} className="flex items-center cursor-pointer">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setDeleteId(id)}
                                className="flex items-center text-destructive focus:text-destructive cursor-pointer"
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
                <div className="w-full space-y-6 max-w-7xl mx-auto">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <h2 className="text-3xl font-semibold">Customer Management</h2>
                        <div className="flex gap-4">
                            <Link to="/customers/create">
                                <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
                                    <PackagePlus size={18} />
                                    Add Customer
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
                            <CardTitle>All Customers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-32 flex items-center justify-center">Loading...</div>
                            ) : (
                                <div className="max-w-full overflow-hidden">
                                    <DataTable
                                        columns={customerColumns}
                                        data={customersData?.data || []}
                                        meta={{
                                            page: page,
                                            limit: limit,
                                            total: customersData?.pagination?.total || 0
                                        }}
                                        onPageChange={setPage}
                                        search={search}
                                        onSearchChange={(val) => {
                                            setSearch(val);
                                            setPage(1);
                                        }}
                                    />
                                </div>
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
                                    customer and remove their data.
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

                    {/* Image Preview Dialog */}
                    <Dialog
                        open={!!previewData}
                        onOpenChange={(open) => !open && setPreviewData(null)}
                    >
                        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                            <div className="relative flex items-center justify-center w-full h-full">
                                {previewData && (
                                    <>
                                        <img
                                            src={previewData.images[previewData.index]}
                                            alt="Customer Preview"
                                            className="max-w-full max-h-[85vh] rounded-lg object-contain shadow-2xl"
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
                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
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
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
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
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-md font-medium">
                                                {previewData.index + 1} / {previewData.images.length}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </main>
        </>
    );
}

export default CustomersList;
