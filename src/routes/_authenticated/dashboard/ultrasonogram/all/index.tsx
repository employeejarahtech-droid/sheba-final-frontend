import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useEffect, useState } from 'react';
import { getCookie } from '@/lib/cookies';
import { useDateFormat } from '@/hooks/use-date-format';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, Clock, Users, ScanLine, Check, Filter } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/date-field";
import { useCan } from '@/hooks/use-can';

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  status: z.string().catch('all'),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute(
  '/_authenticated/dashboard/ultrasonogram/all/',
)({
  validateSearch: (search) => searchSchema.parse(search),
  component: AllUltrasonogramReports,
})


type ReportsItem = {
  ReciptID: number;
  PatientId: number | null;
  PatientName: string | null;
  Date: string | null;
  Tests: string;
  TestNames: string;
  Status: string;
};

function AllUltrasonogramReports() {
    const can = useCan();
    const canEdit = can('ultrasonogram.all.edit');
  const searchParams: any = Route.useSearch();
  const navigate: any = Route.useNavigate();

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";
  const statusFilter = searchParams?.status || "all";
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
  };
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
  };
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
  };
  const setStatusFilter = (newStatus: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, status: newStatus, page: 1 }) });
  };
  const setFrom = (newFrom: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
  };
  const setTo = (newTo: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
  };

  const token = getCookie('accessToken');
  const { formatDateTime: fmtDateTime } = useDateFormat();

  const { data: ultrasonogramAllReports, isFetching } = useQuery({
    queryKey: ["ultrasonogram-all", page, limit, search, statusFilter, from, to],
    queryFn: async () => {
      const statusParam = statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "";
      const fromParam = from ? `&from=${encodeURIComponent(from)}` : "";
      const toParam = to ? `&to=${encodeURIComponent(to)}` : "";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${statusParam}${fromParam}${toParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch tests");
      return res.json();
    },
    enabled: !!token,
    placeholderData: (prev) =>
      prev
        ? prev
        : {
          data: {
            items: [],
            total: 0,
          },
        },
  });

  // ---- Date filter presets (Filter By dropdown) — mirrors the invoices list.
  // Presets produce from/to (YYYY-MM-DD) which the API applies to
  // outdoor_invoice.invoice_date (the report date).
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  // Format as LOCAL YYYY-MM-DD. Do NOT use toISOString() — it converts to UTC and
  // shifts the date back one day in timezones east of UTC (e.g. UTC+6 → off-by-one).
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
  // Detect which preset (if any) currently matches the from/to in the URL
  const activePreset = useMemo(() => {
    if (!from || !to) return 'custom';
    const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to);
    return match ? match[0] : 'custom';
  }, [from, to, datePresets]);
  const [presetOpen, setPresetOpen] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key];
    if (p) { setFrom(p.from); setTo(p.to); }
    setPresetOpen(false);
  };

  const columns = useMemo(() => [
    {
      data: "ReciptID",
      title: "Receipt ID",
      orderable: true,
      render: (data: any, _type: string, row: ReportsItem) => {
        const date = fmtDateTime(row.Date);
        const status = row.Status || 'Pending';
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                    type="button"
                    data-recipt-id="${data}"
                    data-patient-id="${row.PatientId || "-"}"
                    data-patient-name="${(row.PatientName || "-").replace(/"/g, "&quot;")}"
                    data-date="${date}"
                    data-tests="${(row.Tests || "-").replace(/"/g, "&quot;")}"
                    data-status="${status}">+</button>
            <span>${data}</span>
          </div>
        `;
      },
      defaultContent: "",
    },
    {
      data: "PatientId",
      title: "Patient ID",
      orderable: true,
      defaultContent: "",
      render: (data: any) => data || '-',
    },
    {
      data: "PatientName",
      title: "Patient Name",
      orderable: true,
      defaultContent: "",
      render: (data: any) => data || '-',
    },
    {
      data: "Date",
      title: "Date",
      orderable: true,
      defaultContent: "",
      render: (data: any) => fmtDateTime(data),
    },
    {
      data: "TestNames",
      title: "Tests",
      orderable: false,
      defaultContent: "",
      render: (data: any, _type: string, row: ReportsItem) => {
        const testNames = data || row.Tests || '';
        if (!testNames) return '-';
        const names = testNames.split(',').filter((name: string) => name.trim() !== '');
        return names.map((name: string) =>
          `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1">${name.trim()}</span>`
        ).join('');
      },
    },
    {
      data: "Status",
      title: "Status",
      orderable: true,
      defaultContent: "",
      render: (data: any) => {
        if (!data) return '-';
        const statusColor = data === 'Completed' ? 'text-green-600' : 'text-yellow-600';
        return `<span class="${statusColor} font-medium">${data}</span>`;
      },
    },
  ], []);

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

      // Toggle collapse
      if (nextRow && nextRow.classList.contains('child-row-detail')) {
        nextRow.remove();
        row.classList.remove('expanded');
        btn.textContent = '+';
        btn.style.backgroundColor = '#10B981';
        return;
      }

      // Don't expand if already expanded
      if (isExpanded) return;

      // Get data from attributes
      const reciptId = btn.dataset.reciptId || '';

      // Fetch individual Ultrasonogram test details from API
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all/${reciptId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch Ultrasonogram details');

        const data = await res.json();
        const ultrasonogramTests = data.data?.ultrasonogram_all_info || [];

        // Create test cards HTML
        const testCards = ultrasonogramTests.map((test: any) => `
          <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
            <div class="flex justify-between items-start mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-sm font-semibold text-gray-700">Test ID: ${test.test_id || "-"}</span>
                  <span class="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pending</span>
                </div>
                <div class="text-sm">
                  <p class="text-gray-500">Test Name</p>
                  <p class="font-medium text-gray-800">${test.test_name || "-"}</p>
                </div>
              </div>
            </div>
            <div class="text-sm mb-3">
              <p class="text-gray-500">Test Result</p>
              <p class="font-medium text-gray-800 whitespace-pre-wrap">${test.test_result || "Pending..."}</p>
            </div>
            <div class="flex gap-2 pt-3 border-t">
              ${canEdit ? `<a href="/dashboard/ultrasonogram/all/edit/builder/${test.serial_id || test.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                Edit
              </a>` : ''}
              <a href="/dashboard/ultrasonogram/all/print/${test.serial_id || test.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-semibold shadow transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                Print
              </a>
            </div>
          </div>
        `).join('');

        // Extract data for display
        const invoiceInfo = data.data?.invoice_information || {};
        const patientId = btn.dataset.patientId || '-';
        const patientName = invoiceInfo.patient_name || btn.dataset.patientName || '-';
        const formattedDate = invoiceInfo.invoice_date ? new Date(invoiceInfo.invoice_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : btn.dataset.date || '-';
        const status = btn.dataset.status || 'Pending';
        const statusBadge = status === 'Completed'
          ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Completed</span>`
          : `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900">Pending</span>`;

        // Create card-style details HTML
        const details = document.createElement('div');
        details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

        // Build the HTML content
        let htmlContent = `
          <!-- Header -->
          <div class="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-5">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-xl font-semibold">Ultrasonogram Examination Report</h2>
                <p class="text-sm opacity-90">Receipt ID #${reciptId} • ${formattedDate}</p>
              </div>
              ${statusBadge}
            </div>
          </div>

          <!-- Patient Info -->
          <div class="p-6 border-b">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p class="text-gray-500">Receipt ID</p>
                <p class="font-semibold text-gray-800">${reciptId}</p>
              </div>
              <div>
                <p class="text-gray-500">Patient ID</p>
                <p class="font-semibold text-gray-800">${patientId}</p>
              </div>
              <div>
                <p class="text-gray-500">Patient Name</p>
                <p class="font-semibold text-gray-800">${patientName}</p>
              </div>
              <div>
                <p class="text-gray-500">Date</p>
                <p class="font-semibold text-gray-800">${formattedDate}</p>
              </div>
            </div>
          </div>

          <!-- Tests Section -->
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-800">Ultrasonogram Examinations</h3>
            <div class="space-y-4">
              ${testCards || '<div class="text-gray-500 text-sm">No Ultrasonogram tests found</div>'}
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
            ${canEdit ? `<a href="/dashboard/ultrasonogram/all/edit/${reciptId}"
               class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 h-10 px-5 transition shadow-md">
              Edit All
            </a>` : ''}
          </div>
        `;

        details.innerHTML = htmlContent;

        // Create new row
        const newRow = document.createElement('tr');
        newRow.className = 'child-row-detail';
        const cell = document.createElement('td');
        cell.className = 'p-4 bg-gray-50';
        cell.colSpan = 7;
        cell.appendChild(details);
        newRow.appendChild(cell);

        row.parentNode?.insertBefore(newRow, row.nextSibling);
        row.classList.add('expanded');
        btn.textContent = '−';
        btn.style.backgroundColor = '#dc2626';
      } catch (error) {
        // silently handle error
      }
    };

    // Add event listener to document for delegation
    document.addEventListener('click', handleExpandClick);

    return () => {
      document.removeEventListener('click', handleExpandClick);
    };
  }, [token]);

  // Stats cards (same design as List of Tests)
  const items = ultrasonogramAllReports?.data?.items || [];
  const todayCount = items.filter((i: any) => {
    if (!i.Date) return false;
    const d = new Date(i.Date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const uniquePatients = new Set(items.map((i: any) => i.PatientName).filter(Boolean)).size;

  const stats = [
    { label: "Total Reports", value: ultrasonogramAllReports?.data?.meta?.total || 0, icon: FileText, grad: "from-teal-500 to-cyan-500" },
    { label: "Ultrasonogram", value: items.length, icon: ScanLine, grad: "from-cyan-500 to-blue-500" },
    { label: "Recent", value: todayCount, icon: Clock, grad: "from-emerald-500 to-teal-500" },
    { label: "Patients", value: uniquePatients, icon: Users, grad: "from-indigo-500 to-purple-500" },
  ];

  return (
    <>
      <AppHeader fixed />
      <main>
        <div className="p-4 space-y-3">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                  <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white rounded-lg shadow-lg">
                        <Icon className="w-4 h-4" style={{ color: ['#10B981','#F97316','#EC4899','#14B8A6','#F59E0B','#3B82F6'][index % 6] }} />
                      </div>
                      <CardTitle className="text-sm font-semibold text-white/90">{card.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="text-2xl font-bold">{card.value || 0}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <DataTable
            hideExport
            tableTitle="All Reports (Ultrasonogram)"
            columns={columns}
            data={ultrasonogramAllReports?.data?.items || []}
            meta={{ page, limit, total: ultrasonogramAllReports?.data?.meta?.total || 0 }}
            onPageChange={setPage}
            onLimitChange={setLimit}
            search={search}
            onSearchChange={setSearch}
            isLoading={isFetching}
            filterSlot={
              <>
                <Popover open={openStatus} onOpenChange={setOpenStatus}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      {statusFilter !== "all" ? `Status: ${statusFilter}` : "Filter Status"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search status..." />
                      <CommandList>
                        <CommandEmpty>No status found.</CommandEmpty>
                        <CommandGroup>
                          {["all", "Completed", "Pending"].map((status) => (
                            <CommandItem
                              key={status}
                              value={status}
                              onSelect={(currentValue) => {
                                setStatusFilter(currentValue === statusFilter ? "all" : currentValue)
                                setOpenStatus(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  statusFilter === status ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {status === "all" ? "All Status" : status}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                </div>
              </>
            }
          />
        </div>
      </main>
    </>

  )
}
