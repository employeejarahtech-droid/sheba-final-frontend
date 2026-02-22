import { Button } from "@/components/ui/button";

interface WidalTestData {
  id: number;
  invoice_id: number;
  s_typhi_o: string | null;
  s_typhi_h: string | null;
  s_paratyphi_a: string | null;
  s_paratyphi_b: string | null;
  s_paratyphi_c: string | null;
  remarks: string | null;
  machine_id: number | null;
  test_carried_out_by: string | null;
  created_at: string;
  outdoor_invoice?: {
    id: number;
    patient_name: string;
    age: string;
    sex: string;
    age_text: string;
    doctor_id: number | null;
    invoice_date: string;
  };
}

interface WidalTestReportDetailsProps {
  data: WidalTestData | null;
  paddingTop?: number;
}

export default function WidalTestReportDetails({ data, paddingTop = 40 }: WidalTestReportDetailsProps) {
  const borderWidth = 2;

  if (!data) {
    return <div className="flex justify-center items-center min-h-screen">No data available</div>;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

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
      <h1 className="text-2xl font-bold text-center underline mb-6 tracking-wide">
        WIDAL TEST REPORT
      </h1>

      {/* Header Table */}
      <table className="w-full text-sm border">
        <tbody>
          <tr className="border">
            <td className="border px-3 py-2 w-1/4">Receipt ID : {data.invoice_id}</td>
            <td className="border px-3 py-2 w-1/4">
              Date: {data.outdoor_invoice?.invoice_date ? formatDate(data.outdoor_invoice.invoice_date) : formatDate(data.created_at)}
            </td>
            <td className="border px-3 py-2 w-1/4">
              Age: {data.outdoor_invoice?.age_text || data.outdoor_invoice?.age || 'N/A'}
            </td>

          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>
              Patient name: {data.outdoor_invoice?.patient_name || 'N/A'}
            </td>
            <td className="border px-3 py-2">
              Sex: {data.outdoor_invoice?.sex || 'N/A'}
            </td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={3}>
              Refd. By: Prof./Dr. {data.outdoor_invoice?.doctor_id || '--'}
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
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Salmonella Typhi O (S. Typhi O)</td>
            <td className="px-3 py-2">{data.s_typhi_o || 'N/A'}</td>
            <td className="px-3 py-2">&lt;1:80</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Salmonella Typhi H (S. Typhi H)</td>
            <td className="px-3 py-2">{data.s_typhi_h || 'N/A'}</td>
            <td className="px-3 py-2">&lt;1:80</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Salmonella Paratyphi A (S. Paratyphi A)</td>
            <td className="px-3 py-2">{data.s_paratyphi_a || 'N/A'}</td>
            <td className="px-3 py-2">&lt;1:80</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Salmonella Paratyphi B (S. Paratyphi B)</td>
            <td className="px-3 py-2">{data.s_paratyphi_b || 'N/A'}</td>
            <td className="px-3 py-2">&lt;1:80</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Salmonella Paratyphi C (S. Paratyphi C)</td>
            <td className="px-3 py-2">{data.s_paratyphi_c || 'N/A'}</td>
            <td className="px-3 py-2">&lt;1:80</td>
          </tr>
        </tbody>
      </table>

      {/* Remarks */}
      {data.remarks && (
        <div className="mt-4 text-sm">
          <span className="font-semibold">Remarks:</span> {data.remarks}
        </div>
      )}

      {/* Tested By */}
      <p className="text-sm mt-4">
        <span className="font-semibold">Test Carried out by:</span> &nbsp;
        {data.test_carried_out_by || 'N/A'}
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
