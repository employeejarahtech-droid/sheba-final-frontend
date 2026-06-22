import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useMemo, useState, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { FileText, DollarSign, TrendingUp, CreditCard } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'
import { Button } from '@/components/ui/button'
import { DateField } from '@/components/date-field'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface OutdoorAllCollectionsProps {
    page: number
    limit: number
    search: string
    from: string
    to: string
    setPage: (p: number) => void
    setLimit: (l: number) => void
    setSearch: (s: string) => void
    setFrom: (f: string) => void
    setTo: (t: string) => void
    scope?: 'all' | 'my' | 'user-wise'
    user?: string
    setUser?: (u: string) => void
}

export default function OutdoorAllCollections({
    page, limit, search, from, to,
    setPage, setSearch, setFrom, setTo,
    scope = 'all', user = 'all', setUser,
}: OutdoorAllCollectionsProps) {
    const token = getCookie('accessToken')
    const { currency, currencySymbol } = useCurrency()
    const { formatDate } = useDateFormat()
    const fmtNum = (v: any) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    // Users for the filter dropdown
    const { data: usersData } = useQuery({
        queryKey: ['outdoor-invoice-users'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/users`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch users')
            return res.json()
        },
        enabled: !!token,
    })
    const users = usersData?.data || []

    // Collections — 'my' = current user, 'all' = all users (optional user_id filter)
    const { data, isLoading } = useQuery({
        queryKey: ['outdoor-collections', scope, page, limit, search, user, from, to],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
            })
            const endpoint = scope === 'my'
                ? '/api/outdoor-invoice/my-outdoor-invoice/date-wise-collection'
                : '/api/outdoor-invoice/all-collection'
            if (scope === 'user-wise' && user && user !== 'all') params.append('user_id', user)
            if (from) params.append('start_date', from)
            if (to) params.append('end_date', to)
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}${endpoint}?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (!res.ok) throw new Error('Failed to fetch collections')
            return res.json()
        },
        enabled: !!token,
        placeholderData: (prev) =>
            prev
                ? prev
                : {
                    data: {
                        items: [],
                        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
                        stats: { total_collected: 0, payment_count: 0, total_bill: 0, total_discount: 0, invoice_count: 0 },
                    },
                },
    })

    const stats = useMemo(() => {
        const s = data?.data?.stats || {}
        return [
            { label: 'Total Payments', value: s.payment_count || 0, gradient: 'from-blue-600 to-blue-400', shadow: 'shadow-blue-500/30', icon: <CreditCard className="w-6 h-6 text-white" /> },
            { label: `Total Collected (${currencySymbol || currency})`, value: fmtNum(s.total_collected || 0), gradient: 'from-emerald-600 to-emerald-400', shadow: 'shadow-emerald-500/30', icon: <DollarSign className="w-6 h-6 text-white" /> },
            { label: `Total Discount (${currencySymbol || currency})`, value: fmtNum(s.total_discount || 0), gradient: 'from-orange-600 to-orange-400', shadow: 'shadow-orange-500/30', icon: <TrendingUp className="w-6 h-6 text-white" /> },
            { label: `Gross Bill (${currencySymbol || currency})`, value: fmtNum(s.total_bill || 0), gradient: 'from-purple-600 to-purple-400', shadow: 'shadow-purple-500/30', icon: <FileText className="w-6 h-6 text-white" /> },
        ]
    }, [data, currencySymbol, currency])

    // ---- Date filter presets (mirrors invoices list) ----
    const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
    const toYMD = (d: Date) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
    }
    const datePresets = useMemo(() => ({
        today: { from: toYMD(today()), to: toYMD(today()) },
        yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { from: toYMD(d), to: toYMD(d) }; })(),
        last7: (() => { const d = today(); d.setDate(d.getDate() - 6); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last15: (() => { const d = today(); d.setDate(d.getDate() - 14); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last30: (() => { const d = today(); d.setDate(d.getDate() - 29); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last45: (() => { const d = today(); d.setDate(d.getDate() - 44); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last60: (() => { const d = today(); d.setDate(d.getDate() - 59); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last90: (() => { const d = today(); d.setDate(d.getDate() - 89); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last180: (() => { const d = today(); d.setDate(d.getDate() - 179); return { from: toYMD(d), to: toYMD(today()) }; })(),
        last365: (() => { const d = today(); d.setDate(d.getDate() - 364); return { from: toYMD(d), to: toYMD(today()) }; })(),
    }), [])
    const activePreset = useMemo(() => {
        if (!from || !to) return 'custom'
        const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to)
        return match ? match[0] : 'custom'
    }, [from, to, datePresets])
    const [presetOpen, setPresetOpen] = useState(false)
    const applyPreset = (key: string) => {
        const p = (datePresets as any)[key]
        if (p) { setFrom(p.from); setTo(p.to) }
        setPresetOpen(false)
    }

    const fmtDateTime = (d: any) => {
        if (!d) return '-'
        const date = new Date(d)
        return `${formatDate(date)} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`
    }

    // View Details modal
    const [viewInvoiceId, setViewInvoiceId] = useState<number | null>(null)
    const { data: invoiceData } = useQuery({
        queryKey: ['invoice-detail', viewInvoiceId],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${viewInvoiceId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        enabled: !!token && viewInvoiceId !== null,
    })
    const invoice = invoiceData?.data
    useEffect(() => {
        const handler = (e: Event) => {
            const btn = (e.target as HTMLElement).closest('.view-details-btn')
            if (!btn) return
            const id = Number((btn as HTMLElement).dataset.id)
            if (id) setViewInvoiceId(id)
        }
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
    }, [])

    const columns = [
        { data: 'payment_id', title: 'Payment ID', orderable: true, responsivePriority: 1, defaultContent: '-' },
        { data: 'invoice_prefix', title: 'Invoice Number', orderable: true, responsivePriority: 1, render: (d: any) => `<span class="font-semibold text-purple-600">${d || '-'}</span>`, defaultContent: '-' },
        { data: 'created_at', title: 'Invoice Date & Time', orderable: true, responsivePriority: 4, render: (d: any) => fmtDateTime(d), defaultContent: '-' },
        { data: 'patient_name', title: 'Patient Name', orderable: true, responsivePriority: 1, defaultContent: '-' },
        { data: 'phone', title: 'Phone', orderable: true, className: 'dt-head-left dt-body-left', responsivePriority: 2, defaultContent: '-' },
        {
            data: null, title: 'Reference Doctor', orderable: false, responsivePriority: 3,
            render: (_d: any, _t: string, row: any) => row.doctor?.doctor_name || '-', defaultContent: '-',
        },
        {
            data: 'total_amount', title: `Bill Amount (${currencySymbol || currency})`, orderable: true, responsivePriority: 4,
            render: (d: any) => `<span class="font-medium text-gray-600">${fmtNum(d)}</span>`, defaultContent: '0',
        },
        {
            data: null, title: `Discount (${currencySymbol || currency})`, orderable: false, responsivePriority: 5,
            render: (_d: any, _t: string, row: any) => {
                const disc = Number(row.total_amount || 0) - Number(row.net_amount || 0)
                return disc > 0 ? `<span class="text-orange-600 font-medium">${fmtNum(disc)}</span>` : '<span class="text-gray-400">-</span>'
            }, defaultContent: '-',
        },
        {
            data: 'previous_paid', title: `Previous Paid (${currencySymbol || currency})`, orderable: false, responsivePriority: 5,
            render: (d: any) => `<span class="text-gray-600">${fmtNum(d)}</span>`, defaultContent: '0',
        },
        {
            data: 'due', title: `Due (${currencySymbol || currency})`, orderable: false, responsivePriority: 5,
            render: (d: any) => { const v = Number(d || 0); return `<span class="font-medium ${v > 0 ? 'text-red-600' : 'text-gray-500'}">${fmtNum(v)}</span>` }, defaultContent: '0',
        },
        {
            data: 'payment_amount', title: `New Collection (${currencySymbol || currency})`, orderable: true, responsivePriority: 2,
            render: (d: any) => `<span class="text-emerald-600 font-bold">${fmtNum(d)}</span>`, defaultContent: '0',
        },
        {
            data: 'balance', title: `Balance (${currencySymbol || currency})`, orderable: false, responsivePriority: 5,
            render: (d: any) => { const v = Number(d || 0); return `<span class="font-semibold ${v > 0 ? 'text-red-600' : 'text-emerald-600'}">${fmtNum(v)}</span>` }, defaultContent: '0',
        },
        {
            data: 'payment_method', title: 'Method', orderable: true, responsivePriority: 3,
            render: (d: any) => `<span class="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">${d || '-'}</span>`, defaultContent: '-',
        },
        {
            data: null, title: 'Collected By', orderable: false, responsivePriority: 3,
            render: (_d: any, _t: string, row: any) => `<span class="text-sm font-medium text-gray-700">${row.payment_created_by?.name || row.creator?.name || '-'}</span>`, defaultContent: '-',
        },
        {
            data: 'payment_created_at', title: 'Collected Date & Time', orderable: true, responsivePriority: 3,
            render: (d: any) => fmtDateTime(d), defaultContent: '-',
        },
        {
            data: null, title: 'Actions', orderable: false, responsivePriority: 1,
            render: (_d: any, _t: string, row: any) =>
                `<button class="view-details-btn inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-4 py-2" type="button" data-id="${row.id}">View Details</button>`,
            defaultContent: '',
        },
    ]

    // Build invoice detail HTML (same design as invoices list expand)
    const buildInvoiceDetailHTML = (inv: any) => {
        const totalDiscounts = inv.department_discounts?.reduce((s: number, d: any) => s + Number(d.discount || 0), 0) || 0
        const totalPayments = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount || 0), 0) || 0
        const dueAmount = Number(inv.net_amount || 0) - totalPayments
        const isPaid = dueAmount <= 0
        const statusBadge = isPaid
            ? '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600">Paid</span>'
            : '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">Unpaid</span>'

        const testsHTML = inv.selected_tests?.map((t: any, i: number) =>
            `<tr class="border-b"><td class="py-2 px-3 text-center">${i + 1}</td><td class="py-2 px-3">${t.test?.name || t.name || '-'}</td><td class="py-2 px-3 text-right">${fmtNum(t.price)}</td><td class="py-2 px-3 text-center">${t.department?.name || '-'}</td></tr>`
        ).join('') || ''

        const paymentsHTML = inv.payments?.map((p: any) =>
            `<tr class="border-b"><td class="py-2 px-3">${fmtDateTime(p.payment_date || p.created_at)}</td><td class="py-2 px-3">${p.method || p.payment_method || '-'}</td><td class="py-2 px-3 text-right text-emerald-600 font-medium">${fmtNum(p.amount)}</td></tr>`
        ).join('') || ''

        return `
        <div class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4 -mx-6 -mt-6 mb-4 rounded-t-lg">
            <h2 class="text-xl font-semibold">Invoice Details</h2>
            <p class="text-sm opacity-90">${inv.invoice_prefix || inv.id || ''} · ${fmtDateTime(inv.created_at)}</p>
        </div>
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm border-b pb-6 mb-4">
            <div><p class="text-gray-500">Invoice ID</p><p class="font-semibold text-gray-800">${inv.invoice_prefix || inv.id || '-'}</p></div>
            <div><p class="text-gray-500">Status</p>${statusBadge}</div>
            <div><p class="text-gray-500">Patient Name</p><p class="font-semibold text-gray-800">${inv.patient_name || '-'}</p></div>
            <div><p class="text-gray-500">Phone</p><p class="font-semibold text-gray-800">${inv.phone || '-'}</p></div>
            <div><p class="text-gray-500">Age / Sex</p><p class="font-semibold text-gray-800">${inv.age_text || inv.age || '-'} / ${inv.sex?.toUpperCase() || '-'}</p></div>
            <div><p class="text-gray-500">Reference Doctor</p><p class="font-semibold text-gray-800">${inv.doctor?.name || inv.reference_doctor || '-'}</p></div>
        </div>
        ${testsHTML ? `<div class="mb-4"><h3 class="text-lg font-semibold mb-3 text-gray-800">Selected Tests</h3><table class="w-full text-sm border"><thead><tr class="bg-gray-50"><th class="py-2 border text-center px-3 w-12">SL</th><th class="py-2 border text-left px-3">Test Name</th><th class="py-2 border text-right px-3 w-24">Price</th><th class="py-2 border text-center px-3 w-32">Department</th></tr></thead><tbody>${testsHTML}</tbody></table></div>` : ''}
        ${paymentsHTML ? `<div class="mb-4"><h3 class="text-lg font-semibold mb-3 text-gray-800">Payment History</h3><table class="w-full text-sm border"><thead><tr class="bg-gray-50"><th class="py-2 border text-left px-3">Date</th><th class="py-2 border text-left px-3">Method</th><th class="py-2 border text-right px-3 w-24">Amount</th></tr></thead><tbody>${paymentsHTML}</tbody></table></div>` : ''}
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
            <h3 class="text-lg font-semibold mb-4 text-gray-800">Invoice Status Summary</h3>
            <div class="space-y-3 text-sm">
                <div class="flex justify-between"><span class="text-gray-600">Gross Total:</span><span class="font-semibold text-gray-800">${fmtNum(inv.total_amount)}</span></div>
                <div class="flex justify-between"><span class="text-gray-600">Total Discount:</span><span class="font-semibold text-orange-600">- ${fmtNum(totalDiscounts)}</span></div>
                <div class="flex justify-between border-t border-gray-300 pt-2"><span class="text-gray-700 font-medium">Net Payable:</span><span class="font-bold text-lg text-gray-900">${fmtNum(inv.net_amount)}</span></div>
                <div class="flex justify-between"><span class="text-gray-600">Paid Amount:</span><span class="font-semibold text-emerald-600">${fmtNum(totalPayments)}</span></div>
                <div class="flex justify-between border-t-2 border-gray-400 pt-3 mt-2"><span class="text-gray-800 font-bold text-base">Balance Due:</span><span class="font-bold text-2xl ${dueAmount > 0 ? 'text-red-600' : 'text-emerald-600'}">${fmtNum(dueAmount)}</span></div>
            </div>
        </div>`
    }

    return (
        <>
            <AppHeader fixed />
            <main className="">
                <div className="mb-3">
                    <h1 className="text-2xl font-bold tracking-tight">{scope === 'my' ? 'My Collections' : scope === 'user-wise' ? 'User Wise Collections' : 'All Collections'}</h1>
                    <p className="text-sm text-gray-500 mt-1">{scope === 'my' ? 'Outdoor patient payments collected by you' : scope === 'user-wise' ? 'Outdoor patient collections by user' : 'All outdoor patient payments across users'}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                    {stats.map((item, idx) => (
                        <div key={idx} className={`relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br ${item.gradient} p-4 md:p-6 shadow-lg ${item.shadow}`}>
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="relative flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-white/90">{item.label}</p>
                                    <h3 className="mt-2 text-lg xl:text-2xl font-bold text-white">{item.value || 0}</h3>
                                </div>
                                <div className="hidden xl:block rounded-xl bg-white/20 p-2.5">{item.icon}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">Loading collections...</div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={data?.data?.items || []}
                        meta={data?.data?.meta}
                        onPageChange={setPage}
                        search={search}
                        onSearchChange={(v: string) => setSearch(v)}
                        filterSlot={
                            <>
                                {scope === 'user-wise' && (
                                    <Select value={user} onValueChange={(v) => setUser?.(v)}>
                                        <SelectTrigger className="w-[160px] h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                                            <SelectValue placeholder="All Users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            {users.map((u: any) => (
                                                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
                                        <SelectTrigger className="w-[140px] h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                                            <SelectValue placeholder="Filter by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="yesterday">Yesterday</SelectItem>
                                            <SelectItem value="last7">Last 7 days</SelectItem>
                                            <SelectItem value="last15">Last 15 days</SelectItem>
                                            <SelectItem value="last30">Last 30 days</SelectItem>
                                            <SelectItem value="last45">Last 45 days</SelectItem>
                                            <SelectItem value="last60">Last 60 days</SelectItem>
                                            <SelectItem value="last90">Last 90 days</SelectItem>
                                            <SelectItem value="last180">Last 180 days</SelectItem>
                                            <SelectItem value="last365">Last 365 days</SelectItem>
                                            <SelectItem value="custom">Custom range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <DateField value={from} onChange={(v: string) => { setFrom(v); setPresetOpen(false) }} placeholder="From" />
                                    <span className="text-xs text-muted-foreground">to</span>
                                    <DateField value={to} onChange={(v: string) => { setTo(v); setPresetOpen(false) }} placeholder="To" />
                                    {(from || to) && (
                                        <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo('') }}>
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </>
                        }
                    />
                )}
            </main>

            {/* View Details Modal */}
            <Dialog open={viewInvoiceId !== null} onOpenChange={(open) => { if (!open) setViewInvoiceId(null) }}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogTitle className="sr-only">Invoice Details</DialogTitle>
                    {invoice ? (
                        <div dangerouslySetInnerHTML={{ __html: buildInvoiceDetailHTML(invoice) }} />
                    ) : (
                        <div className="flex items-center justify-center py-10 text-muted-foreground">Loading...</div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
