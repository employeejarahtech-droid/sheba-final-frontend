import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import {
    ArrowLeft,
    User,
    Phone,
    Stethoscope,
    Home,
    Activity,
    Calendar,
    CheckCircle2,
    XCircle,
    FileText,
    Receipt,
    Scale,
    Printer,
    Loader2,
    Check,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'

const API_URL = import.meta.env.VITE_API_URL

type AdmissionViewPageProps = { admissionId: string }

export function AdmissionViewPage({ admissionId }: AdmissionViewPageProps) {
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const { formatDate, formatDateTime } = useDateFormat()
    const { format } = useCurrency()

    const safeFormatDateTime = (dateVal: any, timeVal?: string | null) => {
        if (!dateVal) return '-'
        if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
            const [y, m, day] = dateVal.split('-').map(Number)
            if (timeVal && /^\d{2}:\d{2}/.test(timeVal)) {
                const [h, min] = timeVal.split(':').map(Number)
                return formatDateTime(new Date(y, m - 1, day, h, min))
            }
            return formatDate(new Date(y, m - 1, day))
        }
        return formatDateTime(dateVal)
    }

    const { data, isLoading, isError } = useQuery({
        queryKey: ['admission-view', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch admission')
            const json = await res.json()
            return json.data
        },
        enabled: !!token && !!admissionId,
    })

    const a: any = data || {}

    const { data: distributionsData } = useQuery({
        queryKey: ['distributions', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/bill-distribution/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch distributions')
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    const distributions = distributionsData?.data || []

    const base = `/dashboard/admission/patients/${admissionId}`

    const steps = [
        {
            label: 'Bill Created',
            done: !!a.bill_created,
            date: a.bill_created_at || a.bill_created_date,
            by: a.bill_created_by_user?.name,
            why: 'Preliminary billing items (bed cabins, operations, consultants, or clinical services) must be added and saved.'
        },
        {
            label: 'Final Bill Created',
            done: !!a.final_bill_created,
            date: a.finalBill?.created_at || a.final_bill_created_date,
            by: a.final_bill_created_by_user?.name,
            why: !a.bill_created
                ? 'Requires preliminary bill to be created first.'
                : 'Final bill needs to be calculated and generated.'
        },
        {
            label: 'Discharged',
            done: !!a.discharged,
            date: a.discharged_date,
            time: a.discharge_time,
            by: a.discharged_by_user?.name,
            why: !a.final_bill_created
                ? 'Requires final bill to be created first.'
                : 'Patient needs to be discharged and bed released.'
        },
        {
            label: 'Payment Completed',
            done: !!a.payment_completed,
            date: a.payments && a.payments.length > 0 ? a.payments[0].payment_date : a.payment_completed_date,
            by: a.payments && a.payments.length > 0 ? a.payments[0].created_by_user?.name : a.payment_completed_by_user?.name,
            why: !a.final_bill_created
                ? 'Requires final bill to be created first.'
                : a.finalBill && Number(a.finalBill.due_amount) > 0
                ? `Remaining due amount of ${format(Number(a.finalBill.due_amount))} must be collected.`
                : 'Payment has not been completed or settled in full.'
        },
        {
            label: 'Bills Distributed',
            done: !!a.bills_distributed,
            date: distributions && distributions.length > 0 ? distributions[0].created_at : a.bills_distributed_date,
            by: a.bills_distributed_by_user?.name,
            why: !a.payment_completed
                ? 'Requires patient payment to be completed first.'
                : 'Billing items must be distributed to doctors/service providers.'
        },
        {
            label: 'Balance Distributed',
            done: !!a.balance_distributed,
            date: (distributions && distributions.length > 0)
                ? distributions.reduce((max: string, d: any) => !max || new Date(d.updated_at) > new Date(max) ? d.updated_at : max, '')
                : a.balance_distributed_date,
            by: a.balance_distributed_by_user?.name,
            why: !a.bills_distributed
                ? 'Requires bills to be distributed first.'
                : 'All distributed provider payments must be paid/settled in full.'
        },
    ]

    const getPreliminaryItems = (admissionObj: any) => {
        const items: any[] = [];
        if (!admissionObj.billingItems) return items;

        const { operations, consultants, surgeons, assistants, services, bedCabins, anesthesiologists } = admissionObj.billingItems;

        if (bedCabins) {
            bedCabins.forEach((b: any) => {
                items.push({
                    name: `${b.bed_code} (${b.bed_type})`,
                    category: 'Bed/Cabin Charges',
                    date: b.from_date + (b.to_date ? ` to ${b.to_date}` : ' (Present)'),
                    detail: `${b.days} day(s) @ ${format(Number(b.rate_per_day))}`,
                    amount: Number(b.total_amount)
                });
            });
        }

        if (operations) {
            operations.forEach((o: any) => {
                items.push({
                    name: o.operation_type,
                    category: 'Operation',
                    date: o.operation_date,
                    detail: '1 unit',
                    amount: Number(o.charges)
                });
            });
        }

        if (consultants) {
            consultants.forEach((c: any) => {
                items.push({
                    name: `Consultation - ${c.consultant_name}`,
                    category: 'Consultant',
                    date: c.visit_date,
                    detail: '1 visit',
                    amount: Number(c.fees)
                });
            });
        }

        if (surgeons) {
            surgeons.forEach((s: any) => {
                items.push({
                    name: `Surgeon Fee - ${s.surgeon_name}`,
                    category: 'Surgeon',
                    date: s.operation_date,
                    detail: '1 unit',
                    amount: Number(s.fees)
                });
            });
        }

        if (assistants) {
            assistants.forEach((asst: any) => {
                items.push({
                    name: `Assistant Fee - ${asst.assistant_name}`,
                    category: 'Assistant',
                    date: asst.operation_date,
                    detail: '1 unit',
                    amount: Number(asst.fees)
                });
            });
        }

        if (anesthesiologists) {
            anesthesiologists.forEach((anes: any) => {
                items.push({
                    name: `Anesthesia Fee - ${anes.anesthesiologist_name} (${anes.anesthesia_type})`,
                    category: 'Anesthesia',
                    date: anes.operation_date,
                    detail: '1 unit',
                    amount: Number(anes.fees)
                });
            });
        }

        if (services) {
            services.forEach((s: any) => {
                items.push({
                    name: s.note || 'Service',
                    category: 'Clinical Service',
                    date: s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : '-',
                    detail: '1 unit',
                    amount: Number(s.amount)
                });
            });
        }

        return items;
    };

    const getFinalBillItems = (admissionObj: any) => {
        if (!admissionObj.finalBill?.items) return [];
        return admissionObj.finalBill.items.map((item: any) => ({
            name: item.service_name,
            category: item.service_type,
            note: item.service_note || '-',
            detail: `${Number(item.quantity)} qty @ ${format(Number(item.unit_price))}`,
            discount: Number(item.total_discount || 0),
            amount: Number(item.final_amount)
        }));
    };

    const prelimItems = getPreliminaryItems(a);
    const prelimTotal = prelimItems.reduce((sum, item) => sum + item.amount, 0);

    const statusBadge = (status?: string) => {
        if (!status) return null
        const colors: Record<string, string> = {
            admitted: 'bg-blue-100 text-blue-700',
            discharged: 'bg-emerald-100 text-emerald-700',
            pending: 'bg-amber-100 text-amber-700',
        }
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
                {status}
            </span>
        )
    }

    const Info = ({ label, value }: { label: string; value: any }) => (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium text-sm">{value ?? '-'}</p>
        </div>
    )

    return (
        <>
            <AppHeader fixed />
            <Main className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/dashboard/admission/patients' })}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold flex items-center gap-3">
                            {a.admission_prefix ? `Admission ${a.admission_prefix}` : `Admission #${a.id || admissionId}`}
                            {statusBadge(a.status)}
                        </h1>
                        <p className="text-sm text-muted-foreground">{a.patient_name || ''}</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading admission...
                    </div>
                ) : isError ? (
                    <Card>
                        <CardContent className="py-10 text-center text-destructive">
                            Failed to load admission details.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Patient Information */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b py-2 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100">Patient Information</CardTitle>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Patient identity, age, sex, and contact details</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 grid grid-cols-2 gap-4">
                                    <Info label="Patient Name" value={a.patient_name} />
                                    <Info label="Age / Sex" value={[a.age_text || a.age, a.sex].filter(Boolean).join(' / ')} />
                                    <Info label="Phone" value={<span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{a.phone}</span>} />
                                    <Info label="ID Card Number" value={a.id_card_number} />
                                </CardContent>
                            </Card>

                            {/* Admission Information */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-b py-2 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
                                            <Activity className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100">Admission Information</CardTitle>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Admission dates, consulting doctor, and assigned bed</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 grid grid-cols-2 gap-4">
                                    <Info label="Admission Date" value={safeFormatDateTime(a.admission_date, a.admission_time)} />
                                    <Info label="Discharge Date" value={safeFormatDateTime(a.discharge_date, a.discharge_time)} />
                                    <Info label="Doctor" value={<span className="inline-flex items-center gap-1"><Stethoscope className="h-3 w-3" />{a.doctor?.doctor_name}</span>} />
                                    <Info label="Bed / Cabin" value={<span className="inline-flex items-center gap-1"><Home className="h-3 w-3" />{[a.bedCabin?.code, a.bedCabin?.type].filter(Boolean).join(' - ')}</span>} />
                                    <div className="col-span-2">
                                        <Info label="Diagnosis" value={a.diagnosis} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Billing Status Timeline */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-b py-2 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100">Billing & Status Timeline</CardTitle>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Step-by-step progress checklist from billing to discharge</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-8 ml-3">
                                    {steps.map((s) => {
                                        const prelimItems = s.label === 'Bill Created' && s.done ? getPreliminaryItems(a) : [];
                                        const finalItems = s.label === 'Final Bill Created' && s.done ? getFinalBillItems(a) : [];
                                        
                                        return (
                                            <div key={s.label} className="relative">
                                                {/* Bullet marker */}
                                                <span className={`absolute -left-[34px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${s.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                                                    {s.done ? (
                                                        <Check className="h-3 w-3 stroke-[3]" />
                                                    ) : (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                    )}
                                                </span>
                                                
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                        <h3 className={`text-sm font-semibold ${s.done ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}`}>{s.label}</h3>
                                                        {s.done ? (
                                                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                                                                Completed
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-950/20 dark:text-slate-400">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                     <div className="text-[11px] text-muted-foreground flex flex-col gap-1">
                                                         {s.done ? (
                                                             <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                                 <span>Date: {safeFormatDateTime(s.date, s.time)}</span>
                                                                 {s.by && <span>by: {s.by}</span>}
                                                             </div>
                                                         ) : (
                                                             <div className="flex flex-col gap-0.5">
                                                                 <span>Not completed yet</span>
                                                                 {s.why && (
                                                                     <span className="text-xs text-amber-600 dark:text-amber-500 font-normal">
                                                                         ({s.why})
                                                                     </span>
                                                                 )}
                                                             </div>
                                                         )}
                                                     </div>
                                                    
                                                    {/* Preliminary Bill Table */}
                                                    {s.label === 'Bill Created' && s.done && (
                                                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 max-w-4xl shadow-sm animate-in fade-in duration-200">
                                                            <div className="bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                                                                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Preliminary Bill Items</h4>
                                                            </div>
                                                            {prelimItems.length === 0 ? (
                                                                <p className="p-3 text-xs text-muted-foreground">No preliminary billing items found.</p>
                                                            ) : (
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-left text-xs border-collapse">
                                                                        <thead>
                                                                            <tr className="border-b bg-slate-50/30 dark:bg-slate-900/20 text-slate-500 dark:text-slate-400 font-medium">
                                                                                <th className="p-2.5">Description</th>
                                                                                <th className="p-2.5">Category</th>
                                                                                <th className="p-2.5">Date</th>
                                                                                <th className="p-2.5 text-right">Details</th>
                                                                                <th className="p-2.5 text-right">Amount</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                                                            {prelimItems.map((item, idx) => (
                                                                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                                                                    <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                                                                                    <td className="p-2.5 text-slate-550 dark:text-slate-400">{item.category}</td>
                                                                                    <td className="p-2.5 text-slate-550 dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                                                                                    <td className="p-2.5 text-right text-slate-550 dark:text-slate-400">{item.detail}</td>
                                                                                    <td className="p-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">{format(item.amount)}</td>
                                                                                </tr>
                                                                            ))}
                                                                            <tr className="bg-slate-50/20 dark:bg-slate-900/10 font-bold border-t border-slate-200 dark:border-slate-800">
                                                                                <td className="p-2.5" colSpan={4}>Total Preliminary Bill</td>
                                                                                <td className="p-2.5 text-right text-blue-600 dark:text-blue-400">{format(prelimTotal)}</td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Final Bill Table */}
                                                    {s.label === 'Final Bill Created' && s.done && (
                                                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 max-w-4xl shadow-sm animate-in fade-in duration-200">
                                                            <div className="bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                                                                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Finalized Invoice Items</h4>
                                                            </div>
                                                            {finalItems.length === 0 ? (
                                                                <p className="p-3 text-xs text-muted-foreground">No final bill items found.</p>
                                                            ) : (
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-left text-xs border-collapse">
                                                                        <thead>
                                                                            <tr className="border-b bg-slate-50/30 dark:bg-slate-900/20 text-slate-500 dark:text-slate-400 font-medium">
                                                                                <th className="p-2.5">Service/Item</th>
                                                                                <th className="p-2.5">Type</th>
                                                                                <th className="p-2.5">Service Note</th>
                                                                                <th className="p-2.5 text-right">Qty & Rate</th>
                                                                                <th className="p-2.5 text-right">Discount</th>
                                                                                <th className="p-2.5 text-right">Final Amount</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                                                            {finalItems.map((item, idx) => (
                                                                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                                                                    <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                                                                                    <td className="p-2.5 text-slate-550 dark:text-slate-400 capitalize">{item.category.replace('_', ' ')}</td>
                                                                                    <td className="p-2.5 text-slate-550 dark:text-slate-400">{item.note}</td>
                                                                                    <td className="p-2.5 text-right text-slate-550 dark:text-slate-400 whitespace-nowrap">{item.detail}</td>
                                                                                    <td className="p-2.5 text-right text-red-500 font-medium">{item.discount > 0 ? `-${format(item.discount)}` : '-'}</td>
                                                                                    <td className="p-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">{format(item.amount)}</td>
                                                                                </tr>
                                                                            ))}
                                                                            <tr className="bg-slate-50/5 dark:bg-slate-900/5 text-slate-500 border-t border-slate-200 dark:border-slate-800">
                                                                                <td className="p-2.5 font-medium" colSpan={5}>Gross Amount</td>
                                                                                <td className="p-2.5 text-right font-medium text-slate-900 dark:text-slate-100">{format(Number(a.finalBill?.total_bill_amount || 0))}</td>
                                                                            </tr>
                                                                            {a.finalBill && (
                                                                                <tr className="bg-slate-50/5 dark:bg-slate-900/5 text-red-500 border-t border-slate-200 dark:border-slate-800">
                                                                                    <td className="p-2.5 font-medium" colSpan={5}>Total Discount</td>
                                                                                    <td className="p-2.5 text-right font-medium">-{format(Number(a.finalBill.total_discount || 0))}</td>
                                                                                </tr>
                                                                            )}
                                                                            <tr className="bg-slate-50/20 dark:bg-slate-900/10 font-bold border-t border-slate-200 dark:border-slate-800">
                                                                                <td className="p-2.5" colSpan={5}>Net Final Bill</td>
                                                                                <td className="p-2.5 text-right text-blue-600 dark:text-blue-400">{format(Number(a.finalBill?.net_amount || a.finalBill?.total_discounted_amount || 0))}</td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                            {/* Discount Details Metadata */}
                                                            {Number(a.finalBill?.total_discount || 0) > 0 && (
                                                                <div className="border-t border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 px-3.5 py-2.5 text-[11px] text-muted-foreground flex flex-wrap gap-x-6 gap-y-1.5 items-center">
                                                                    {a.finalBill.discountDoctor && (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-355">Auth Doctor:</span>
                                                                            <span className="text-slate-600 dark:text-slate-300">{a.finalBill.discountDoctor.doctor_name}</span>
                                                                        </div>
                                                                    )}
                                                                    {a.finalBill.discountedBy && (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-355">Applied By:</span>
                                                                            <span className="text-slate-600 dark:text-slate-300">{a.finalBill.discountedBy.name}</span>
                                                                        </div>
                                                                    )}
                                                                    {a.finalBill.discounted_bill_created_at && (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-355">Discount Date:</span>
                                                                            <span className="text-slate-600 dark:text-slate-300">{formatDateTime(a.finalBill.discounted_bill_created_at)}</span>
                                                                        </div>
                                                                    )}
                                                                    {a.finalBill.notes && (
                                                                        <div className="w-full mt-0.5 border-t border-dashed border-slate-200 dark:border-slate-800 pt-1.5 flex items-start gap-1">
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-355 whitespace-nowrap">Discount Reason:</span>
                                                                            <span className="italic text-slate-600 dark:text-slate-400">"{a.finalBill.notes}"</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Payment List Table */}
                                                    {s.label === 'Payment Completed' && a.payments && a.payments.length > 0 && (
                                                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 max-w-4xl shadow-sm animate-in fade-in duration-200">
                                                            <div className="bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                                                                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment & Refund History</h4>
                                                            </div>
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-left text-xs border-collapse">
                                                                    <thead>
                                                                        <tr className="border-b bg-slate-50/30 dark:bg-slate-900/20 text-slate-500 dark:text-slate-400 font-medium">
                                                                            <th className="p-2.5">Date</th>
                                                                            <th className="p-2.5">Method</th>
                                                                            <th className="p-2.5">Notes</th>
                                                                            <th className="p-2.5">Collected By</th>
                                                                            <th className="p-2.5 text-right">Amount</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                                                        {a.payments.map((p: any, idx: number) => {
                                                                            const amountNum = Number(p.amount);
                                                                            const isRefund = amountNum < 0;
                                                                            return (
                                                                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                                                                    <td className="p-2.5 text-slate-550 dark:text-slate-400 whitespace-nowrap">
                                                                                        {p.payment_date ? formatDateTime(p.payment_date) : '-'}
                                                                                    </td>
                                                                                    <td className="p-2.5 text-slate-550 dark:text-slate-400 capitalize">
                                                                                        {p.payment_method || '-'}
                                                                                    </td>
                                                                                    <td className="p-2.5 text-slate-550 dark:text-slate-400">{p.notes || '-'}</td>
                                                                                    <td className="p-2.5 text-slate-550 dark:text-slate-400">{p.created_by_user?.name || '-'}</td>
                                                                                    <td className={`p-2.5 text-right font-semibold ${isRefund ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                                                                        {isRefund ? `${format(amountNum)} (Refund)` : format(amountNum)}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                        <tr className="bg-slate-50/20 dark:bg-slate-900/10 font-bold border-t border-slate-200 dark:border-slate-800">
                                                                            <td className="p-2.5" colSpan={4}>Total Paid By Patient</td>
                                                                            <td className="p-2.5 text-right text-green-600 dark:text-green-400">
                                                                                {format(a.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Bills Distributed Table */}
                                                    {s.label === 'Bills Distributed' && distributions.length > 0 && (
                                                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 max-w-4xl shadow-sm animate-in fade-in duration-200">
                                                            <div className="bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                                                                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Distributed Bill Details</h4>
                                                            </div>
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-left text-xs border-collapse">
                                                                    <thead>
                                                                        <tr className="border-b bg-slate-50/30 dark:bg-slate-900/20 text-slate-500 dark:text-slate-400 font-medium">
                                                                            <th className="p-2.5">Service Provider</th>
                                                                            <th className="p-2.5">Provider Name</th>
                                                                            <th className="p-2.5 text-right">Gross Bill</th>
                                                                            <th className="p-2.5 text-right">Deduction (Less)</th>
                                                                            <th className="p-2.5 text-right">Net Payable</th>
                                                                            <th className="p-2.5 text-right">Paid</th>
                                                                            <th className="p-2.5 text-right">Due</th>
                                                                            <th className="p-2.5 text-center">Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                                                        {distributions.map((dist: any, idx: number) => {
                                                                            const isPaid = dist.payment_status === 'paid';
                                                                            const isPartial = dist.payment_status === 'partial';
                                                                            return (
                                                                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                                                                    <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100 capitalize">
                                                                                        {dist.service_provided_by?.replace('_', ' ')}
                                                                                    </td>
                                                                                    <td className="p-2.5 text-slate-550 dark:text-slate-400">
                                                                                        {dist.provider_name || '-'}
                                                                                    </td>
                                                                                    <td className="p-2.5 text-right text-slate-550 dark:text-slate-400 whitespace-nowrap">
                                                                                        {format(Number(dist.bill_amount))}
                                                                                    </td>
                                                                                    <td className="p-2.5 text-right text-red-500 font-medium whitespace-nowrap">
                                                                                        {Number(dist.less_amount) > 0 ? `-${format(Number(dist.less_amount))}` : '-'}
                                                                                    </td>
                                                                                    <td className="p-2.5 text-right font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                                                                        {format(Number(dist.final_bill))}
                                                                                    </td>
                                                                                    <td className="p-2.5 text-right font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                                                                                        {format(Number(dist.pay_now))}
                                                                                    </td>
                                                                                    <td className={`p-2.5 text-right font-bold whitespace-nowrap ${Number(dist.due_amount) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                                                                        {format(Number(dist.due_amount))}
                                                                                    </td>
                                                                                    <td className="p-2.5 text-center whitespace-nowrap">
                                                                                        {isPaid ? (
                                                                                            <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-950/20 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                                                                Paid
                                                                                            </span>
                                                                                        ) : isPartial ? (
                                                                                            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                                                                Partial
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-950/20 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:text-yellow-450 border border-yellow-200 dark:border-yellow-800">
                                                                                                Pending
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Amount Summary */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b py-2 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg">
                                        <Receipt className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100">Amount Summary</CardTitle>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Gross billing amount, discounts, payments, and outstanding due</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                                <Info label="Total Bill Amount" value={prelimTotal > 0 ? format(prelimTotal) : (a.total_bill_amount != null ? format(Number(a.total_bill_amount)) : '-')} />
                                <Info label="Total Discount" value={a.finalBill?.total_discount != null ? format(Number(a.finalBill.total_discount)) : '-'} />
                                <Info label="Final Bill (Net)" value={a.finalBill?.total_discounted_amount != null ? format(Number(a.finalBill.total_discounted_amount)) : (a.finalBill?.net_amount != null ? format(Number(a.finalBill.net_amount)) : '-')} />
                                <Info label="Total Paid" value={a.finalBill?.paid_amount != null ? format(Number(a.finalBill.paid_amount)) : (a.finalBill?.total_paid != null ? format(Number(a.finalBill.total_paid)) : '-')} />
                                <Info label="Due" value={a.finalBill?.due_amount != null ? format(Number(a.finalBill.due_amount)) : '-'} />
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-b py-2 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-lg">
                                        <FileText className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100">Actions</CardTitle>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Manage billing, final discharge, distributions, and printing</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 flex flex-wrap gap-2">
                                <Button variant="outline" onClick={() => navigate({ to: `${base}/billing` })}>
                                    <FileText className="h-4 w-4 mr-1" /> Billing
                                </Button>
                                <Button variant="outline" onClick={() => navigate({ to: `${base}/final-bill` })} disabled={!a.bill_created}>
                                    <Receipt className="h-4 w-4 mr-1" /> Final Bill
                                </Button>
                                <Button variant="outline" onClick={() => navigate({ to: `${base}/distribute-bill` })} disabled={!a.final_bill_created}>
                                    <Scale className="h-4 w-4 mr-1" /> Distribute Bill
                                </Button>
                                <Button variant="outline" onClick={() => navigate({ to: `${base}/confirm-balance` })} disabled={!a.bills_distributed}>
                                    <CheckCircle2 className="h-4 w-4 mr-1" /> Confirm Balance
                                </Button>
                                <Button variant="outline" onClick={() => navigate({ to: `${base}/print` })}>
                                    <Printer className="h-4 w-4 mr-1" /> Print
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                )}
            </Main>
        </>
    )
}
