import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useAuthStore } from '@/stores/auth-store'

interface IndoorAllCollectionsProps {
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

export default function IndoorAllCollections({
    page, limit, search, from, to,
    setPage, setLimit, setSearch, setFrom, setTo,
    scope = 'all', user = 'all', setUser,
}: IndoorAllCollectionsProps) {
    const token = getCookie('accessToken')
    const { currency, currencySymbol } = useCurrency()
    const { formatDate } = useDateFormat()
    const fmtNum = (v: any) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const currentUser = useAuthStore((s) => s.user)

    // Users for the filter dropdown
    const { data: usersData } = useQuery({
        queryKey: ['indoor-collection-users'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admission/collections/users`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch users')
            return res.json()
        },
        enabled: !!token && scope === 'user-wise',
    })
    const users = usersData?.data || []

    // Collections
    const { data, isLoading } = useQuery({
        queryKey: ['indoor-collections', scope, page, limit, search, user, from, to],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
            })

            if (scope === 'my' && currentUser?.id) {
                params.append('user_id', currentUser.id.toString())
            } else if (user && user !== 'all') {
                params.append('user_id', user)
            }
            if (from) params.append('start_date', from)
            if (to) params.append('end_date', to)

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/admission/collections?${params.toString()}`,
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
            {
                label: 'Total Payments',
                value: s.payment_count || 0,
                icon: CreditCard,
                grad: 'from-blue-500 to-indigo-500',
            },
            {
                label: `Total Collected (${currencySymbol || currency})`,
                value: fmtNum(s.total_collected || 0),
                icon: DollarSign,
                grad: 'from-green-500 to-emerald-500',
            },
            {
                label: `Total Discount (${currencySymbol || currency})`,
                value: fmtNum(s.total_discount || 0),
                icon: TrendingUp,
                grad: 'from-orange-500 to-amber-500',
            },
            {
                label: `Gross Bill (${currencySymbol || currency})`,
                value: fmtNum(s.total_bill || 0),
                icon: FileText,
                grad: 'from-purple-500 to-indigo-500',
            },
        ]
    }, [data, currencySymbol, currency])

    // ---- Date filter presets ----
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
    const [viewAdmissionId, setViewAdmissionId] = useState<number | null>(null)
    const { data: admissionData } = useQuery({
        queryKey: ['admission-detail', viewAdmissionId],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admission/${viewAdmissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch details')
            return res.json()
        },
        enabled: !!token && viewAdmissionId !== null,
    })
    const admission = admissionData?.data
    useEffect(() => {
        const handler = (e: Event) => {
            const btn = (e.target as HTMLElement).closest('.view-details-btn')
            if (!btn) return
            const id = Number((btn as HTMLElement).dataset.id)
            if (id) setViewAdmissionId(id)
        }
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
    }, [])

    const columns = [
        {
            data: 'payment_id',
            title: 'Payment ID',
            orderable: true,
            responsivePriority: 1,
            render: (d: any) => d ? `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">OPA-${d}</span>` : '-',
            defaultContent: '-'
        },
        {
            data: 'admission_prefix',
            title: 'Admission No',
            orderable: true,
            responsivePriority: 1,
            render: (d: any, _type: any, row: any) => {
                const displayId = d && d.toString().startsWith('ADM-') ? d : (d ? `ADM-${d}` : `ADM-${row.admission_id || row.id}`);
                return `<span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${displayId}</span>`;
            },
            defaultContent: '-'
        },
        { data: 'created_at', title: 'Admission Date & Time', orderable: true, responsivePriority: 4, render: (d: any) => fmtDateTime(d), defaultContent: '-' },
        { data: 'patient_name', title: 'Patient Name', orderable: true, responsivePriority: 1, defaultContent: '-' },
        { data: 'phone', title: 'Phone', orderable: true, className: 'dt-head-left dt-body-left', responsivePriority: 2, defaultContent: '-' },
        {
            data: null, title: 'Reference Doctor', orderable: false, responsivePriority: 3,
            render: (_d: any, type: string, row: any) => {
                const d = row.doctor
                if (!d?.doctor_name) return '-'
                if (type === 'sort' || type === 'filter' || type === 'type') return d.doctor_name
                const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                const subtitle = [d.qualification || d.title, d.speciality].filter(Boolean).join(' - ')
                return `<div class="flex flex-col"><span class="font-semibold text-blue-600 dark:text-blue-400">Dr. ${esc(d.doctor_name)}</span>${subtitle ? `<span class="text-xs text-muted-foreground mt-0.5">${esc(subtitle)}</span>` : ''}</div>`
            }, defaultContent: '-',
        },
        {
            data: 'total_amount', title: `Bill Amount (${currencySymbol || currency})`, orderable: true, responsivePriority: 4,
            render: (d: any) => `<span class="font-medium text-gray-600">${fmtNum(d)}</span>`, defaultContent: '0',
        },
        {
            data: null, title: `Discount (${currencySymbol || currency})`, orderable: false, responsivePriority: 5,
            className: 'text-right dt-body-right dt-head-right',
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
            render: (d: any) => `<span class="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 capitalize">${d || '-'}</span>`, defaultContent: '-',
        },
        {
            data: null, title: 'Collected By', orderable: false, responsivePriority: 3,
            render: (_d: any, _t: string, row: any) => `<span class="text-sm font-medium text-gray-700">${row.payment_created_by?.name || '-'}</span>`, defaultContent: '-',
        },
        {
            data: 'payment_date', title: 'Collected Date & Time', orderable: true, responsivePriority: 3,
            render: (d: any) => fmtDateTime(d), defaultContent: '-',
        },
        {
            data: null, title: 'Actions', orderable: false, responsivePriority: 1,
            render: (_d: any, _t: string, row: any) =>
                `<div class="flex flex-wrap items-center gap-2">
                    <button class="view-details-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors" type="button" data-id="${row.id}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>View Details</button>
                    <button onclick="window.location.href = '/dashboard/admission/patients/${row.id}/payment-receipt/${row.payment_id}'"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-semibold shadow transition-colors" type="button"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>Print</button>
                </div>`,
            defaultContent: '',
        },
    ]

    // Build admission detail statement HTML
    const buildAdmissionDetailHTML = (adm: any) => {
        const hasBill = !!adm.finalBill;
        const totalBill = hasBill ? Number(adm.finalBill.total_bill_amount || 0) : 0;
        const totalDiscount = hasBill ? Number(adm.finalBill.total_discount || 0) : 0;
        const netPayable = hasBill ? Number(adm.finalBill.total_discounted_amount || 0) : 0;

        // Sum all payments (advance + final bill payments)
        const totalPayments = (adm.payments?.reduce((s: number, p: any) => s + Number(p.amount || 0), 0) || 0) +
            (adm.advancePayments?.payments?.reduce((s: number, p: any) => s + Number(p.amount || 0), 0) || 0);

        const dueAmount = hasBill ? (netPayable - totalPayments) : -totalPayments;
        const isPaid = hasBill ? (dueAmount <= 0) : false;

        let statusBadge = '';
        if (hasBill) {
            statusBadge = isPaid
                ? '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600">Paid</span>'
                : '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">Unpaid</span>';
        } else {
            statusBadge = '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">Advance/Billing Pending</span>';
        }

        // Bill items rows (if final bill exists)
        let itemsHTML = '';
        if (hasBill && adm.finalBill.items) {
            itemsHTML = adm.finalBill.items.map((t: any, i: number) =>
                `<tr class="border-b"><td class="py-2 px-3 text-center">${i + 1}</td><td class="py-2 px-3">${t.service_name || '-'}</td><td class="py-2 px-3 text-center capitalize">${(t.service_type || '').replace('_', ' ')}</td><td class="py-2 px-3 text-center">${Number(t.quantity || 1)}</td><td class="py-2 px-3 text-right">${fmtNum(t.unit_price)}</td><td class="py-2 px-3 text-right">${fmtNum(t.total_amount)}</td><td class="py-2 px-3 text-right text-orange-600">${fmtNum(t.total_discount)}</td><td class="py-2 px-3 text-right font-medium">${fmtNum(t.final_amount)}</td></tr>`
            ).join('');
        }

        // Payments log rows
        const paymentsList = [...(adm.payments || []), ...(adm.advancePayments?.payments || [])];
        paymentsList.sort((a, b) => new Date(a.payment_date || a.created_at).getTime() - new Date(b.payment_date || b.created_at).getTime());

        const paymentsHTML = paymentsList.map((p: any) =>
            `<tr class="border-b"><td class="py-2 px-3">${fmtDateTime(p.payment_date || p.created_at)}</td><td class="py-2 px-3 capitalize">${p.payment_method || p.method || '-'}</td><td class="py-2 px-3">${p.notes || '-'}</td><td class="py-2 px-3 text-right text-emerald-600 font-medium">${fmtNum(p.amount)}</td></tr>`
        ).join('') || '';

        return `
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 -mx-6 -mt-6 mb-4 rounded-t-lg">
            <h2 class="text-xl font-semibold">Admission Billing Statement</h2>
            <p class="text-sm opacity-90">${adm.admission_prefix || ('ADM-' + adm.id)} · Admitted on ${formatDate(new Date(adm.admission_date))}</p>
        </div>
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm border-b pb-6 mb-4">
            <div><p class="text-gray-500">Patient Name</p><p class="font-semibold text-gray-800">${adm.patient_name || '-'}</p></div>
            <div><p class="text-gray-500">Status</p>${statusBadge}</div>
            <div><p class="text-gray-500">Phone</p><p class="font-semibold text-gray-800">${adm.phone || '-'}</p></div>
            <div><p class="text-gray-500">Age / Sex</p><p class="font-semibold text-gray-800">${adm.age_text || adm.age || '-'} / ${adm.sex?.toUpperCase() || '-'}</p></div>
            <div><p class="text-gray-500">Current Bed / Cabin</p><p class="font-semibold text-gray-800">${adm.bedCabin ? (adm.bedCabin.code + ' (' + adm.bedCabin.type + ')') : '-'}</p></div>
            <div><p class="text-gray-500">Reference Doctor</p><p class="font-semibold text-gray-800">${adm.doctor?.doctor_name || '-'}</p></div>
        </div>
        ${itemsHTML ? `<div class="mb-4"><h3 class="text-md font-semibold mb-3 text-gray-800">Final Bill Items</h3><table class="w-full text-xs border border-collapse"><thead><tr class="bg-gray-50"><th class="py-2 border text-center px-2 w-10">SL</th><th class="py-2 border text-left px-3">Service Name</th><th class="py-2 border text-center px-3">Type</th><th class="py-2 border text-center px-2">Qty</th><th class="py-2 border text-right px-3">Unit Price</th><th class="py-2 border text-right px-3">Subtotal</th><th class="py-2 border text-right px-3">Discount</th><th class="py-2 border text-right px-3">Total</th></tr></thead><tbody>${itemsHTML}</tbody></table></div>` : '<div class="mb-4 py-4 text-center text-sm text-gray-500 border border-dashed rounded bg-gray-50">No final bill items created yet.</div>'}
        ${paymentsHTML ? `<div class="mb-4"><h3 class="text-md font-semibold mb-3 text-gray-800">Payment Log</h3><table class="w-full text-xs border border-collapse"><thead><tr class="bg-gray-50"><th class="py-2 border text-left px-3">Date</th><th class="py-2 border text-left px-3">Method</th><th class="py-2 border text-left px-3">Notes</th><th class="py-2 border text-right px-3 w-28">Amount</th></tr></thead><tbody>${paymentsHTML}</tbody></table></div>` : ''}
        ${hasBill ? `
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200 mt-4">
            <h3 class="text-md font-semibold mb-4 text-gray-800">Billing Summary</h3>
            <div class="space-y-3 text-sm">
                <div class="flex justify-between"><span class="text-gray-600">Gross Total:</span><span class="font-semibold text-gray-800">${fmtNum(totalBill)}</span></div>
                <div class="flex justify-between"><span class="text-gray-600">Total Discount:</span><span class="font-semibold text-orange-600">- ${fmtNum(totalDiscount)}</span></div>
                <div class="flex justify-between border-t border-gray-300 pt-2"><span class="text-gray-700 font-medium">Net Payable:</span><span class="font-bold text-lg text-gray-900">${fmtNum(netPayable)}</span></div>
                <div class="flex justify-between"><span class="text-gray-600">Paid Amount:</span><span class="font-semibold text-emerald-600">${fmtNum(totalPayments)}</span></div>
                <div class="flex justify-between border-t-2 border-gray-400 pt-3 mt-2"><span class="text-gray-800 font-bold text-base">Balance Due:</span><span class="font-bold text-xl ${dueAmount > 0 ? 'text-red-600' : 'text-emerald-600'}">${fmtNum(dueAmount)}</span></div>
            </div>
        </div>` : `
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200 mt-4">
            <h3 class="text-md font-semibold mb-4 text-gray-800">Advance Summary</h3>
            <div class="space-y-3 text-sm">
                <div class="flex justify-between"><span class="text-gray-600">Total Advance Paid:</span><span class="font-bold text-emerald-600">${fmtNum(totalPayments)}</span></div>
            </div>
        </div>`}
        `
    }

    return (
        <>
            <AppHeader fixed />
            <main className="">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {scope === 'my' ? 'My Collections' : scope === 'user-wise' ? 'User Wise Collections' : 'All Collections'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {scope === 'my' ? 'Indoor patient payments collected by you' : scope === 'user-wise' ? 'Indoor patient collections grouped by user' : 'All indoor patient payments and advance collections across users'}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {stats.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }}>
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 bg-gradient-to-br ${item.grad} rounded-lg shadow-lg`}>
                                            <Icon className="w-4 h-4" style={{ color: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }} />
                                        </div>
                                        <CardTitle className="text-sm font-semibold text-white/90">{item.label}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <h3 className="text-2xl font-bold">{item.value || 0}</h3>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">Loading collections...</div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={data?.data?.items || []}
                        meta={data?.data?.meta}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
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
            <Dialog open={viewAdmissionId !== null} onOpenChange={(open) => { if (!open) setViewAdmissionId(null) }}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogTitle className="sr-only">Admission Billing Statement</DialogTitle>
                    {admission ? (
                        <div dangerouslySetInnerHTML={{ __html: buildAdmissionDetailHTML(admission) }} />
                    ) : (
                        <div className="flex items-center justify-center py-10 text-muted-foreground">Loading...</div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
