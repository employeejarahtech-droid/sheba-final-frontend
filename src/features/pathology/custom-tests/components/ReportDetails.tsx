import { Button } from "@/components/ui/button";
import { ReportFooter } from '@/components/pathology/ReportFooter'
import { COLUMN_LAYOUT_OPTIONS, DEFAULT_COLUMN_LAYOUT, type ColumnLayoutKey } from '@/lib/print-column-layout';

interface ReportDetailsProps {
  invoice?: any;
  testName?: string;
  paddingTop?: number;
  fontSize?: number;
  columnLayout?: ColumnLayoutKey;
}

export default function ReportDetails({ invoice, testName = "Custom Test Report", paddingTop = 40, fontSize = 1, columnLayout = DEFAULT_COLUMN_LAYOUT }: ReportDetailsProps) {
  const patientInfo = invoice?.outdoor_invoice || {};
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formTemplate = invoice?.form_template;
  const isTemplateDriven = !!(formTemplate?.is_custom_form_designer && formTemplate?.form_schema?.length);

  // Effective table geometry: the 'two' preset hides Normal Range outright.
  const widths = (COLUMN_LAYOUT_OPTIONS[columnLayout] ?? COLUMN_LAYOUT_OPTIONS.default).widths;
  const showRange = widths.range !== null;
  const nameWidth = `${widths.name}%`;
  const resultWidth = showRange ? `${widths.result}%` : `${100 - widths.name}%`;
  const rangeWidth = widths.range === null ? '0%' : `${widths.range}%`;

  let finalTestName = testName;
  let parsedItems: any[] = [];
  let isRawText = false;
  let templateValues: Record<string, string> = {};
  // Additional Report Content (rich-text) — a field on every custom report
  // format, legacy or template-driven (see LegacyCustomTestForm/DynamicCustomTestForm).
  let customHtml = '';

  if (isTemplateDriven) {
    finalTestName = formTemplate.display_name || testName;
    try {
      const parsed = invoice?.result_text ? JSON.parse(invoice.result_text) : null;
      if (parsed && typeof parsed === 'object') {
        if (parsed.values) templateValues = parsed.values;
        customHtml = parsed.custom_html || '';
      }
    } catch (e) {
      // no structured data recorded yet for this row
    }
  } else if (invoice?.result_text) {
      try {
          const parsed = JSON.parse(invoice.result_text);
          if (Array.isArray(parsed)) {
              parsedItems = parsed;
          } else if (parsed && typeof parsed === 'object') {
              finalTestName = parsed.report_name || testName;
              parsedItems = Array.isArray(parsed.items) ? parsed.items : [];
              customHtml = parsed.custom_html || '';
          } else {
              isRawText = true;
          }
      } catch (e) {
          isRawText = true;
      }
  }

  return (
    <div className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:w-[850px] print-report" style={{ paddingTop: `${paddingTop}px`, zoom: fontSize }}>
      <style>
        {`
          .bg-row-blue {
            background-color: #cfd2d8ff !important;
          }

          /* Tables inserted via the Additional Report Content editor carry no
             styling of their own (the grid only shows inside Summernote), so
             paint them here for both screen and print. */
          .custom-html-content table {
            border-collapse: collapse !important;
            width: 100%;
            margin: 8px 0;
          }
          .custom-html-content th,
          .custom-html-content td {
            border: 1px solid rgb(0 0 0 / 0.15) !important;
            padding: 4px 8px;
          }

         @media print {
          .bg-row-blue {
            background-color: #cfd2d8ff !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          .bg-background {
            background-color: #fff;
          }

          body{
            color: #000;
            background-color: #fff;
          }

          .border{
            border-color: oklch(0.929 0.013 255.508);
          }

          .border-dashed{
            border-color: oklch(0.929 0.013 255.508);
          }
        }
        `}
      </style>
      
      <h1 className="text-2xl font-bold text-center underline mb-6 tracking-wide uppercase">
        {finalTestName}
      </h1>

      <table className="w-full text-sm border">
        <tbody>
          <tr className="border">
            <td className="border px-3 py-2 w-1/4">Receipt No : {invoice?.invoice_id || patientInfo.id || '-'}</td>
            <td className="border px-3 py-2 w-1/4">Date: {formatDate(patientInfo.invoice_date || null)}</td>
            <td className="border px-3 py-2 w-1/4">Age: {patientInfo.age || '-'} years</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>Patient name: {patientInfo.patient_name || '-'}</td>
            <td className="border px-3 py-2">Sex: {patientInfo.sex || '-'}</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>
              Ref. By: {patientInfo.doctor?.doctor_name || '-'}{patientInfo.doctor?.qualification ? ` (${patientInfo.doctor.qualification})` : ''}
            </td>
            <td className="border px-3 py-2">
              Phone: {patientInfo.phone || '-'}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-8 mb-10">
        {(() => {
          if (isTemplateDriven) {
            const sortedSchema = [...formTemplate.form_schema].sort(
              (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
            );
            return (
              <table className="w-full table-fixed text-sm mt-6" style={{ tableLayout: 'fixed' }} data-column-layout={columnLayout}>
                <thead>
                  <tr className="border-t border-b bg-row-blue">
                    <th className="px-3 py-2 text-left border-r border-dashed" style={{ width: nameWidth }}>Test name</th>
                    <th className="px-3 py-2 text-left border-r border-dashed" style={{ width: resultWidth }}>Test Result</th>
                    {showRange && <th className="px-3 py-2 text-left" style={{ width: rangeWidth }}>Normal Range</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedSchema.map((f: any) => (
                    <tr key={f.key} className="border-b border-dashed">
                      <td className="px-3 py-2 border-r border-dashed">{f.label}</td>
                      <td className="px-3 py-2 whitespace-pre-wrap border-r border-dashed">
                        {templateValues[f.key]
                          ? `${templateValues[f.key]}${f.unit ? ` ${f.unit}` : ''}`
                          : '-'}
                      </td>
                      {showRange && <td className="px-3 py-2 whitespace-pre-wrap">{f.normal_range || '-'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          }

          if (!invoice?.result_text) {
            return <div className="p-4 border rounded text-sm text-gray-500">No test results provided.</div>;
          }

          if (isRawText) {
            return (
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-4 border rounded min-h-[250px]">
                {invoice.result_text}
              </div>
            );
          }

          if (parsedItems.length === 0) {
            return <div className="p-4 border rounded text-sm text-gray-500">No test results provided.</div>;
          }

          return (
            <table className="w-full table-fixed text-sm mt-6" style={{ tableLayout: 'fixed' }} data-column-layout={columnLayout}>
              <thead>
                <tr className="border-t border-b bg-row-blue">
                  <th className="px-3 py-2 text-left border-r border-dashed" style={{ width: nameWidth }}>Test name</th>
                  <th className="px-3 py-2 text-left border-r border-dashed" style={{ width: resultWidth }}>Test Result</th>
                  {showRange && <th className="px-3 py-2 text-left" style={{ width: rangeWidth }}>Normal Range</th>}
                </tr>
              </thead>
              <tbody>
                {parsedItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-dashed">
                    <td className="px-3 py-2 whitespace-pre-wrap border-r border-dashed">{item.test_name || '-'}</td>
                    <td className="px-3 py-2 whitespace-pre-wrap border-r border-dashed">{item.test_result || '-'}</td>
                    {showRange && <td className="px-3 py-2 whitespace-pre-wrap">{item.normal_range || '-'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>

      {customHtml && (
        <div
          className="custom-html-content mb-8 text-sm"
          dangerouslySetInnerHTML={{ __html: customHtml }}
        />
      )}

      <p className="text-sm mt-4">
        <span className="font-semibold">Test Carried Out By:</span> &nbsp;
        {invoice?.test_carried_out_by || 'Not specified'}
      </p>

      <ReportFooter />

      <div className="flex justify-end gap-3 mt-10 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>
    </div>
  );
}
