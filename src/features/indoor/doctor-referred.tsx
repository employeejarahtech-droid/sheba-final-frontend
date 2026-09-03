import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus, DollarSign, TrendingUp, Activity, StickyNote, X } from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'

const API_URL = import.meta.env.VITE_API_URL

type DoctorReferred = {
  id: number
  admission_prefix: string | null
  patient_name: string
  age: number | null
  age_text: string | null
  sex: string | null
  phone: string | null
  father_name?: string | null
  address?: string | null
  id_card_number?: string | null
  admission_date: string
  admission_time?: string | null
  discharge_date: string | null
  status: 'active' | 'discharged' | 'critical'
  diagnosis: string | null
  referral_note?: string | null
  doctor: {
    id: number
    doctor_name: string
    speciality: string
  } | null
  referredByDoctor: {
    id: number
    doctor_name: string
    speciality: string
  } | null
  bedCabin?: {
    id: number
    code: string
    type: string
    ward: string
  }
  finalBill?: {
    id: number
    total_bill_amount: number
    total_discount: number
    total_discounted_amount: number
    paid_amount: number
    due_amount: number
    status: 'pending' | 'partial' | 'paid' | 'cancelled'
    payment_count?: number
  }
  payments?: Array<{ id: number; payment_date: string; payment_method?: string | null; amount: number | string; created_by_user?: { name: string } | null }>
  bill_created?: number
  bill_created_date?: string | null
  bill_created_by_user?: { name: string } | null
  final_bill_created?: number
  final_bill_created_date?: string | null
  final_bill_created_by_user?: { name: string } | null
  discharged?: number
  discharged_date?: string | null
  discharged_by_user?: { name: string } | null
  payment_completed?: number
  payment_completed_date?: string | null
  payment_completed_by_user?: { name: string } | null
  bills_distributed?: number
  bills_distributed_date?: string | null
  bills_distributed_by_user?: { name: string } | null
  balance_distributed?: number
  balance_distributed_date?: string | null
  balance_distributed_by_user?: { name: string } | null
}

type ApiResponse<T> = {
  status: boolean
  data: T
  message?: string
}

interface DoctorReferredPageProps {
  page: number
  limit: number
  search: string
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
}

const getStatusBadgeHtml = (status: string) => {
  const variants: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Active' },
    discharged: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', label: 'Discharged' },
    critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Critical' },
  }
  const variant = variants[status] || variants.active
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variant.color}">${variant.label}</span>`
}

export function DoctorReferredPage({ page, limit, search, setPage, setLimit, setSearch }: DoctorReferredPageProps) {
  const { format, currencySymbol } = useCurrency()
  const token = getCookie('accessToken')
  const queryClient = useQueryClient()

  const [doctorFilter, setDoctorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [noteModal, setNoteModal] = useState<{ open: boolean; admissionId: string | null; patientName: string; note: string }>({
    open: false,
    admissionId: null,
    patientName: '',
    note: '',
  })

  // Fetch all admissions with doctor information. A high limit is passed
  // since this page reports on every referred admission, not just one page.
  const { data: admissionsData, isFetching, isError } = useQuery({
    queryKey: ['admissions-with-doctors'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/admission/?limit=5000`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch admissions')
      const result: ApiResponse<{ items: DoctorReferred[]; meta: unknown }> = await response.json()
      return result.data?.items || []
    },
    enabled: !!token,
  })

  const admissions = Array.isArray(admissionsData) ? admissionsData : []

  const updateNoteMutation = useMutation({
    mutationFn: async ({ admissionId, referral_note }: { admissionId: string; referral_note: string }) => {
      const response = await fetch(`${API_URL}/api/admission/${admissionId}/referral-note`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ referral_note }),
      })
      if (!response.ok) throw new Error('Failed to update referral note')
      return response.json()
    },
    onSuccess: () => {
      toast.success('Referral note updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admissions-with-doctors'] })
      setNoteModal({ open: false, admissionId: null, patientName: '', note: '' })
    },
    onError: () => {
      toast.error('Failed to update referral note')
    },
  })

  // Only admissions that actually came via a referring doctor
  // (referred_by_doctor_id) — distinct from `doctor`, the under-consultant
  // treating doctor.
  const referredPatients = useMemo(
    () => admissions.filter((a) => a.referredByDoctor !== null),
    [admissions]
  )

  // Distinct referring doctors, for the filter dropdown.
  const referringDoctors = useMemo(() => {
    const map = new Map<number, string>()
    referredPatients.forEach((a) => {
      if (a.referredByDoctor) map.set(a.referredByDoctor.id, a.referredByDoctor.doctor_name)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [referredPatients])

  // Apply filters + URL-synced search, then paginate client-side (all data
  // is already fetched in one bulk call above).
  const filteredPatients = useMemo(() => {
    let list = referredPatients

    if (doctorFilter !== 'all') {
      list = list.filter((a) => a.referredByDoctor?.id === Number(doctorFilter))
    }

    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.patient_name.toLowerCase().includes(q) ||
          a.diagnosis?.toLowerCase().includes(q) ||
          a.phone?.includes(search) ||
          a.referredByDoctor?.doctor_name.toLowerCase().includes(q)
      )
    }

    return list
  }, [referredPatients, doctorFilter, statusFilter, search])

  const total = filteredPatients.length
  const pagedPatients = useMemo(() => {
    const start = (page - 1) * limit
    return filteredPatients.slice(start, start + limit)
  }, [filteredPatients, page, limit])

  const totalPatients = referredPatients.length
  const totalActive = referredPatients.filter((a) => a.status === 'active').length
  const totalDischarged = referredPatients.filter((a) => a.status === 'discharged').length
  const totalRevenue = referredPatients.reduce(
    (sum, a) => sum + (a.finalBill ? Number(a.finalBill.total_discounted_amount) : 0),
    0
  )

  const statsCards = useMemo(() => [
    {
      label: 'Total Referrals',
      value: totalPatients,
      sub: `${referringDoctors.length} referring doctors`,
      icon: UserPlus,
    },
    {
      label: 'Active Patients',
      value: totalActive,
      sub: `${totalDischarged} discharged`,
      icon: Activity,
    },
    {
      label: 'Total Revenue',
      value: format(totalRevenue),
      sub: `From ${totalPatients} admissions`,
      icon: DollarSign,
    },
    {
      label: 'Avg. per Patient',
      value: format(totalPatients > 0 ? totalRevenue / totalPatients : 0),
      sub: 'Average bill amount',
      icon: TrendingUp,
    },
  ], [totalPatients, totalActive, totalDischarged, totalRevenue, referringDoctors.length, format])

  const columns = useMemo(() => [
    {
      data: 'admission_prefix',
      title: 'Admission ID',
      orderable: true,
      render: (data: any, _type: string, row: DoctorReferred) => {
        const displayId = data && data.toString().startsWith('ADM-') ? data : (data ? `ADM-${data}` : `ADM-${row.id}`)

        const admissionDate = row.admission_date ? new Date(row.admission_date).toLocaleDateString() : '-'
        const dischargeDate = row.discharge_date ? new Date(row.discharge_date).toLocaleDateString() : '-'
        const bedCabinInfo = row.bedCabin ? `${row.bedCabin.code} (${row.bedCabin.type})` : '-'
        const doctorName = row.doctor?.doctor_name || '-'
        const referredByName = row.referredByDoctor?.doctor_name || '-'
        const finalBillData = row.finalBill ? JSON.stringify(row.finalBill) : ''
        const paymentsData = JSON.stringify(row.payments || [])

        const statusData = {
          bill_created: row.bill_created || 0,
          bill_created_date: row.bill_created_date || '',
          bill_created_by_user: row.bill_created_by_user || null,
          final_bill_created: row.final_bill_created || 0,
          final_bill_created_date: row.final_bill_created_date || '',
          final_bill_created_by_user: row.final_bill_created_by_user || null,
          discharged: row.discharged || 0,
          discharged_date: row.discharged_date || '',
          discharged_by_user: row.discharged_by_user || null,
          payment_completed: row.payment_completed || 0,
          payment_completed_date: row.payment_completed_date || '',
          payment_completed_by_user: row.payment_completed_by_user || null,
          bills_distributed: row.bills_distributed || 0,
          bills_distributed_date: row.bills_distributed_date || '',
          bills_distributed_by_user: row.bills_distributed_by_user || null,
          balance_distributed: row.balance_distributed || 0,
          balance_distributed_date: row.balance_distributed_date || '',
          balance_distributed_by_user: row.balance_distributed_by_user || null,
        }

        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                    type="button"
                    data-id="${row.id}"
                    data-patient-name="${(row.patient_name || '-').replace(/"/g, '&quot;')}"
                    data-age="${row.age_text || row.age || ''}"
                    data-sex="${row.sex || '-'}"
                    data-phone="${row.phone || '-'}"
                    data-id-card-number="${row.id_card_number || '-'}"
                    data-admission-date="${admissionDate}"
                    data-discharge-date="${dischargeDate}"
                    data-status="${row.status || '-'}"
                    data-bed-cabin="${bedCabinInfo.replace(/"/g, '&quot;')}"
                    data-doctor="${doctorName.replace(/"/g, '&quot;')}"
                    data-referred-by="${referredByName.replace(/"/g, '&quot;')}"
                    data-father-name="${(row.father_name || '-').replace(/"/g, '&quot;')}"
                    data-address="${(row.address || '-').replace(/"/g, '&quot;')}"
                    data-admission-time="${(row.admission_time || '-').replace(/"/g, '&quot;')}"
                    data-diagnosis="${(row.diagnosis || '-').replace(/"/g, '&quot;')}"
                    data-final-bill="${finalBillData.replace(/"/g, '&quot;')}"
                    data-payments="${encodeURIComponent(paymentsData)}"
                    data-status-data="${encodeURIComponent(JSON.stringify(statusData)).replace(/"/g, '&quot;')}">+</button>
            <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${displayId}</span>
          </div>
        `
      },
    },
    {
      data: 'patient_name',
      title: 'Patient',
      orderable: true,
      render: (_data: any, _type: string, row: DoctorReferred) => `
        <div>
          <div class="font-medium">${row.patient_name}</div>
          ${row.phone ? `<div class="text-xs text-muted-foreground">${row.phone}</div>` : ''}
        </div>
      `,
    },
    {
      data: 'age',
      title: 'Age/Sex',
      orderable: false,
      render: (_data: any, _type: string, row: DoctorReferred) => {
        const age = row.age_text || (row.age != null ? `${row.age} years` : '-')
        return `<span class="text-sm">${age}${row.sex ? ` / ${row.sex}` : ''}</span>`
      },
    },
    {
      data: 'admission_date',
      title: 'Admission Date',
      orderable: true,
      render: (data: any) => (data ? new Date(data).toLocaleDateString() : '-'),
    },
    {
      data: 'referredByDoctor',
      title: 'Referring Doctor',
      orderable: false,
      render: (_data: any, _type: string, row: DoctorReferred) => `
        <div>
          <div class="font-medium">${row.referredByDoctor?.doctor_name || '-'}</div>
          ${row.referredByDoctor?.speciality ? `<div class="text-xs text-muted-foreground">${row.referredByDoctor.speciality}</div>` : ''}
        </div>
      `,
    },
    {
      data: 'doctor',
      title: 'Consultant',
      orderable: false,
      render: (_data: any, _type: string, row: DoctorReferred) => row.doctor?.doctor_name || '-',
    },
    {
      data: 'diagnosis',
      title: 'Diagnosis',
      orderable: false,
      render: (data: any) => data || 'N/A',
    },
    {
      data: 'bedCabin',
      title: 'Bed',
      orderable: false,
      render: (_data: any, _type: string, row: DoctorReferred) =>
        row.bedCabin
          ? `<span class="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium">${row.bedCabin.code}</span>`
          : '-',
    },
    {
      data: 'status',
      title: 'Status',
      orderable: true,
      render: (data: any) => getStatusBadgeHtml(data),
    },
    {
      data: 'finalBill',
      title: `Bill Amount (${currencySymbol})`,
      orderable: false,
      className: 'text-right',
      render: (_data: any, _type: string, row: DoctorReferred) =>
        row.finalBill
          ? `<span class="font-semibold">${Number(row.finalBill.total_discounted_amount).toLocaleString()}</span>`
          : '-',
    },
    {
      data: 'referral_note',
      title: 'Referral Note',
      orderable: false,
      render: (data: any) =>
        data
          ? `<span class="text-sm truncate block max-w-[220px]" title="${String(data).replace(/"/g, '&quot;')}">${data}</span>`
          : `<span class="text-muted-foreground text-sm">-</span>`,
    },
    {
      data: 'actions',
      title: 'Actions',
      orderable: false,
      render: (_data: any, _type: string, row: DoctorReferred) => `
        <button class="note-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors"
                type="button"
                data-id="${row.id}"
                data-patient-name="${(row.patient_name || '-').replace(/"/g, '&quot;')}"
                data-note="${encodeURIComponent(row.referral_note || '')}">
          ${row.referral_note ? 'Edit Note' : 'Add Note'}
        </button>
      `,
    },
  ], [format, currencySymbol])

  // Handle expand button clicks in the Admission ID column — toggles a
  // detail row with patient info, status timeline and payment summary,
  // matching the pattern used on the bill-distributed list pages.
  useEffect(() => {
    const handleExpandClick = (e: Event) => {
      const button = (e.target as HTMLElement).closest('.expand-btn')
      if (!button) return

      const btn = button as HTMLButtonElement
      const row = btn.closest('tr')
      if (!row) return

      const isExpanded = row.classList.contains('expanded')
      const nextRow = row.nextElementSibling

      if (nextRow && nextRow.classList.contains('child-row-detail')) {
        nextRow.remove()
        row.classList.remove('expanded')
        btn.textContent = '+'
        btn.style.backgroundColor = '#10B981'
        return
      }

      if (isExpanded) return

      const id = btn.dataset.id || ''
      const patientName = btn.dataset.patientName || '-'
      const age = btn.dataset.age || '-'
      const sex = btn.dataset.sex || '-'
      const phone = btn.dataset.phone || '-'
      const idCardNumber = btn.dataset.idCardNumber || '-'
      const fatherName = btn.dataset.fatherName || '-'
      const address = btn.dataset.address || '-'
      const admissionTime = btn.dataset.admissionTime || '-'
      const referredBy = btn.dataset.referredBy || '-'
      const admissionDate = btn.dataset.admissionDate || '-'
      const dischargeDate = btn.dataset.dischargeDate || '-'
      const status = btn.dataset.status || '-'
      const bedCabin = btn.dataset.bedCabin || '-'
      const doctor = btn.dataset.doctor || '-'
      const diagnosis = btn.dataset.diagnosis || '-'
      const finalBillData = btn.dataset.finalBill ? JSON.parse(btn.dataset.finalBill) : null
      const paymentsData: Array<{ payment_date: string; payment_method?: string | null; amount: number | string; created_by_user?: { name: string } | null }> =
        btn.dataset.payments ? JSON.parse(decodeURIComponent(btn.dataset.payments)) : []
      const statusData = btn.dataset.statusData ? JSON.parse(decodeURIComponent(btn.dataset.statusData)) : {}

      let paymentInfoHtml = ''
      if (finalBillData) {
        const billStatus = finalBillData.status.charAt(0).toUpperCase() + finalBillData.status.slice(1)
        const statusColors: { [key: string]: string } = {
          pending: 'bg-yellow-100 text-yellow-800',
          partial: 'bg-blue-100 text-blue-800',
          paid: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800'
        }

        const paymentRowsHtml = paymentsData.length > 0
          ? paymentsData.map((p) => {
            const date = p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'
            const type = p.payment_method
              ? p.payment_method.charAt(0).toUpperCase() + p.payment_method.slice(1)
              : '-'
            const amountNum = Number(p.amount)
            const isRefund = amountNum < 0
            const collectedBy = p.created_by_user?.name || '-'
            return `
              <tr class='border-b border-muted last:border-b-0'>
                <td class='py-1.5 px-3 text-xs'>${date}</td>
                <td class='py-1.5 px-3 text-xs'>${type}</td>
                <td class='py-1.5 px-3 text-xs font-semibold ${isRefund ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}'>${format(amountNum)}</td>
                <td class='py-1.5 px-3 text-xs'>${collectedBy}</td>
              </tr>
            `
          }).join('')
          : `<tr><td colspan='4' class='py-2 px-3 text-xs text-muted-foreground'>No payments recorded yet</td></tr>`

        paymentInfoHtml = `
          <li class='col-span-2 bg-muted/30 p-3 rounded-lg'>
            <div class='flex items-center justify-between mb-2'>
              <div class='font-semibold'>Payment Information</div>
              <span class='px-2 py-0.5 rounded text-xs ${statusColors[finalBillData.status] || ''}'>${billStatus}</span>
            </div>
            <div class='grid grid-cols-3 gap-2 text-xs mb-3'>
              <div><strong>Total Amount:</strong> ${format(parseFloat(finalBillData.total_discounted_amount))}</div>
              <div><strong>Paid:</strong> ${format(parseFloat(finalBillData.paid_amount))}</div>
              <div><strong>Due:</strong> ${format(parseFloat(finalBillData.due_amount))}</div>
            </div>
            <div class='overflow-x-auto rounded-md border bg-white dark:bg-gray-900'>
              <table class='w-full text-left'>
                <thead class='bg-muted/40'>
                  <tr>
                    <th class='py-1.5 px-3 text-xs font-semibold'>Date</th>
                    <th class='py-1.5 px-3 text-xs font-semibold'>Type</th>
                    <th class='py-1.5 px-3 text-xs font-semibold'>Amount</th>
                    <th class='py-1.5 px-3 text-xs font-semibold'>Collected By</th>
                  </tr>
                </thead>
                <tbody>
                  ${paymentRowsHtml}
                </tbody>
              </table>
            </div>
          </li>
        `
      } else {
        paymentInfoHtml = `<li class='col-span-2 text-muted-foreground text-xs'>No payments recorded yet</li>`
      }

      const createStatusCard = (title: string, description: string, isCompleted: boolean, date: string | null, completedBy: string | null) => {
        const borderColor = isCompleted ? 'border-l-green-500' : 'border-l-gray-300 dark:border-l-gray-600'
        const textColor = isCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'
        const iconSvg = isCompleted
          ? `<svg class='w-4 h-4 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>`
          : `<svg class='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' stroke-width='2' stroke-dasharray='4 2'/></svg>`

        return `
          <div class='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${borderColor} border-l-4 p-4 transition-all hover:shadow-md'>
            <div class='flex items-start gap-3'>
              <div class='flex-shrink-0 mt-0.5'>
                <div class='w-8 h-8 rounded-full ${isCompleted ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'} flex items-center justify-center'>
                  ${iconSvg}
                </div>
              </div>
              <div class='flex-1 min-w-0'>
                <div class='flex items-center justify-between gap-2 mb-1'>
                  <h4 class='text-sm font-semibold ${textColor}'>${title}</h4>
                  ${isCompleted
                    ? `<span class='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'>Completed</span>`
                    : `<span class='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'>Pending</span>`
                  }
                </div>
                <p class='text-xs text-gray-500 dark:text-gray-400 mb-2'>${description}</p>
                ${isCompleted && date ? `
                  <div class='space-y-1'>
                    <div class='text-xs text-gray-600 dark:text-gray-400'>${date}</div>
                    ${completedBy ? `<div class='text-xs text-gray-600 dark:text-gray-400'>${completedBy}</div>` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `
      }

      const statusTrackingHtml = `
        <li class='col-span-2 space-y-4'>
          <h3 class='text-base font-bold text-gray-800 dark:text-gray-200 mb-2'>Status Tracking</h3>
          <div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            ${createStatusCard('Bill Created', 'Initial bill has been generated for the admission', statusData.bill_created === 1, statusData.bill_created_date || null, statusData.bill_created_by_user?.name || null)}
            ${createStatusCard('Final Bill', 'Final bill with all charges and discounts has been created', statusData.final_bill_created === 1, statusData.final_bill_created_date || null, statusData.final_bill_created_by_user?.name || null)}
            ${createStatusCard('Discharged', 'Patient has been discharged from the facility', statusData.discharged === 1, statusData.discharged_date || null, statusData.discharged_by_user?.name || null)}
            ${createStatusCard('Payment Completed', 'All payments have been received and cleared', statusData.payment_completed === 1, statusData.payment_completed_date || null, statusData.payment_completed_by_user?.name || null)}
            ${createStatusCard('Bills Distributed', 'Bills have been distributed to service providers', statusData.bills_distributed === 1, statusData.bills_distributed_date || null, statusData.bills_distributed_by_user?.name || null)}
            ${createStatusCard('Balance Distributed', 'All provider payments have been completed', statusData.balance_distributed === 1, statusData.balance_distributed_date || null, statusData.balance_distributed_by_user?.name || null)}
          </div>
        </li>
      `

      const safeFormatDate = (dateInput: string | null | undefined) => {
        if (!dateInput || dateInput === '-') return '-'
        const date = new Date(dateInput)
        if (isNaN(date.getTime())) return String(dateInput)
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      }

      const totalAmount = finalBillData ? parseFloat(finalBillData.total_discounted_amount) : 0
      const paidAmount = finalBillData ? parseFloat(finalBillData.paid_amount) : 0
      const dueAmount = finalBillData ? parseFloat(finalBillData.due_amount) : 0
      const paymentPercentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0

      const detailsHtml = `
        <div class='max-w-6xl mx-auto p-6 space-y-6'>
          <div class='bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg'>
            <div class='flex justify-between items-center'>
              <div>
                <h2 class='text-2xl font-bold'>Admission #${id}</h2>
                <p class='text-blue-100 text-sm'>${patientName} • ${bedCabin}</p>
              </div>
              <span class='px-4 py-1 text-sm rounded-full bg-white/20 backdrop-blur'>${status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
          </div>

          <div class='grid lg:grid-cols-3 gap-6'>
            <div class='lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-6'>
              <div>
                <h3 class='text-lg font-semibold mb-4 border-b pb-2 dark:border-gray-700'>Patient Information</h3>
                <div class='grid md:grid-cols-2 gap-4 text-sm'>
                  <div><span class='font-medium text-gray-500 dark:text-gray-400'>Age/Sex:</span> ${age} / ${sex.charAt(0).toUpperCase() + sex.slice(1).toLowerCase()}</div>
                  <div><span class='font-medium text-gray-500 dark:text-gray-400'>Phone:</span> ${phone}</div>
                  <div><span class='font-medium text-gray-500 dark:text-gray-400'>ID Card Number:</span> ${idCardNumber}</div>
                  <div><span class='font-medium text-gray-500 dark:text-gray-400'>Father Name:</span> ${fatherName}</div>
                  <div class='md:col-span-2'><span class='font-medium text-gray-500 dark:text-gray-400'>Address:</span> ${address}</div>
                  <div><span class='font-medium text-gray-500 dark:text-gray-400'>Consultant:</span> ${doctor}</div>
                  <div><span class='font-medium text-gray-500 dark:text-gray-400'>Referred By:</span> ${referredBy}</div>
                  <div class='md:col-span-2'><span class='font-medium text-gray-500 dark:text-gray-400'>Diagnosis / Treatment:</span> ${diagnosis}</div>
                  <div><span class='font-medium text-gray-500 dark:text-gray-400'>Admission Date:</span> ${safeFormatDate(admissionDate)} ${admissionTime !== '-' ? admissionTime : ''}</div>
                  <div><span class='font-medium text-gray-500 dark:text-gray-400'>Discharge Date:</span> ${safeFormatDate(dischargeDate)}</div>
                </div>
              </div>
            </div>

            <div class='bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-6 overflow-hidden'>
              <h3 class='text-lg font-semibold border-b pb-2 dark:border-gray-700'>Payment Summary</h3>
              ${finalBillData ? `
                <div class='space-y-3 text-sm'>
                  <div class='flex justify-between'>
                    <span class='text-gray-500 dark:text-gray-400'>Total Amount</span>
                    <span class='font-semibold'>${format(totalAmount)}</span>
                  </div>
                  <div class='flex justify-between text-green-600 dark:text-green-400'>
                    <span>Paid</span>
                    <span class='font-semibold'>${format(paidAmount)}</span>
                  </div>
                  <div class='flex justify-between text-red-500'>
                    <span>Due</span>
                    <span class='font-semibold'>${format(dueAmount)}</span>
                  </div>
                  <div class='pt-3'>
                    <div class='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                      <div class='bg-green-500 h-2 rounded-full' style='width: ${paymentPercentage}%'></div>
                    </div>
                    <p class='text-xs text-gray-500 dark:text-gray-400 mt-1'>${paymentPercentage}% Paid</p>
                  </div>
                </div>
              ` : `<p class='text-xs text-gray-500 dark:text-gray-400'>No final bill found.</p>`}

              <div class='flex flex-row flex-wrap gap-3 pt-4 w-full max-w-full box-border'>
                <a href="/dashboard/admission/patients/${id}/print" target="_blank" class='flex-1 min-w-[140px] text-center px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium shadow transition no-underline box-border'>
                  Print Details
                </a>
                <button onclick="window.location.href='/dashboard/admission/patients/${id}/billing'" class='flex-1 min-w-[140px] px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium shadow transition box-border'>
                  View Billing
                </button>
              </div>
            </div>
          </div>

          <ul class='grid grid-cols-1 gap-4'>
            ${paymentInfoHtml}
            ${statusTrackingHtml}
          </ul>
        </div>
      `

      const details = document.createElement('div')
      details.innerHTML = detailsHtml

      const newRow = document.createElement('tr')
      newRow.className = 'child-row-detail'
      const cell = document.createElement('td')
      cell.className = 'p-0'
      cell.colSpan = 10
      cell.appendChild(details)
      newRow.appendChild(cell)

      row.parentNode?.insertBefore(newRow, row.nextSibling)
      row.classList.add('expanded')
      btn.textContent = '−'
      btn.style.backgroundColor = '#dc2626'
    }

    document.addEventListener('click', handleExpandClick)
    return () => {
      document.removeEventListener('click', handleExpandClick)
    }
  }, [format])

  // Handle "Add Note" / "Edit Note" button clicks in the Actions column —
  // opens the referral note modal for that admission.
  useEffect(() => {
    const handleNoteClick = (e: Event) => {
      const button = (e.target as HTMLElement).closest('.note-btn')
      if (!button) return

      const btn = button as HTMLButtonElement
      setNoteModal({
        open: true,
        admissionId: btn.dataset.id || null,
        patientName: btn.dataset.patientName || '',
        note: btn.dataset.note ? decodeURIComponent(btn.dataset.note) : '',
      })
    }

    document.addEventListener('click', handleNoteClick)
    return () => {
      document.removeEventListener('click', handleNoteClick)
    }
  }, [])

  return (
    <>
      {noteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <StickyNote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Referral Note</h2>
                  {noteModal.patientName && (
                    <p className="text-xs text-muted-foreground">{noteModal.patientName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setNoteModal({ open: false, admissionId: null, patientName: '', note: '' })}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <Textarea
              value={noteModal.note}
              onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
              placeholder="Type a note about this referral..."
              rows={5}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setNoteModal({ open: false, admissionId: null, patientName: '', note: '' })}
                disabled={updateNoteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={updateNoteMutation.isPending || !noteModal.admissionId}
                onClick={() => {
                  if (!noteModal.admissionId) return
                  updateNoteMutation.mutate({ admissionId: noteModal.admissionId, referral_note: noteModal.note })
                }}
              >
                {updateNoteMutation.isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AppHeader fixed />
      <Main fluid className=" w-full flex-1 dark:bg-black/20">
        <div className="space-y-3 mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Doctor Referred Patients</h1>
            <p className="text-muted-foreground text-sm">
              All patients referred by doctors, with admission and billing details
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((card, index) => {
              const Icon = card.icon
              return (
                <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                  <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6'][index % 6] }}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white rounded-lg shadow-lg">
                        <Icon className="w-4 h-4" style={{ color: ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6'][index % 6] }} />
                      </div>
                      <CardTitle className="text-sm font-semibold text-white/90">{card.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="text-2xl font-bold">{card.value}</h3>
                    <p className="text-xs text-muted-foreground">{card.sub}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {isError ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-destructive text-lg font-semibold mb-2">Error loading data</p>
                <p className="text-muted-foreground">Please try again later</p>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              columns={columns}
              data={pagedPatients}
              meta={{ page, limit, total }}
              onPageChange={setPage}
              onLimitChange={setLimit}
              search={search}
              onSearchChange={setSearch}
              isLoading={isFetching}
              tableTitle="Referred Patients"
              filterSlot={
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Referring Doctor:</Label>
                    <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                      <SelectTrigger className="h-8 w-[180px]">
                        <SelectValue placeholder="All Doctors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Doctors</SelectItem>
                        {referringDoctors.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Status:</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="discharged">Discharged</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              }
            />
          )}
        </div>
      </Main>
    </>
  )
}
