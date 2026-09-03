import { Button } from "@/components/ui/button";
import { ReportFooter } from '@/components/pathology/ReportFooter'

interface UrineForSugarReportDetailsProps {
  report?: any;
  invoice?: any;
  paddingTop?: number;
  fontSize?: number;
  showSignature?: boolean;
}

export default function UrineForSugarFullReportDetails({ report, invoice, paddingTop = 40, fontSize = 1, showSignature = true }: UrineForSugarReportDetailsProps) {
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const borderWidth = 2;
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
      <h1 className="text-2xl font-bold text-center underline mb-6 tracking-wide">
        URINE FOR SUGAR REPORT
      </h1>

      {/* Header Table */}
      <table className="w-full text-sm border">
        <tbody>
          <tr className="border">
            <td className="border px-3 py-2 w-1/4">Receipt ID : {report?.invoice_id || invoice?.id || 'N/A'}</td>
            <td className="border px-3 py-2 w-1/4">Date: {formatDate(report?.created_at)}</td>
            <td className="border px-3 py-2 w-1/4">Age: {invoice?.patient?.age || 'N/A'} years</td>

          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>Patient name: {invoice?.patient?.name || invoice?.patient_name || 'N/A'}</td>
            <td className="border px-3 py-2">Sex: {invoice?.patient?.sex || invoice?.patient?.gender || 'N/A'}</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>
              Ref. By: {invoice?.doctor?.doctor_name ? `Prof./Dr. ${invoice.doctor.doctor_name}` : '-'}{invoice?.doctor?.qualification ? ` (${invoice.doctor.qualification})` : ''}
            </td>
            <td className="border px-3 py-2">
              Phone: {invoice?.phone || '-'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Test Table */}
      <table className="w-full text-sm mt-6 border">
        <thead>
          <tr className="border-t border-b bg-row-blue">
            <th className="px-3 py-2 text-left w-[40%]">Test name</th>
            <th className="px-3 py-2 text-left w-[30%]">Test Result</th>
            <th className="px-3 py-2 text-left w-[30%]">Normal Range</th>
          </tr>
        </thead>

        <tbody>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Urine Sugar</td>
            <td className="px-3 py-2">{report?.glucose || '-'}</td>
            <td className="px-3 py-2">Negative</td>
          </tr>
        </tbody>
      </table>

      {/* Remarks */}
      {report?.remarks && (
        <div className="mt-6 text-sm border p-4">
          <p><span className="font-semibold">Remarks:</span> {report.remarks}</p>
        </div>
      )}

      {/* Tested By */}
      <p className="text-sm mt-4">
        <span className="font-semibold">Test Carried Out By:</span> &nbsp;
        {report?.test_carried_out_by || 'N/A'}
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
