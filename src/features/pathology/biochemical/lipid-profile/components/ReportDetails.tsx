import { Button } from "@/components/ui/button";

interface ReportDetailsProps {
  invoice?: any;
  testName?: string;
  paddingTop?: number;
}

export default function ReportDetails({ invoice: invoice, testName, paddingTop = 40 }: ReportDetailsProps) {
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
            <td className="border px-3 py-2" colSpan={3}>
              Refd. By: {patientInfo.doctor_id ? `Dr. ID: ${patientInfo.doctor_id}` : 'N/A'}
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
          <tr className={`border-b border-dashed`}>
            <td className="px-3 py-2">Total Cholesterol</td>
            <td className="px-3 py-2">{invoice.total_cholesterol || 'N/A'} mg/dl</td>
            <td className="px-3 py-2">&lt;200 mg/dl</td>
          </tr>
          <tr className={`border-b border-dashed`}>
            <td className="px-3 py-2">HDL Cholesterol</td>
            <td className="px-3 py-2">{invoice.hdl || 'N/A'} mg/dl</td>
            <td className="px-3 py-2">&gt;40 mg/dl (Male), &gt;50 mg/dl (Female)</td>
          </tr>
          <tr className={`border-b border-dashed`}>
            <td className="px-3 py-2">LDL Cholesterol</td>
            <td className="px-3 py-2">{invoice.ldl || 'N/A'} mg/dl</td>
            <td className="px-3 py-2">&lt;100 mg/dl (Optimal)</td>
          </tr>
          <tr className={`border-b border-dashed`}>
            <td className="px-3 py-2">Triglycerides</td>
            <td className="px-3 py-2">{invoice.triglycerides || 'N/A'} mg/dl</td>
            <td className="px-3 py-2">&lt;150 mg/dl</td>
          </tr>
          <tr className={`border-b border-dashed`}>
            <td className="px-3 py-2">VLDL Cholesterol</td>
            <td className="px-3 py-2">{invoice.vldl || 'N/A'} mg/dl</td>
            <td className="px-3 py-2">5-40 mg/dl</td>
          </tr>
          <tr className={`border-b border-dashed`}>
            <td className="px-3 py-2">Cholesterol Ratio</td>
            <td className="px-3 py-2">{invoice.cholesterol_ratio || 'N/A'}</td>
            <td className="px-3 py-2">&lt;4.5 (Optimal)</td>
          </tr>
        </tbody>
      </table>

      {/* Tested By */}
      <p className="text-sm mt-4">
        <span className="font-semibold">Test Carried out by:</span> &nbsp;
        {invoice.test_carried_out_by || 'Not specified'}
      </p>

      {/* Footer Signatures */}
      <div className="grid grid-cols-2 mt-32 text-sm">
        <div>
          <p className="border-t border-dashed w-40 pt-1 text-center">Checked By:</p>
        </div>

        <div className="text-right">
          <p className="border-t border-dashed w-56 ml-auto pt-1">
            Medical Technologist (Lab):
          </p>
        </div>
      </div>

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
