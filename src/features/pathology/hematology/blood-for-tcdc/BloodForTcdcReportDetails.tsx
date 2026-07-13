import { Button } from "@/components/ui/button";
import { ReportFooter } from '@/components/pathology/ReportFooter'

interface BloodForTcdcReportDetailsProps {
  invoice?: any;
  testName?: string;
  paddingTop?: number;
}

export default function BloodForTcdcReportDetails({ invoice: invoice, testName, paddingTop = 40 }: BloodForTcdcReportDetailsProps) {
  // Extract patient info from nested outdoor_invoice object
  const patientInfo = invoice?.outdoor_invoice || {};
  const invoiceDate = patientInfo.invoice_date
    ? new Date(patientInfo.invoice_date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "N/A";

  return (
    <div className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:w-[850px] print-report" style={{ paddingTop: `${paddingTop}px` }}>
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
            <td className="border px-3 py-2 w-1/4">Receipt ID : {invoice.invoice_id || patientInfo.id}</td>
            <td className="border px-3 py-2 w-1/4">Date: {invoiceDate}</td>
            <td className="border px-3 py-2 w-1/4">Age: {patientInfo.age_text || patientInfo.age || 'N/A'}</td>

          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>Patient name: {patientInfo.patient_name || 'N/A'}</td>
            <td className="border px-3 py-2">Sex: {patientInfo.sex || 'N/A'}</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>
              Ref. By: {invoice.ref_doctor || (patientInfo.doctor_id ? `Dr. ID: ${patientInfo.doctor_id}` : '-')}{patientInfo?.doctor?.qualification ? ` (${patientInfo.doctor.qualification})` : ''}
            </td>
            <td className="border px-3 py-2">
              Phone: {patientInfo.phone || invoice.phone || '-'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Test Table */}
      <table className="w-full text-sm mt-6">
        <thead>
          <tr className="border-t border-b bg-row-blue">
            <th className="px-3 py-2 text-left w-[40%]">Test name</th>
            <th className="px-3 py-2 text-left w-[30%]">Test Result</th>
            <th className="px-3 py-2 text-left w-[30%]">Normal Range</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-b border-dashed">
            <td className="px-3 py-2">Total Count (TC)</td>
            <td className="px-3 py-2">{invoice.total_count || 'N/A'}</td>
            <td className="px-3 py-2">4000-11000 cells/cmm</td>
          </tr>
          <tr className="border-b border-dashed">
            <td className="px-3 py-2">Neutrophils</td>
            <td className="px-3 py-2">{invoice.neutrophils || 'N/A'} %</td>
            <td className="px-3 py-2">40-80 %</td>
          </tr>
          <tr className="border-b border-dashed">
            <td className="px-3 py-2">Lymphocytes</td>
            <td className="px-3 py-2">{invoice.lymphocytes || 'N/A'} %</td>
            <td className="px-3 py-2">20-40 %</td>
          </tr>
          <tr className="border-b border-dashed">
            <td className="px-3 py-2">Monocytes</td>
            <td className="px-3 py-2">{invoice.monocytes || 'N/A'} %</td>
            <td className="px-3 py-2">2-10 %</td>
          </tr>
          <tr className="border-b border-dashed">
            <td className="px-3 py-2">Eosinophils</td>
            <td className="px-3 py-2">{invoice.eosinophils || 'N/A'} %</td>
            <td className="px-3 py-2">1-6 %</td>
          </tr>
          <tr className="border-b border-dashed">
            <td className="px-3 py-2">Basophils</td>
            <td className="px-3 py-2">{invoice.basophils || 'N/A'} %</td>
            <td className="px-3 py-2">0-1 %</td>
          </tr>
        </tbody>
      </table>

      {/* Tested By */}
      <p className="text-sm mt-4">
        <span className="font-semibold">Test Carried Out By:</span> &nbsp;
        {invoice.test_carried_out_by || 'N/A'}
      </p>

      <ReportFooter />

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
