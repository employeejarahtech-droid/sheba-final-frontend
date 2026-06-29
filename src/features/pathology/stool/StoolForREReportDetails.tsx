import { Button } from "@/components/ui/button";
import { ReportFooter } from '@/components/pathology/ReportFooter'

interface StoolForREReportDetailsProps {
  report?: any;
  invoice?: any;
  paddingTop?: number;
}

export default function StoolForREReportDetails({ report, invoice, paddingTop = 40 }: StoolForREReportDetailsProps) {
  const borderWidth = 1;

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
    <div className="max-w-4xl w-full mx-auto pb-10 print:pb-0 bg-background px-5 mt-6 print:w-[850px] print-report" style={{ paddingTop: `${paddingTop}px` }}>
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
            <td className="border px-3 py-1.5 w-1/4">Receipt ID : {data?.id || data?.invoice_id || 'N/A'}</td>
            <td className="border px-3 py-1.5 w-1/4">Date: {formatDate(data?.created_at)}</td>
            <td className="border px-3 py-1.5 w-1/4">Age: {data?.outdoor_invoice?.age || data?.age || 'N/A'} years</td>

          </tr>
          <tr className="border">
            <td className="border px-3 py-1.5" colSpan={2}>Patient name: {data?.outdoor_invoice?.patient_name || data?.patient_name || 'N/A'}</td>
            <td className="border px-3 py-1.5">Sex: {data?.outdoor_invoice?.sex || data?.sex || 'N/A'}</td>
          </tr>
          <tr className="border">
            <td className="border px-3 py-2" colSpan={2}>
              Ref. Doctor: {data?.ref_doctor || data?.outdoor_invoice?.doctor?.doctor_name || '-'}
            </td>
            <td className="border px-3 py-2">
              Phone: {data?.outdoor_invoice?.phone || data?.phone || '-'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Test Table - 2 Column Layout */}
      <table className="w-full text-sm mt-4">
        <tbody>
          {/* Row 1: PHYSICAL EXAMINATION | CHEMICAL EXAMINATION */}
          <tr className="align-top">
            <td className="py-1" colSpan={2}>
              <table className="w-full">
                <tbody>
                  <tr className={`border-b-${borderWidth}`}>
                    <td className="px-3 py-1 font-semibold bg-gray-100" colSpan={2}>PHYSICAL EXAMINATION</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1">Colour</td>
                    <td className="px-3 py-1">{data?.color || data?.colour || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1">Consistency</td>
                    <td className="px-3 py-1">{data?.consistency || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1">Mucous</td>
                    <td className="px-3 py-1">{data?.mucous || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1">Blood</td>
                    <td className="px-3 py-1">{data?.blood || data?.occult_blood || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1">Helminths</td>
                    <td className="px-3 py-1">{data?.helminths || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td className="pl-4 py-1" colSpan={2}>
              <table className="w-full mb-2">
                <tbody>
                  <tr className={`border-b border-b-${borderWidth}`}>
                    <td className="px-3 py-1 font-semibold bg-gray-100" colSpan={2}>CHEMICAL EXAMINATION</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1">Reaction</td>
                    <td className="px-3 py-1">{data?.reaction || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1">Reducing Substance</td>
                    <td className="px-3 py-1">{data?.reducing_substance || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1">Occult Blood</td>
                    <td className="px-3 py-1">{data?.occult_blood || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1">Bile Pigments</td>
                    <td className="px-3 py-1">{data?.bile_pigments || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1">Bile Salts</td>
                    <td className="px-3 py-1">{data?.bile_salts || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Row 2: MICROSCOPIC EXAMINATION (Full Width) */}
          <tr>
            <td className="py-1" colSpan={4}>
              <table className="w-full">
                <tbody>
                  <tr className={`border-b border-b-${borderWidth}`}>
                    <td className="px-3 py-1 font-semibold bg-gray-100" colSpan={4}>MICROSCOPIC EXAMINATION</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1 w-1/4">Ova of</td>
                    <td className="px-3 py-1 w-1/4">{data?.ova_of || '-'}</td>
                    <td className="px-3 py-1 w-1/4">Pus Cells</td>
                    <td className="px-3 py-1 w-1/4">{data?.pusCells || data?.pus_cells || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1 w-1/4">Cysts of</td>
                    <td className="px-3 py-1 w-1/4">{data?.cysts_of || '-'}</td>
                    <td className="px-3 py-1 w-1/4">Epithelial Cells</td>
                    <td className="px-3 py-1 w-1/4">{data?.epithelialCells || data?.epithelium || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1 w-1/4">Larva of</td>
                    <td className="px-3 py-1 w-1/4">{data?.larva_of || '-'}</td>
                    <td className="px-3 py-1 w-1/4">RBC</td>
                    <td className="px-3 py-1 w-1/4">{data?.rbc || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1 w-1/4">Trophozoite of</td>
                    <td className="px-3 py-1 w-1/4">{data?.trophozoite_of || '-'}</td>
                    <td className="px-3 py-1 w-1/4">Macrophage</td>
                    <td className="px-3 py-1 w-1/4">{data?.macrophage || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1 w-1/4">Vegetable Cells</td>
                    <td className="px-3 py-1 w-1/4">{data?.vegetable_cells || '-'}</td>
                    <td className="px-3 py-1 w-1/4">Undigested Food</td>
                    <td className="px-3 py-1 w-1/4">{data?.undigested_food || '-'}</td>
                  </tr>
                  <tr className={`border-dashed border-b-${borderWidth}`}>
                    <td className="px-3 py-1 w-1/4">Fat Globules</td>
                    <td className="px-3 py-1 w-1/4">{data?.fat_globules || '-'}</td>
                    <td className="px-3 py-1 w-1/4">Others</td>
                    <td className="px-3 py-1 w-1/4">{data?.others || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
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
      <p className="text-sm mt-2">
        <span className="font-semibold">Test Carried Out By:</span> &nbsp;
        {data?.test_carried_out_by || 'N/A'}
      </p>

      <ReportFooter />

     
    </div>
  );
}
