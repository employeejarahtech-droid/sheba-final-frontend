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

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  status: z.string().catch('all'),
  template: z.string().catch('all'),
  from: z.string().catch(''),
  to: z.string().catch(''),
  orderBy: z.string().optional(),
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
  ref_doctor?: string | null;
  TestName?: string | null;
  ReportTemplate?: string | null;
  Date: string | null;
  Status: string;
};

function CustomTestsReports() {
  const can = useCan();
  const canEdit = true; // can('pathology.custom-tests.edit');
  const searchParams: any = Route.useSearch();
  const navigate: any = Route.useNavigate();

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";
  const statusFilter = searchParams?.status || "all";
  const templateFilter = searchParams?.template || "all";
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";
  const orderBy = searchParams?.orderBy || "DESC";

  // Reflect the default sort (Receipt ID DESC) in the URL.
  useEffect(() => {
    if (!searchParams?.orderBy) {
      navigate({ to: '.', search: (prev: any) => ({ ...prev, orderBy: 'DESC' }), replace: true });
    }
  }, []);

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
  const setTemplateFilter = (newTemplate: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, template: newTemplate, page: 1 }) });
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
    queryKey: ["custom-tests", page, limit, search, statusFilter, templateFilter, from, to, orderBy],
    queryFn: async () => {
      const statusParam = statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "";
      const templateParam = templateFilter !== "all" ? `&template=${encodeURIComponent(templateFilter)}` : "";
      const fromParam = from ? `&from=${encodeURIComponent(from)}` : "";
      const toParam = to ? `&to=${encodeURIComponent(to)}` : "";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/custom-tests-results?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${statusParam}${templateParam}${fromParam}${toParam}&orderBy=${encodeURIComponent(orderBy)}`,
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

  // Report Template dropdown options — custom-form-designer test tables only
  // (these are the only ones that populate the "Report Template" column/data).
  const { data: reportTemplatesData } = useQuery({
    queryKey: ["custom-tests-report-templates"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/test-tables?limit=500`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch report templates");
      return res.json();
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
  const reportTemplateOptions = useMemo(() => {
    const items = reportTemplatesData?.data?.items || [];
    return items
      .filter((t: any) => t.is_custom_form_designer)
      .map((t: any) => ({ id: String(t.id), label: t.display_name }));
  }, [reportTemplatesData]);
  const activeTemplateLabel = useMemo(() => {
    if (templateFilter === "all") return null;
    return reportTemplateOptions.find((o: any) => o.id === templateFilter)?.label || null;
  }, [templateFilter, reportTemplateOptions]);

  // Handle expand button clicks — mirrors the hormone/all expand panel.
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
      const reportId = btn.dataset.reportId || '';
      const reciptId = btn.dataset.reciptId || '-';
      const patientName = btn.dataset.patientName || '-';
      const refDoctor = btn.dataset.refDoctor || '-';
      const testName = btn.dataset.testName || '-';
      const reportTemplate = btn.dataset.reportTemplate || '-';
      const date = btn.dataset.date || '-';
      const status = btn.dataset.status || 'Pending';

      // Create details HTML
      const details = document.createElement('div');
      details.className = 'max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden';

      const formattedDate = date !== '-' ? date : '-';

      const statusBadge = status === 'Completed'
        ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-50 ring-1 ring-inset ring-emerald-400/40"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>Completed</span>`
        : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-50 ring-1 ring-inset ring-amber-300/40"><span class="h-1.5 w-1.5 rounded-full bg-amber-300"></span>Pending</span>`;

      const infoField = (label: string, value: string) => `
        <div class="min-w-0">
          <p class="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">${label}</p>
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate" title="${value}">${value || '-'}</p>
        </div>
      `;

      const htmlContent = `
        <!-- Header -->
        <div class="bg-gradient-to-r from-slate-700 to-gray-700 text-white px-6 py-5">
          <div class="flex justify-between items-start gap-4">
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-white/10 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold leading-tight">${testName !== '-' ? testName : 'Custom Test Report'}</h2>
                <p class="text-sm text-white/70">Invoice #${reciptId} &bull; ${formattedDate}</p>
              </div>
            </div>
            ${statusBadge}
          </div>
        </div>

        <!-- Patient / Test Info -->
        <div class="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-white/[0.02]">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            ${infoField('Invoice ID', reciptId)}
            ${infoField('Patient Name', patientName)}
            ${infoField('Ref. By', refDoctor)}
            ${infoField('Test Name', testName)}
            ${infoField('Report Template', reportTemplate)}
            ${infoField('Date', formattedDate)}
          </div>
        </div>

        <!-- Test Results Section -->
        <div class="p-6">
          <h3 class="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Test Results
          </h3>
          <div id="tests-container-${reportId}" class="space-y-4">
            <div class="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center">
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              Loading report details...
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-white/[0.03] border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <a href="/dashboard/pathology/custom-tests/report/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 h-10 px-5 transition">
            View Report
          </a>
          <a href="/dashboard/pathology/custom-tests/edit/${reportId}"
             class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-slate-600 text-white hover:bg-slate-700 h-10 px-5 transition shadow-md">
            Edit
          </a>
        </div>
      `;

      details.innerHTML = htmlContent;

      // Fetch and render the actual results. result_text takes one of three
      // shapes, same parsing as ReportDetails.tsx (the canonical print view):
      //  - custom-form-designer template: form_template.form_schema (labeled
      //    fields, sorted by sort_order) + result_text.values keyed by field
      //  - legacy structured: a JSON array of items, or { items, custom_html }
      //  - free text: anything that doesn't parse as the above
      const testsContainer = details.querySelector(`#tests-container-${reportId}`);
      if (testsContainer) {
        const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const resultsTable = (rows: { name: string; result: string; range: string }[]) => `
          <div class="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800">
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300 w-[38%]">Test Name</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300 w-[31%]">Result</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300 w-[31%]">Normal Range</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map((r, i) => `
                  <tr class="${i % 2 === 1 ? 'bg-gray-50/60 dark:bg-white/[0.02]' : ''} border-b border-gray-50 dark:border-gray-800/60 last:border-b-0">
                    <td class="px-3 py-2.5 whitespace-pre-wrap text-gray-700 dark:text-gray-200">${esc(r.name) || '-'}</td>
                    <td class="px-3 py-2.5 font-medium whitespace-pre-wrap text-gray-900 dark:text-gray-100">${esc(r.result) || '-'}</td>
                    <td class="px-3 py-2.5 text-gray-500 dark:text-gray-400 whitespace-pre-wrap">${esc(r.range) || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        const emptyState = `<div class="border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center text-sm text-gray-500">No test results provided</div>`;
        const carriedOutBy = (name: string) => `
          <div class="flex items-center gap-2 text-sm pt-1">
            <span class="text-gray-500">Test Carried Out By:</span>
            <span class="font-medium text-gray-800 dark:text-gray-100">${esc(name)}</span>
          </div>
        `;

        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/custom-tests-results/${reportId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.ok) {
            const data = await res.json();
            const reportData = data.data;
            const formTemplate = reportData?.form_template;
            const isTemplateDriven = !!(formTemplate?.is_custom_form_designer && formTemplate?.form_schema?.length);

            let resultHTML = '';
            let customHtml = '';

            if (isTemplateDriven) {
              let templateValues: Record<string, string> = {};
              try {
                const parsed = reportData.result_text ? JSON.parse(reportData.result_text) : null;
                if (parsed && typeof parsed === 'object') {
                  templateValues = parsed.values || {};
                  customHtml = parsed.custom_html || '';
                }
              } catch {
                // no structured data recorded yet for this row
              }
              const sortedSchema = [...formTemplate.form_schema].sort(
                (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
              );
              resultHTML = sortedSchema.length
                ? resultsTable(sortedSchema.map((f: any) => ({ name: f.label, result: templateValues[f.key] || '', range: f.normal_range || '' })))
                : emptyState;
            } else if (reportData?.result_text) {
              let items: any[] = [];
              let isRawText = false;
              try {
                const parsed = JSON.parse(reportData.result_text);
                if (Array.isArray(parsed)) {
                  items = parsed;
                } else if (parsed && typeof parsed === 'object') {
                  items = Array.isArray(parsed.items) ? parsed.items : [];
                  customHtml = parsed.custom_html || '';
                  if (items.length === 0 && !customHtml) isRawText = true;
                } else {
                  isRawText = true;
                }
              } catch {
                isRawText = true;
              }

              if (!isRawText && items.length > 0) {
                resultHTML = resultsTable(items.map((item: any) => ({ name: item.test_name, result: item.test_result, range: item.normal_range })));
              } else if (!isRawText && customHtml) {
                resultHTML = '';
              } else {
                resultHTML = `<div class="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-gray-50 dark:bg-white/5 whitespace-pre-wrap font-mono text-sm">${esc(reportData.result_text)}</div>`;
              }
            } else {
              resultHTML = emptyState;
            }

            testsContainer.innerHTML = `
              <div class="space-y-4">
                ${resultHTML}
                ${customHtml ? `<div class="text-sm border-t border-gray-100 dark:border-gray-800 pt-4">${customHtml}</div>` : ''}
                ${reportData?.test_carried_out_by ? carriedOutBy(reportData.test_carried_out_by) : ''}
              </div>
            `;
          } else {
            testsContainer.innerHTML = `<div class="text-red-500 text-sm">Failed to load report details</div>`;
          }
        } catch (error) {
          testsContainer.innerHTML = `<div class="text-red-500 text-sm">Failed to load report details</div>`;
        }
      }

      // Create new row — table has 8 columns.
      const newRow = document.createElement('tr');
      newRow.className = 'child-row-detail';
      const cell = document.createElement('td');
      cell.className = 'p-4 bg-gray-50';
      cell.colSpan = 8;
      cell.appendChild(details);
      newRow.appendChild(cell);

      row.parentNode?.insertBefore(newRow, row.nextSibling);
      row.classList.add('expanded');
      btn.textContent = '-';
      btn.style.backgroundColor = '#dc2626';
    };

    document.addEventListener('click', handleExpandClick);
    return () => {
      document.removeEventListener('click', handleExpandClick);
    };
  }, [token]);

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
  const [openTemplate, setOpenTemplate] = useState(false);
  
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key];
    if (p) { setFrom(p.from); setTo(p.to); }
    setPresetOpen(false);
  };

  const columns = useMemo(() => [
    {
      data: "ReciptID",
      title: "Receipt No",
      orderable: true,
      render: (data: any, type: string, row: ReportsItem) => {
        // Sort/type use the raw numeric Receipt ID so DataTables orders numerically.
        if (type === 'sort' || type === 'type') return row.ReciptID;
        const date = fmtDateTime(row.Date);
        const status = row.Status || 'Pending';
        const esc = (s: any) => String(s ?? '').replace(/"/g, "&quot;");
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                    type="button"
                    data-report-id="${row.id}"
                    data-recipt-id="${data}"
                    data-patient-name="${esc(row.PatientName || '-')}"
                    data-ref-doctor="${esc(row.ref_doctor || '-')}"
                    data-test-name="${esc(row.TestName || '-')}"
                    data-report-template="${esc(row.ReportTemplate || '-')}"
                    data-date="${date}"
                    data-status="${status}">+</button>
            <span class="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-1 rounded">${data}</span>
          </div>
        `;
      },
      defaultContent: "",
    },
    {
      data: "PatientName",
      title: "Patient Name",
      orderable: true,
      defaultContent: "",
      render: (data: any) => data || '-',
    },
    {
      data: "ref_doctor",
      title: "Ref. By",
      defaultContent: "-",
      render: (data: any) => {
        if (!data) return '-';
        // If data contains qualification in parentheses, extract it and display
        const match = data.match(/^(.+?)\s*\(([^)]+)\)$/);
        if (match) {
          return `${match[1].trim()} (${match[2].trim()})`;
        }
        return data;
      }
    },
    {
      data: "TestName",
      title: "Test Name",
      orderable: false,
      defaultContent: "",
      render: (data: any) => data || '-',
    },
    {
      data: "ReportTemplate",
      title: "Report Template",
      orderable: false,
      defaultContent: "",
      render: (data: any) => data ? `<span class="text-sm font-medium text-blue-600">${data}</span>` : '-',
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
              <Popover open={openTemplate} onOpenChange={setOpenTemplate}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    {activeTemplateLabel ? `Template: ${activeTemplateLabel}` : "Filter by Report Template"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0">
                  <Command>
                    <CommandInput placeholder="Search template..." />
                    <CommandList>
                      <CommandEmpty>No report template found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setTemplateFilter("all");
                            setOpenTemplate(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              templateFilter === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All Templates
                        </CommandItem>
                        {reportTemplateOptions.map((opt: any) => (
                          <CommandItem
                            key={opt.id}
                            value={opt.label}
                            onSelect={() => {
                              setTemplateFilter(templateFilter === opt.id ? "all" : opt.id);
                              setOpenTemplate(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                templateFilter === opt.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {opt.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {templateFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTemplateFilter("all")}
                >
                  Clear
                </Button>
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
