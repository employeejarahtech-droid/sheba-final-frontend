import { Button } from "@/components/ui/button";

interface UrineForReFullReportDetailsProps {
  report?: any;
  invoice?: any;
}

export default function UrineForReFullReportDetails({ report, invoice }: UrineForReFullReportDetailsProps) {
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
            <td className="border px-3 py-2 w-1/4">Receipt ID : {report?.invoice_id || invoice?.id || 'N/A'}</td>
            <td className="border px-3 py-2 w-1/4">Date: {formatDate(report?.created_at)}</td>
            <td className="border px-3 py-2 w-1/4">Age: {invoice?.patient?.age || 'N/A'} years</td>

          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>Patient name: {invoice?.patient?.name || invoice?.patient_name || 'N/A'}</td>
            <td className="border px-3 py-2">Sex: {invoice?.patient?.sex || invoice?.patient?.gender || 'N/A'}</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={3}>
              Refd. By: {invoice?.doctor?.name || invoice?.reference_doctor || 'Prof./Dr. N/A'}
            </td>

          </tr>
        </tbody>
      </table>

      {/* Test Table - 2 Column Layout */}
      <table className="w-full text-sm mt-6 border">
        <tbody>
          {/* Row 1: PHYSICAL EXAMINATION | MICROSCOPIC EXAMINATION */}
          <tr className="border-b">
            <td className="px-3 py-2 font-semibold" colSpan={2}>
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-2 font-semibold bg-gray-100" colSpan={2}>PHYSICAL EXAMINATION</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Color</td>
                    <td className="px-3 py-2">{report?.color || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Appearance</td>
                    <td className="px-3 py-2">{report?.appearance || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Sediment</td>
                    <td className="px-3 py-2">{report?.sediment || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td className="px-3 py-2 font-semibold" colSpan={2}>
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-2 font-semibold bg-gray-100" colSpan={2}>MICROSCOPIC EXAMINATION</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Epithelial Cells</td>
                    <td className="px-3 py-2">{report?.epithelial_cells || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">RBC Cells</td>
                    <td className="px-3 py-2">{report?.rbc_cells || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Pus Cells</td>
                    <td className="px-3 py-2">{report?.pus_cells || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Yeast Cells</td>
                    <td className="px-3 py-2">{report?.yeast_cells || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Spermatozoa</td>
                    <td className="px-3 py-2">{report?.spermatozoa || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Row 2: CRYSTALS | CASTS / LPE */}
          <tr className="border-b">
            <td className="px-3 py-2 font-semibold" colSpan={2}>
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-2 font-semibold bg-gray-100" colSpan={2}>CRYSTALS</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Uric Acid Crystals</td>
                    <td className="px-3 py-2">{report?.uric_acid_crystals || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Calcium Oxalate</td>
                    <td className="px-3 py-2">{report?.calcium_oxalate || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Triple Phosphate</td>
                    <td className="px-3 py-2">{report?.triple_phosphate || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Amorphous Deposits</td>
                    <td className="px-3 py-2">{report?.amorphous_deposits || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td className="px-3 py-2 font-semibold" colSpan={2}>
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-2 font-semibold bg-gray-100" colSpan={2}>CASTS / LPE</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Hyaline Casts</td>
                    <td className="px-3 py-2">{report?.hyaline_casts || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Granular Casts</td>
                    <td className="px-3 py-2">{report?.granular_casts || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">RBC Casts</td>
                    <td className="px-3 py-2">{report?.rbc_casts || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">WBC Casts</td>
                    <td className="px-3 py-2">{report?.wbc_casts || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Epithelial Casts</td>
                    <td className="px-3 py-2">{report?.epithelial_casts || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Row 3: CHEMICAL EXAMINATION (2 Columns) */}
          <tr className="border-b">
            <td className="px-3 py-2 font-semibold" colSpan={2}>
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-2 font-semibold bg-gray-100" colSpan={2}>CHEMICAL EXAMINATION</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Urobilinogen</td>
                    <td className="px-3 py-2">{report?.urobilinogen || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Bilirubin</td>
                    <td className="px-3 py-2">{report?.bilirubin || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Ketone</td>
                    <td className="px-3 py-2">{report?.ketones || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Blood</td>
                    <td className="px-3 py-2">{report?.blood || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Protein</td>
                    <td className="px-3 py-2">{report?.protein || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td className="px-3 py-2 font-semibold" colSpan={2}>
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-2 font-semibold bg-gray-100" colSpan={2}>CHEMICAL EXAMINATION</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Nitrite</td>
                    <td className="px-3 py-2">{report?.nitrite || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Leukocytes</td>
                    <td className="px-3 py-2">{report?.leukocytes || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Glucose</td>
                    <td className="px-3 py-2">{report?.glucose || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Specific Gravity</td>
                    <td className="px-3 py-2">{report?.specific_gravity || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Reaction (pH)</td>
                    <td className="px-3 py-2">{report?.ph || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
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
        <span className="font-semibold">Test Carried out by:</span> &nbsp;
        {report?.test_carried_out_by || invoice?.reference_doctor || 'N/A'}
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
