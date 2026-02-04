import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from "@/components/layout/header"
import { TopNav } from "@/components/layout/top-nav"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Search as SearchIcon } from "@/components/search"
import { ThemeSwitch } from "@/components/theme-switch"
import { ConfigDrawer } from "@/components/config-drawer"
import { topNav } from "@/data/data"
import { Button } from "@/components/ui/button"
import { PlusCircle, Eye, Banknote, CheckCircle, Clock, XCircle } from "lucide-react"
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { useGetAllPurchasePaymentsQuery, PurchasePayment } from '@/features/purchase/api/purchaseQueries'

export const Route = createFileRoute('/_authenticated/purchase/payments/')({
    component: PurchasePayments,
})

function PurchasePayments() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const { data } = useGetAllPurchasePaymentsQuery({
        page,
        limit,
        search
    })

    const payments = data?.data || []
    const total = data?.pagination?.total || 0
    const currency = "MYR"

    // Stats calculations
    const stats = [
        {
            label: "Total Payments",
            value: total,
            gradient: "from-blue-600 to-blue-400",
            shadow: "shadow-blue-500/30",
            icon: <Banknote className="w-6 h-6 text-white" />,
        },
        {
            label: "Completed",
            value: payments.filter((p: PurchasePayment) => p.status === 'completed').length,
            gradient: "from-emerald-600 to-emerald-400",
            shadow: "shadow-emerald-500/30",
            icon: <CheckCircle className="w-6 h-6 text-white" />,
        },
        {
            label: "Pending",
            value: payments.filter((p: PurchasePayment) => p.status === 'pending').length,
            gradient: "from-amber-600 to-amber-400",
            shadow: "shadow-amber-500/30",
            icon: <Clock className="w-6 h-6 text-white" />,
        },
        {
            label: "Failed/Refunded",
            value: payments.filter((p: PurchasePayment) => p.status === 'failed').length,
            gradient: "from-rose-600 to-rose-400",
            shadow: "shadow-rose-500/30",
            icon: <XCircle className="w-6 h-6 text-white" />,
        },
    ]

    const columns: ColumnDef<PurchasePayment>[] = [
        {
            accessorKey: "id",
            header: "Payment #",
            cell: ({ row }) => <span className="font-medium">#{row.original.id}</span>,
        },
        {
            accessorKey: "purchase_order.po_number",
            header: "PO Number",
            cell: ({ row }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {row.original.purchase_order?.po_number ?? "N/A"}
                </span>
            ),
        },
        {
            accessorKey: "purchase_order.supplier.name",
            header: "Supplier",
            cell: ({ row }) => <span className="font-semibold">{row.original.purchase_order?.supplier?.name ?? "-"}</span>,
        },
        {
            id: "invoice_no",
            header: "Invoice No",
            cell: () => <span>-</span>,
        },
        {
            accessorKey: "payment_date",
            header: "Payment Date",
            cell: ({ row }) => new Date(row.original.payment_date).toLocaleDateString(),
        },
        {
            accessorKey: "payment_method",
            header: "Method",
            cell: ({ row }) => {
                const method = row.original.payment_method || ""
                const color =
                    method === "cash" ? "bg-emerald-500"
                        : method === "bank_transfer" ? "bg-blue-500"
                            : method === "credit_card" ? "bg-purple-500"
                                : "bg-gray-500"
                return (
                    <Badge className={`${color} text-white hover:${color} capitalize`}>
                        {method.replace(/_/g, " ")}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "amount",
            header: () => <div className="text-right">Amount ({currency})</div>,
            cell: ({ row }) => (
                <div className="text-right font-medium">
                    {row.original.amount.toFixed(2)}
                </div>
            ),
        },
        {
            accessorKey: "reference_number",
            header: "Reference",
            cell: ({ row }) => row.original.reference_number || "-",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                const color =
                    status === "completed" ? "bg-emerald-600"
                        : status === "pending" ? "bg-amber-500"
                            : "bg-rose-600"
                return (
                    <Badge className={`${color} text-white hover:${color} capitalize`}>
                        {status}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const payment = row.original
                return (
                    <div className="flex items-center gap-2">
                        <Link to={`/purchase/payments/$id`} params={{ id: String(payment.id) }}>
                            <Button size="sm" variant="outline" className="h-8">
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>
                        </Link>
                    </div>
                )
            },
        },
    ]

    return (
        <>
            <Header fixed>
                <TopNav links={topNav} />
                <div className="ms-auto flex items-center space-x-4">
                    <SearchIcon />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <main className="p-6 lg:p-10">
                <div className="w-full space-y-6">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                Purchase Payments
                            </h1>
                            <p className="text-muted-foreground mt-2">Manage your purchase payment records</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link to="/purchase/payments/create">
                                <Button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 font-semibold text-white shadow-lg shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/50">
                                    <PlusCircle className="w-5 h-5" />
                                    Record Payment
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {stats.map((item, idx) => (
                            <div
                                key={idx}
                                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
                            >
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

                                <div className="mt-4 h-1 w-full rounded-full bg-black/10">
                                    <div className="h-full w-2/3 rounded-full bg-white/40" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="border rounded-xl bg-card p-6 shadow-sm">
                        <DataTable
                            columns={columns}
                            data={payments}
                            meta={{
                                page,
                                limit,
                                total,
                            }}
                            onPageChange={(newPage) => setPage(newPage)}
                            search={search}
                            onSearchChange={(value) => {
                                setSearch(value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </main>
        </>
    )
}
