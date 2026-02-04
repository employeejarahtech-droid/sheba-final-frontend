import { Button } from "@/components/ui/button";

export default function UrineForReFullReportDetails({ invoice: invoice }: any) {
  const borderWidth = 2;
  return (
    <div className="max-w-4xl w-full mx-auto bg-background pt-40 pb-10 px-5 mt-6 print:w-[850px] print-report">
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
        URINE FOR RE FULL REPORT
      </h1>

      {/* Header Table */}
      <table className="w-full text-sm border">
        <tbody>
          <tr className="border">
            <td className="border px-3 py-2 w-1/4">Receipt ID : {invoice?.id}</td>
            <td className="border px-3 py-2 w-1/4">Date: 01/01/2025</td>
            <td className="border px-3 py-2 w-1/4">Age: {invoice?.age} years</td>

          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>Patient name: {invoice?.patient_name}</td>
            <td className="border px-3 py-2">Sex: {invoice?.sex}</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={3}>
              Refd. By: Prof./Dr. {invoice?.reference_doctor}
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
            <td className="px-3 py-2">Fasting Blood Suger (F.B.S)</td>
            <td className="px-3 py-2">145.0 mg/dl (8.0 mmol/L)</td>
            <td className="px-3 py-2">65-110 mg/dl (3.6-6.1 mmol/L)</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Corresponding Urine Sugar (CUS)</td>
            <td className="px-3 py-2">N/A</td>
            <td className="px-3 py-2">Nil</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Blood Suger 2 hours after Breakfast</td>
            <td className="px-3 py-2">
              242.3 mg/dl (13.4 mmol/L)
            </td>
            <td className="px-3 py-2">
              &lt;140 mg/dl (&lt;7.8 mmol/L)
            </td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">2hrs (CUS)</td>
            <td className="px-3 py-2">Not done</td>
            <td className="px-3 py-2">--</td>
          </tr>
        </tbody>
      </table>

      {/* Tested By */}
      <p className="text-sm mt-4">
        <span className="font-semibold">Test Carried out by:</span> &nbsp;
        Humalyzer 3000 Biochemistry Analyser
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
