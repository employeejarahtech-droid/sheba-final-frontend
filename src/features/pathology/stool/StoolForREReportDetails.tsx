import { Button } from "@/components/ui/button";

interface StoolForREReportDetailsProps {
  report?: any;
  invoice?: any;
}

export default function StoolForREReportDetails({ report, invoice }: StoolForREReportDetailsProps) {
  const borderWidth = 2;

  // Use report data if available, otherwise fall back to invoice
  const data = report || invoice;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

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
        STOOL FOR RE REPORT
      </h1>

      {/* Header Table */}
      <table className="w-full text-sm border">
        <tbody>
          <tr className="border">
            <td className="border px-3 py-2 w-1/4">Receipt ID : {data?.id || data?.invoice_id || 'N/A'}</td>
            <td className="border px-3 py-2 w-1/4">Date: {formatDate(data?.created_at)}</td>
            <td className="border px-3 py-2 w-1/4">Age: {data?.outdoor_invoice?.age || data?.age || 'N/A'} years</td>

          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>Patient name: {data?.outdoor_invoice?.patient_name || data?.patient_name || 'N/A'}</td>
            <td className="border px-3 py-2">Sex: {data?.outdoor_invoice?.sex || data?.sex || 'N/A'}</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={3}>
              Refd. By: Prof./Dr. {data?.outdoor_invoice?.reference_doctor || data?.reference_doctor || 'N/A'}
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
          {/* Physical Examination */}
          <tr className="border-t bg-gray-100">
            <td className="px-3 py-2 font-semibold" colSpan={3}>Physical Examination</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Colour</td>
            <td className="px-3 py-2">{data?.color || data?.colour || '-'}</td>
            <td className="px-3 py-2">Brown</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Consistency</td>
            <td className="px-3 py-2">{data?.consistency || '-'}</td>
            <td className="px-3 py-2">Formed</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Mucous</td>
            <td className="px-3 py-2">{data?.mucous || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Blood</td>
            <td className="px-3 py-2">{data?.blood || data?.occult_blood || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Helminths</td>
            <td className="px-3 py-2">{data?.helminths || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>

          {/* Chemical Examination */}
          <tr className="border-t bg-gray-100">
            <td className="px-3 py-2 font-semibold" colSpan={3}>Chemical Examination</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Reaction</td>
            <td className="px-3 py-2">{data?.reaction || '-'}</td>
            <td className="px-3 py-2">Acidic</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Reducing Substance</td>
            <td className="px-3 py-2">{data?.reducingSubstance || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Occult Blood</td>
            <td className="px-3 py-2">{data?.occultBlood || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Bile Pigments</td>
            <td className="px-3 py-2">{data?.bilePigments || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Bile Salts</td>
            <td className="px-3 py-2">{data?.bileSalts || '-'}</td>
            <td className="px-3 py-2">Present</td>
          </tr>

          {/* Microscopic Examination */}
          <tr className="border-t bg-gray-100">
            <td className="px-3 py-2 font-semibold" colSpan={3}>Microscopic Examination</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Ova of</td>
            <td className="px-3 py-2">{data?.ovaOf || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Cysts of</td>
            <td className="px-3 py-2">{data?.cystsOf || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Larva of</td>
            <td className="px-3 py-2">{data?.larvaOf || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Trophozoite of</td>
            <td className="px-3 py-2">{data?.trophozoiteOf || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Pus Cells</td>
            <td className="px-3 py-2">{data?.pusCells || data?.pus_cells || '-'}</td>
            <td className="px-3 py-2">0-2 /HPF</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Epithelial Cells</td>
            <td className="px-3 py-2">{data?.epithelialCells || data?.epithelium || '-'}</td>
            <td className="px-3 py-2">0-2 /HPF</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">RBC</td>
            <td className="px-3 py-2">{data?.rbc || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Macrophage</td>
            <td className="px-3 py-2">{data?.macrophage || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Vegetable Cells</td>
            <td className="px-3 py-2">{data?.vegetableCells || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Undigested Food</td>
            <td className="px-3 py-2">{data?.undigestedFood || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Fat Globules</td>
            <td className="px-3 py-2">{data?.fatGlobules || '-'}</td>
            <td className="px-3 py-2">Absent</td>
          </tr>
          <tr className={`border-b-${borderWidth} border-dashed border-b`}>
            <td className="px-3 py-2">Others</td>
            <td className="px-3 py-2">{data?.others || '-'}</td>
            <td className="px-3 py-2">--</td>
          </tr>
        </tbody>
      </table>

      {/* Remarks */}
      {data?.remarks || data?.comments ? (
        <div className="mt-4 text-sm">
          <p className="font-semibold">Remarks:</p>
          <p>{data?.remarks || data?.comments || '-'}</p>
        </div>
      ) : null}

      {/* Tested By */}
      <p className="text-sm mt-4">
        <span className="font-semibold">Test Carried out by:</span> &nbsp;
        {data?.test_carried_out_by || 'N/A'}
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
