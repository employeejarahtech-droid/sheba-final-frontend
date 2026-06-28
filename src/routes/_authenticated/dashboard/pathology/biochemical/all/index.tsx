import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
import { DataTable } from "@/components/DataTable";
import { Main } from "@/components/layout/main";
import { useEffect, useMemo, useState } from 'react';
import { getCookie } from '@/lib/cookies';
import { useDateFormat } from '@/hooks/use-date-format';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, CheckCircle, Clock, AlertCircle, Users, Check, Filter } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/date-field";

const biochemicalSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  status: z.string().catch('all'),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pathology/biochemical/all/')({
  validateSearch: (search) => biochemicalSearchSchema.parse(search),
  component: AllReportsBiochemical,
})


type ReportsItem = {
  ReciptID: number;
  PatientId: number | null;
  PatientName: string | null;
  Date: string | null;
  Tests: string;
  TestNames: string;
  Status: string;
  RefDoctor?: string | null;
};

function AllReportsBiochemical() {

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

  // Tenant date format (from company settings) + 12h time — matches the rest of the app.
  const { formatDateTime: fmtDateTime } = useDateFormat();

  const { data: biochemicalAllReports, isFetching } = useQuery({
    queryKey: ["biochemical-all", page, limit, search, statusFilter, from, to],
    queryFn: async () => {
      const statusParam = statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "";
      const fromParam = from ? `&from=${encodeURIComponent(from)}` : "";
      const toParam = to ? `&to=${encodeURIComponent(to)}` : "";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/biochemical-all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${statusParam}${fromParam}${toParam}`,
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
            meta: {
              page,
              limit,
              total: 0,
            },
          },
        },
  });


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
      const patientId = btn.dataset.patientId || '-';
      const patientName = btn.dataset.patientName || '-';
      const date = btn.dataset.date || '-';
      const tests = btn.dataset.tests || '-';
      const status = btn.dataset.status || '-';

      // Create details HTML
      const details = document.createElement('div');
      details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

      // Format date for header
      const formattedDate = date !== '-' ? date : '';

      // Status badge
      const statusBadge = status === 'Completed'
        ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Completed</span>`
        : `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900">Pending</span>`;

      // Build the HTML content
      let htmlContent = `
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold">Biochemical Test Receipt</h2>
              <p class="text-sm opacity-90">Receipt ID #${reciptId} • ${formattedDate}</p>
            </div>
            ${statusBadge}
          </div>
        </div>

        <!-- Patient Info -->
        <div class="p-6 border-b">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
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
            <div>
              <p class="text-gray-500">Department</p>
              <p class="font-semibold text-gray-800">Biochemical</p>
            </div>
          </div>
        </div>

        <!-- Tests Section -->
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-800">Test Results</h3>
          <div id="tests-container-${reciptId}" class="space-y-4">
            <div class="text-gray-500 text-sm">Loading report details...</div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <a href="/dashboard/pathology/biochemical/all/report/${reciptId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
            View Report
          </a>
          <a href="/dashboard/pathology/biochemical/all/edit/${reciptId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-5 transition shadow-md">
            Edit
          </a>
        </div>
      `;

      details.innerHTML = htmlContent;

      // Fetch and display test details
      const testsContainer = details.querySelector(`#tests-container-${reciptId}`);
      if (testsContainer) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/biochemical-all/${reciptId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const invoiceData = data.data;
            const biochemicalTests = invoiceData?.biochemical_all_info || [];

            if (biochemicalTests.length > 0) {
              // Build test results table similar to report format
              let testResultsHTML = `
                <div class="border rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                  <div class="flex justify-between items-center mb-3">
                    <span class="text-sm font-semibold text-gray-700">Receipt ID: ${reciptId}</span>
                    <span class="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                      Biochemical Tests
                    </span>
                  </div>

                  <!-- Test Results Table -->
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b">
                        <th class="px-2 py-2 text-left w-[40%]">Test Name</th>
                        <th class="px-2 py-2 text-left w-[60%]">Test Result</th>
                      </tr>
                    </thead>
                    <tbody>
              `;

              biochemicalTests.forEach((test: any) => {
                testResultsHTML += `
                  <tr class="border-b">
                    <td class="px-2 py-2">${test.test_name || '-'}</td>
                    <td class="px-2 py-2 font-medium whitespace-pre-wrap">${test.test_result || '-'}</td>
                  </tr>
                `;
              });

              testResultsHTML += `
                    </tbody>
                  </table>
                </div>
              `;

              testsContainer.innerHTML = testResultsHTML;
            } else {
              testsContainer.innerHTML = '<div class="text-gray-500 text-sm">No tests found</div>';
            }
          } else {
            testsContainer.innerHTML = '<div class="text-red-500 text-sm">Failed to load report details</div>';
          }
        } catch (error) {
          testsContainer.innerHTML = '<div class="text-red-500 text-sm">Failed to load report details</div>';
        }
      }

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
    };

    // Add event listener to document for delegation
    document.addEventListener('click', handleExpandClick);

    return () => {
      document.removeEventListener('click', handleExpandClick);
    };
  }, [token]);

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

  const columns = [
    {
      data: "ReciptID",
      title: "Receipt ID",
      orderable: true,
      render: (data: any, _type: string, row: ReportsItem) => {
        const date = fmtDateTime(row.Date);
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                    type="button"
                    data-recipt-id="${data}"
                    data-patient-id="${row.PatientId || '-'}"
                    data-patient-name="${(row.PatientName || '-').replace(/"/g, '&quot;')}"
                    data-date="${date}"
                    data-tests="${(row.Tests || '-').replace(/"/g, '&quot;')}"
                    data-status="${row.Status || '-'}">+</button>
            <span>${data}</span>
          </div>
        `;
      },
      defaultContent: "",
    },
    {
      data: "PatientName",
      title: "Patient Name",
      orderable: true,
      responsivePriority: 1,
      defaultContent: "",
      render: (data: any) => data || '-'
    },
    {
      data: "Date",
      title: "Date",
      orderable: true,
      responsivePriority: 2,
      defaultContent: "",
      render: (data: any) => fmtDateTime(data)
    },
    {
      data: "RefDoctor",
      title: "Ref. Doctor",
      orderable: true,
      defaultContent: "",
      render: (data: any) => data || '-'
    },
    {
      data: "TestNames",
      title: "Tests",
      orderable: false,
      responsivePriority: 1,
      defaultContent: "",
      render: (data: any, _type: string, row: ReportsItem) => {
        const testNames = data || row.Tests || '';

        if (!testNames) return '-';

        // Split comma-separated test names and display as badges
        const names = testNames.split(',').filter((name: string) => name.trim() !== '');
        return names.map((name: string) =>
          `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1">${name.trim()}</span>`
        ).join('');
      }
    },
    {
      data: 'TestCarriedOutBy',
      title: 'Test Carried Out By',
      render: (data: any) => {
        const value = data as string;
        return `<div class="text-sm">${value || `-`}</div>`;
      },
    },
    {
      data: "Status",
      title: "Status",
      orderable: true,
      responsivePriority: 3,
      defaultContent: "",
      render: (data: any) => {
        const status = data || 'Pending';
        const color = status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500';
        return `<span class="${color} text-white inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">${status}</span>`;
      }
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_data: any, _type: string, row: any) => {
        const id = row.ReciptID;
        return `
          <div class="flex flex-nowrap items-center gap-2">
            <a href="/dashboard/pathology/biochemical/all/edit/${id}" title="Edit report"
               class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              Edit
            </a>
            <a href="/dashboard/pathology/biochemical/all/report/${id}" target="_blank" rel="noopener noreferrer" title="Print / view report"
               class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-semibold shadow transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
              Print
            </a>
          </div>
        `;
      },
      defaultContent: "",
    },
  ];

  return (
    <>
      <AppHeader fixed />
      <main>
        <div className=" space-y-3">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                label: "Total Reports",
                value: biochemicalAllReports?.data?.meta?.total || 0,
                icon: FileText,
                grad: "from-blue-500 to-indigo-500",
                sub: "All time records"
              },
              {
                label: "Completed",
                value: biochemicalAllReports?.data?.items?.filter((i: any) => i.Status === 'Completed').length || 0,
                icon: CheckCircle,
                grad: "from-emerald-500 to-teal-500",
                sub: "Status Done"
              },
              {
                label: "Pending",
                value: biochemicalAllReports?.data?.items?.filter((i: any) => !i.Status || i.Status === 'Pending').length || 0,
                icon: Clock,
                grad: "from-amber-500 to-orange-500",
                sub: "Status Awaiting"
              },
              {
                label: "Patients",
                value: new Set(biochemicalAllReports?.data?.items?.map((i: any) => i.PatientId)).size || 0,
                icon: Users,
                grad: "from-purple-500 to-pink-500",
                sub: "Unique patients"
              }
            ].map((card, index) => {
              const Icon = card.icon;
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
                    <h3 className="text-2xl font-bold">
                      {card.value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <DataTable
            hideExport
            tableTitle="All Reports (Biochemical)"
            columns={columns}
            data={biochemicalAllReports?.data?.items || []}
            meta={biochemicalAllReports?.data?.meta}
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

