import { Button } from "@/components/ui/button";
import { ReportFooter } from '@/components/pathology/ReportFooter'
import { COLUMN_LAYOUT_OPTIONS, DEFAULT_COLUMN_LAYOUT, type ColumnLayoutKey } from '@/lib/print-column-layout';

interface HematologyReportProps {
  invoice: {
    invoice_information: {
      id: number;
      patient_name: string;
      age: string;
      sex: string;
      invoice_date: string;
      phone: string;
      ref_doctor?: string | null;
    } | null;
    hematology_all_info: Array<{
      id: number;
      invoice_id: number;
      test_id: number | null;
      test_name: string | null;
      test_result: string | null;
      sample_normal_range?: string | null;
      test_carried_out_by?: string | null;
      created_at: string | null;
      updated_at: string | null;
    }>;
  };
  testName?: string;
  paddingTop?: number;
  fontSize?: number;
  showSignature?: boolean;
  columnLayout?: ColumnLayoutKey;
}

export default function HematologyReportDetails({ invoice, testName = "HEMATOLOGY REPORT", paddingTop = 40, fontSize = 1, showSignature = true, columnLayout = DEFAULT_COLUMN_LAYOUT }: HematologyReportProps) {
  const patientInfo = invoice?.invoice_information || null;
  const tests = invoice?.hematology_all_info || [];

  // Effective table geometry: the 'two' preset hides Normal Range outright.
  const widths = (COLUMN_LAYOUT_OPTIONS[columnLayout] ?? COLUMN_LAYOUT_OPTIONS.default).widths;
  const showRange = widths.range !== null;
  const nameWidth = `${widths.name}%`;
  const resultWidth = showRange ? `${widths.result}%` : `${100 - widths.name}%`;
  const rangeWidth = widths.range === null ? '0%' : `${widths.range}%`;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:w-[850px] print-report" style={{ paddingTop: `${paddingTop}px`, zoom: fontSize }}>
      <style>
        {`
          .bg-row-blue {
            background-color: #cfd2d8ff !important;
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

      {/* Title */}
      <h1 className="text-2xl font-bold text-center underline mb-6 tracking-wide uppercase">
        {testName}
      </h1>

      {/* Header Table */}
      <table className="w-full text-sm border">
        <tbody>
          <tr className="border">
            <td className="border px-3 py-2 w-1/4">Receipt ID : {patientInfo?.id || '-'}</td>
            <td className="border px-3 py-2 w-1/4">Date: {formatDate(patientInfo?.invoice_date || null)}</td>
            <td className="border px-3 py-2 w-1/4">Age: {patientInfo?.age || '-'} years</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>Patient name: {patientInfo?.patient_name || '-'}</td>
            <td className="border px-3 py-2">Sex: {patientInfo?.sex || '-'}</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>
              Ref. By: {patientInfo?.ref_doctor || '-'}{patientInfo?.doctor?.qualification ? ` (${patientInfo.doctor.qualification})` : ''}
            </td>
            <td className="border px-3 py-2">
              Phone: {patientInfo?.phone || '-'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Test Table */}
      <table className="w-full table-fixed text-sm mt-6" style={{ tableLayout: 'fixed' }} data-column-layout={columnLayout}>
        <thead>
          <tr className="border-t border-b bg-row-blue">
            <th className="px-3 py-2 text-left border-r border-dashed" style={{ width: nameWidth }}>Test Name</th>
            <th className="px-3 py-2 text-left border-r border-dashed" style={{ width: resultWidth }}>Test Result</th>
            {showRange && <th className="px-3 py-2 text-left" style={{ width: rangeWidth }}>Normal Range</th>}
          </tr>
        </thead>

        <tbody>
          {tests.map((test) => (
            <tr key={test.id} className="border-b border-dashed">
              <td className="px-3 py-2 border-r border-dashed">{test.test_name || '-'}</td>
              <td className="px-3 py-2 whitespace-pre-wrap border-r border-dashed">{test.test_result || '-'}</td>
              {showRange && <td className="px-3 py-2 whitespace-pre-wrap">{test.sample_normal_range || '-'}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tested By */}
      <p className="text-sm mt-4">
        <span className="font-semibold">Test Carried Out By:</span> &nbsp;
        {tests[0]?.test_carried_out_by || '-'}
      </p>

      <ReportFooter showSignature={showSignature} />

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-10 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
        <Button variant="outline">Download</Button>
      </div>
    </div>
  );
}
