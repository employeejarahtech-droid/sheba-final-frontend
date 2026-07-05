import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod'
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useEffect } from 'react';
import { getCookie } from '@/lib/cookies';
import { useDateFormat } from '@/hooks/use-date-format';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';
import { FileText, Clock, Users, Activity, Scan, Check, Filter } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/date-field";
import { useState } from 'react';
import { useCan } from '@/hooks/use-can';
import { Main } from "@/components/layout/main";
import { EditCustomTestForm } from '@/features/pathology/custom-tests/components/EditCustomTestForm';

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  status: z.string().catch('all'),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pathology/custom-tests/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: CustomTestsReports,
})

type ReportsItem = {
  id: number;
  ReciptID: number;
  PatientId: number | null;
  PatientName: string | null;
  Date: string | null;
  Status: string;
};

function CustomTestsReports() {
  const can = useCan();
  const canEdit = true; // can('pathology.custom-tests.edit');
  const searchParams: any = Route.useSearch();
  const navigate: any = Route.useNavigate();

  const [open, setOpen] = useState<boolean>(false);
  const [reportId, setReportId] = useState<number | null>(null);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);

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

  const { data: customTestReports, isFetching, refetch } = useQuery({
    queryKey: ["custom-tests", page, limit, search, statusFilter, from, to],
    queryFn: async () => {
      const statusParam = statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "";
      const fromParam = from ? `&from=${encodeURIComponent(from)}` : "";
      const toParam = to ? `&to=${encodeURIComponent(to)}` : "";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/custom-tests-results?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${statusParam}${fromParam}${toParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch custom tests");
      return res.json();
    },
    enabled: !!token,
    placeholderData: (prev) =>
      prev
        ? prev
        : {
          data: {
            items: [],
            meta: { total: 0 }
          },
        },
  });

  // Expose edit function to window for onclick handlers
  useEffect(() => {
    (window as any).editCustomTest = (id: number, invoiceId: number) => {
      setOpen(true);
      setReportId(id);
      setInvoiceId(invoiceId);
    };
  }, [setOpen, setReportId, setInvoiceId]);

  // ---- Date filter presets
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
  const [openStatus, setOpenStatus] = useState(false);
  
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key];
    if (p) { setFrom(p.from); setTo(p.to); }
    setPresetOpen(false);
  };

  const columns = useMemo(() => [
    {
      data: "ReciptID",
      title: "Invoice ID",
      orderable: true,
      render: (data: any, _type: string, row: ReportsItem) => {
        return `
          <div class="flex items-center gap-2">
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
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_data: any, _type: string, row: ReportsItem) => {
        return `
          <div class="flex flex-nowrap items-center gap-2">
            ${canEdit ? `<a href="/dashboard/pathology/custom-tests/edit/${row.id}" title="Edit"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              Edit
            </a>` : ''}
            <a href="/dashboard/pathology/custom-tests/report/${row.id}" title="Print / view report"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-semibold shadow transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
              Print
            </a>
          </div>
        `;
      },
      defaultContent: "",
    },
  ], []);

  // Stats cards
  const items = customTestReports?.data?.items || [];
  const todayCount = items.filter((i: any) => {
    if (!i.Date) return false;
    const d = new Date(i.Date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const uniquePatients = new Set(items.map((i: any) => i.PatientName).filter(Boolean)).size;

  const stats = [
    { label: "Total Reports", value: customTestReports?.data?.meta?.total || 0, icon: FileText, grad: "from-slate-500 to-gray-500" },
    { label: "Custom Tests", value: items.length, icon: Scan, grad: "from-gray-500 to-slate-500" },
    { label: "Recent", value: todayCount, icon: Clock, grad: "from-sky-500 to-slate-500" },
    { label: "Patients", value: uniquePatients, icon: Users, grad: "from-indigo-500 to-purple-500" },
  ];

  return (
    <>
      <AppHeader fixed />
      <Main fluid>
        <div className="mb-4">
          <h1 className='text-2xl font-bold tracking-tight'>Custom Test Reports</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
          tableTitle="All Custom Test Reports"
          columns={columns}
          data={customTestReports?.data?.items || []}
          meta={{ page, limit, total: customTestReports?.data?.meta?.total || 0 }}
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
      </Main>
    </>
  )
}
