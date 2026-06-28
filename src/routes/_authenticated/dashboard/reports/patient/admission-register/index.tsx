import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserCheck, UserX, Hash, Printer, FileText, Bed, Stethoscope, Calendar } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'
import { z } from 'zod'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

const admissionSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  from: z.string().catch(''),
  to: z.string().catch(''),
  status: z.string().catch(''),
})

interface AdmissionItem {
  id: number
  admission_prefix: string | null
  patient_name: string
  age: number | null
  sex: string | null
  admission_date: string | null
  admission_time: string | null
  discharge_date: string | null
  discharge_time: string | null
  phone: string | null
  status: string | null
  diagnosis: string | null
  total_bill_amount: number | null
  paid_amount: number | null
  due_amount: number | null
  doctor?: {
    doctor_name: string | null
    title?: string | null
    qualification?: string | null
    speciality?: string | null
  } | null
  doctor_name: string | null
  bedCabin?: {
    code: string | null
    type: string | null
    ward: string | null
  } | null
  bed_name: string | null
  ward_name: string | null
  department_name: string | null
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const Route = createFileRoute('/_authenticated/dashboard/reports/patient/admission-register/')({
  validateSearch: (search) => admissionSearchSchema.parse(search),
  component: AdmissionRegisterPage,
})

function AdmissionRegisterPage() {
  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();
  const { formatDate } = useDateFormat();

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";
  const status = searchParams?.status || "";

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
  };
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
  };
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
  };
  const setFrom = (newFrom: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
  };
  const setTo = (newTo: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
  };
  const setStatus = (newStatus: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, status: newStatus, page: 1 }) });
  };

  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['admission-register', page, limit, search, from, to, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        ...(from ? { start_date: from } : {}),
        ...(to ? { end_date: to } : {}),
        ...(status ? { status } : {}),
      })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admission?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch admission data')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : { data: { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } },
  })

  const items: AdmissionItem[] = data?.data?.items || []
  const meta: Meta = data?.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Calculate statistics
  const stats = useMemo(() => {
    const activeCount = items.filter((i) => i.status === 'active').length
    const dischargedCount = items.filter((i) => i.status === 'discharged').length
    const maleCount = items.filter((i) => i.patient_gender === 'male').length
    const femaleCount = items.filter((i) => i.patient_gender === 'female').length

    return [
      { label: 'Total Admissions', value: meta.total, icon: Users, grad: 'from-green-500 to-green-600' },
      { label: 'Active Patients', value: activeCount, icon: UserCheck, grad: 'from-blue-500 to-blue-600' },
      { label: 'Discharged', value: dischargedCount, icon: UserX, grad: 'from-orange-500 to-orange-600' },
      { label: 'This Page', value: items.length, icon: Hash, grad: 'from-teal-500 to-teal-600' },
      { label: 'Male Patients', value: maleCount, icon: Stethoscope, grad: 'from-pink-500 to-pink-600' },
      { label: 'Female Patients', value: femaleCount, icon: Bed, grad: 'from-yellow-500 to-yellow-600' },
    ]
  }, [items, meta])

  // ---- Date filter presets ----
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const datePresets = useMemo(() => ({
    today: { label: 'Today', from: toYMD(today()), to: toYMD(today()) },
    yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { label: 'Yesterday', from: toYMD(d), to: toYMD(d) }; })(),
    last7: { label: 'Last 7 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6); return d; })()), to: toYMD(today()) },
    last15: { label: 'Last 15 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 14); return d; })()), to: toYMD(today()) },
    last30: { label: 'Last 30 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29); return d; })()), to: toYMD(today()) },
    last45: { label: 'Last 45 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 44); return d; })()), to: toYMD(today()) },
    last60: { label: 'Last 60 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 59); return d; })()), to: toYMD(today()) },
    last90: { label: 'Last 90 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89); return d; })()), to: toYMD(today()) },
    last180: { label: 'Last 180 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 179); return d; })()), to: toYMD(today()) },
    last365: { label: 'Last 365 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 364); return d; })()), to: toYMD(today()) },
  }), []);

  const activePreset = useMemo(() => {
    if (!from || !to) return 'custom';
    const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to);
    return match ? match[0] : 'custom';
  }, [from, to, datePresets]);

  const [presetOpen, setPresetOpen] = useState(false);
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key];
    if (p) { setFrom(p.from); setTo(p.to); }
    setPresetOpen(false);
  };

  // Handle expand button clicks
  useEffect(() => {
    const handleExpandClick = async (e: Event) => {
      const button = (e.target as HTMLElement).closest('.expand-btn');
      if (!button) return;

      const btn = button as HTMLButtonElement;
      const row = btn.closest('tr');
      if (!row) return;

      const isExpanded = row.classList.contains('expanded');
      const nextRow = row.nextElementSibling;

      if (nextRow && nextRow.classList.contains('child-row-detail')) {
        nextRow.remove();
        row.classList.remove('expanded');
        btn.textContent = '+';
        btn.style.backgroundColor = '#10B981';
        return;
      }

      if (isExpanded) return;

      const id = btn.dataset.id || '';

      const details = document.createElement('div');
      details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

      details.innerHTML = `
        <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4">
          <h2 class="text-xl font-semibold">Admission Details</h2>
          <p class="text-sm opacity-90">Admission #${id}</p>
        </div>
        <div class="p-6">
          <div id="admission-details-${id}" class="text-gray-500 text-sm">
            Loading admission details...
          </div>
        </div>
      `;

      const newRow = document.createElement('tr');
      newRow.className = 'child-row-detail';
      const cell = document.createElement('td');
      cell.className = 'p-4 bg-gray-50';
      cell.colSpan = row.cells.length;
      cell.appendChild(details);
      newRow.appendChild(cell);

      row.parentNode?.insertBefore(newRow, row.nextSibling);
      row.classList.add('expanded');
      btn.textContent = '−';
      btn.style.backgroundColor = '#dc2626';

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admission/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch admission details");

        const result = await res.json();
        const admission = result.data;

        const formatDateTime = (date: string | null, time: string | null) => {
          if (!date) return '-';
          const dateStr = formatDate(new Date(date));
          return time ? `${dateStr} ${time}` : dateStr;
        };

        const admissionDetailsHTML = `
          <div class="space-y-6">
            <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm border-b pb-6">
              <div>
                <p class="text-gray-500">Admission No</p>
                <p class="font-semibold text-gray-800">${admission.admission_prefix || admission.id || '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Status</p>
                <p class="font-semibold capitalize">${admission.status || '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Patient Name</p>
                <p class="font-semibold text-gray-800">${admission.patient_name || '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Phone</p>
                <p class="font-semibold text-gray-800">${admission.phone || '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Age / Gender</p>
                <p class="font-semibold text-gray-800">${admission.age ? `${admission.age} yrs` : '-'} / ${admission.sex?.toUpperCase() || '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Doctor</p>
                <p class="font-semibold text-gray-800">${admission.doctor?.doctor_name || '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Admission Date</p>
                <p class="font-semibold text-gray-800">${formatDateTime(admission.admission_date, admission.admission_time)}</p>
              </div>
              <div>
                <p class="text-gray-500">Discharge Date</p>
                <p class="font-semibold text-gray-800">${formatDateTime(admission.discharge_date, admission.discharge_time)}</p>
              </div>
              <div class="col-span-2">
                <p class="text-gray-500">Bed/Cabin</p>
                <p class="font-semibold text-gray-800">${admission.bedCabin ? `${admission.bedCabin.code} (${admission.bedCabin.type}) - ${admission.bedCabin.ward}` : '-'}</p>
              </div>
              ${admission.diagnosis ? `
              <div class="col-span-2">
                <p class="text-gray-500">Diagnosis</p>
                <p class="font-semibold text-gray-800">${admission.diagnosis}</p>
              </div>
              ` : ''}
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t">
              <a href="/dashboard/admission/patients/${id}/billing-print"
                 class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
                Print Billing
              </a>
              <a href="/dashboard/admission/patients/${id}"
                 class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-5 transition shadow-md">
                View Details
              </a>
            </div>
          </div>
        `;

        const container = document.getElementById(`admission-details-${id}`);
        if (container) {
          container.innerHTML = admissionDetailsHTML;
        }
      } catch (error) {
        console.error('Error fetching admission details:', error);
        const container = document.getElementById(`admission-details-${id}`);
        if (container) {
          container.innerHTML = `
            <div class="text-red-500 text-sm">
              Failed to load admission details. Please try again.
            </div>
          `;
        }
      }
    };

    document.addEventListener('click', handleExpandClick);

    return () => {
      document.removeEventListener('click', handleExpandClick);
    };
  }, [token, formatDate]);

  const columns = [
    {
      data: null,
      title: "Admission No",
      orderable: true,
      render: (_data: any, _type: string, row: AdmissionItem) => {
        const value = row.admission_prefix || `ADM-${String(row.id).padStart(4, '0')}`;
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                    type="button"
                    data-id="${row.id}">+</button>
            <span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${value}</span>
          </div>
        `;
      },
    },
    {
      data: "patient_name",
      title: "Patient Name",
      render: (data: string) => {
        return `<div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <span class="font-medium">${data || '-'}</span>
        </div>`
      },
    },
    {
      data: "age",
      title: "Age",
      render: (data: number | null) => data ? `${data} yrs` : '-',
    },
    {
      data: "sex",
      title: "Gender",
      render: (data: string | null) => {
        const gender = (data || '').toLowerCase()
        if (!gender) return '-'
        const colorMap: Record<string, string> = {
          male: 'bg-blue-100 text-blue-700',
          female: 'bg-pink-100 text-pink-700',
          other: 'bg-gray-100 text-gray-700',
        }
        const colorClass = colorMap[gender] || 'bg-gray-100 text-gray-700'
        return `<span class="px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}">${gender}</span>`
      },
    },
    {
      data: "phone",
      title: "Phone",
      render: (data: string | null) => data ? `<span class="font-mono text-xs">${data}</span>` : '-',
    },
    {
      data: "admission_date",
      title: "Admission Date",
      render: (data: string | null) => {
        if (!data) return '-'
        const date = new Date(data)
        return `<div class="text-sm">
          <div>${formatDate(date)}</div>
        </div>`
      },
    },
    {
      data: null,
      title: "Ward/Bed",
      render: (_data: any, _type: string, row: AdmissionItem) => {
        const ward = row.bedCabin?.ward || row.ward_name || '-'
        const bed = row.bedCabin?.code || row.bed_name || '-'
        return `<div class="text-sm">
          <div class="font-medium">${ward}</div>
          <div class="text-xs text-gray-500">${bed}</div>
        </div>`
      },
    },
    {
      data: null,
      title: "Doctor",
      render: (_data: any, type: string, row: AdmissionItem) => {
        const d = row.doctor
        const plainName = d?.doctor_name || row.doctor_name || null
        if (!plainName) return '-'
        if (type === 'sort' || type === 'filter' || type === 'type') return plainName
        const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const subtitle = [d?.qualification || d?.title, d?.speciality].filter(Boolean).join(' - ')
        return `<div class="flex flex-col">
          <span class="font-medium">Dr. ${esc(plainName)}</span>
          ${subtitle ? `<span class="text-xs text-muted-foreground">${esc(subtitle)}</span>` : ''}
        </div>`
      },
    },
    {
      data: null,
      title: "Department",
      render: (_data: any, _type: string, row: AdmissionItem) => {
        const dept = row.department_name || '-';
        return `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">${dept}</span>`
      },
    },
    {
      data: "discharge_date",
      title: "Discharge Date",
      render: (data: string | null) => {
        if (!data) return `<span class="text-gray-400 italic">Not discharged</span>`
        const date = new Date(data)
        return `<div class="text-sm">
          <div>${formatDate(date)}</div>
        </div>`
      },
    },
    {
      data: "status",
      title: "Status",
      render: (data: string | null) => {
        const status = (data || '').toLowerCase()
        const colorMap: Record<string, { color: string; label: string }> = {
          discharged: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Discharged' },
          active: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Active' },
          critical: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' },
        }
        const config = colorMap[status] || { color: 'bg-gray-100 text-gray-700', label: status || '-' }
        return `<span class="px-3 py-1 rounded-full text-xs font-semibold capitalize border ${config.color}">${config.label}</span>`
      },
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: AdmissionItem) => {
        const id = row.id;
        return `<div class="flex gap-2">
          <a href="/dashboard/admission/patients/${id}/billing-print" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
            Print
          </a>
          <a href="/dashboard/admission/patients/${id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M3 9l3 3-3 3"/><path d="M14 8V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v12"/><path d="M20 18v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4"/><path d="M22 8h-6"/></svg>
            View
          </a>
        </div>`;
      },
    },
  ]

  return (
    <>
      <AppHeader
        title="Admission Register"
        description="Complete record of patient admissions with filtering, search, and expandable details"
        fixed
      />

      <main className="">
        {/* Enhanced Stats Cards - 6 cards in 2 rows */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const colors = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']
            return (
              <Card key={index} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: colors[index % 6] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <Icon className="w-4 h-4" style={{ color: colors[index % 6] }} />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white/90">{stat.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DataTable
          tableTitle="Admission Register List"
          columns={columns}
          data={items}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoading}
          filterSlot={
            <div className="flex items-center gap-1.5">
              <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[140px] h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="discharged">Discharged</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
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
              <DateField
                value={from}
                onChange={(v: string) => { setFrom(v); setPresetOpen(false); }}
                placeholder="From"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <DateField
                value={to}
                onChange={(v: string) => { setTo(v); setPresetOpen(false); }}
                placeholder="To"
              />
              {(from || to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFrom(""); setTo(""); }}
                >
                  Clear
                </Button>
              )}
              <Link
                to="/dashboard/reports/patient/admission-register/print"
                search={{
                  search: search || undefined,
                  start_date: from || undefined,
                  end_date: to || undefined,
                  status: status || undefined,
                }}
              >
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
              </Link>
            </div>
          }
          emptyState={
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No admission records found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          }
        />
      </main>
    </>
  )
}
