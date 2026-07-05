import { Button } from "@/components/ui/button";
import { ReportFooter } from '@/components/pathology/ReportFooter'

interface ReportDetailsProps {
  invoice?: any;
  testName?: string;
  paddingTop?: number;
}

export default function ReportDetails({ invoice, testName = "Custom Test Report", paddingTop = 40 }: ReportDetailsProps) {
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

  let finalTestName = testName;
  let parsedItems: any[] = [];
  let isRawText = false;

  if (invoice?.result_text) {
      try {
          const parsed = JSON.parse(invoice.result_text);
          if (Array.isArray(parsed)) {
              parsedItems = parsed;
          } else if (parsed && typeof parsed === 'object') {
              finalTestName = parsed.report_name || testName;
              parsedItems = Array.isArray(parsed.items) ? parsed.items : [];
          } else {
              isRawText = true;
          }
      } catch (e) {
          isRawText = true;
      }
  }

  return (
    <div className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:w-[850px] print-report" style={{ paddingTop: `${paddingTop}px` }}>
      <style>
        {`
         @media print {
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
        }
        `}
      </style>
      
      <h1 className="text-2xl font-bold text-center underline mb-6 tracking-wide uppercase">
        {finalTestName}
      </h1>

      <table className="w-full text-sm border">
        <tbody>
          <tr className="border">
            <td className="border px-3 py-2 w-1/4">Receipt ID : {invoice?.invoice_id || patientInfo.id || '-'}</td>
            <td className="border px-3 py-2 w-1/4">Date: {formatDate(patientInfo.invoice_date || null)}</td>
            <td className="border px-3 py-2 w-1/4">Age: {patientInfo.age || '-'} years</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>Patient name: {patientInfo.patient_name || '-'}</td>
            <td className="border px-3 py-2">Sex: {patientInfo.sex || '-'}</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>
              Ref. Doctor: {patientInfo.doctor?.doctor_name || '-'}
            </td>
            <td className="border px-3 py-2">
              Phone: {patientInfo.phone || '-'}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-8 mb-10">
        {(() => {
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
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead className="bg-gray-100 print:bg-gray-100">
                <tr>
                  <th className="border border-gray-200 px-4 py-2 text-left font-bold w-1/3">Test Name</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-bold w-1/3">Result</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-bold w-1/3">Normal Range</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-200 px-4 py-2 whitespace-pre-wrap">{item.test_name || '-'}</td>
                    <td className="border border-gray-200 px-4 py-2 font-medium whitespace-pre-wrap">{item.test_result || '-'}</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-600 whitespace-pre-wrap">{item.normal_range || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>

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
