import { Button } from "@/components/ui/button";

export default function CBCWithPBFReportDetails({ report: invoice }: any) {
    // Extract patient info from nested outdoor_invoice object
    const patientInfo = invoice?.outdoor_invoice || {};
    const invoiceDate = patientInfo.invoice_date
        ? new Date(patientInfo.invoice_date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "N/A";

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
            <h1 className="text-2xl font-bold text-center underline mb-6 tracking-wide uppercase">
                CBC With PBF Report
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

            {/* Test Table - Hematology Indices */}
            <h2 className="text-lg font-semibold mt-6 mb-2">Hematology Indices</h2>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-t border-b bg-row-blue">
                        <th className="px-3 py-2 text-left w-[40%]">Test name</th>
                        <th className="px-3 py-2 text-left w-[30%]">Test Result</th>
                        <th className="px-3 py-2 text-left w-[30%]">Normal Range</th>
                    </tr>
                </thead>

                <tbody>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">Hemoglobin</td>
                        <td className="px-3 py-2">{invoice.hemoglobin || 'N/A'} g/dL</td>
                        <td className="px-3 py-2">13.0-17.0 (M), 11.5-15.5 (F)</td>
                    </tr>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">RBC Count</td>
                        <td className="px-3 py-2">{invoice.rbc_count || 'N/A'} million/cmm</td>
                        <td className="px-3 py-2">4.5-5.9 (M), 4.0-5.2 (F)</td>
                    </tr>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">WBC Count</td>
                        <td className="px-3 py-2">{invoice.wbc_count || 'N/A'}/cmm</td>
                        <td className="px-3 py-2">4000-11000</td>
                    </tr>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">Platelets</td>
                        <td className="px-3 py-2">{invoice.platelets || 'N/A'}/cmm</td>
                        <td className="px-3 py-2">150000-400000</td>
                    </tr>
                </tbody>
            </table>

            {/* Test Table - RBC Indices */}
            <h2 className="text-lg font-semibold mt-6 mb-2">RBC Indices</h2>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-t border-b bg-row-blue">
                        <th className="px-3 py-2 text-left w-[40%]">Test name</th>
                        <th className="px-3 py-2 text-left w-[30%]">Test Result</th>
                        <th className="px-3 py-2 text-left w-[30%]">Normal Range</th>
                    </tr>
                </thead>

                <tbody>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">HCT</td>
                        <td className="px-3 py-2">{invoice.hct || 'N/A'} %</td>
                        <td className="px-3 py-2">40-50 (M), 36-46 (F)</td>
                    </tr>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">MCV</td>
                        <td className="px-3 py-2">{invoice.mcv || 'N/A'} fL</td>
                        <td className="px-3 py-2">80-100</td>
                    </tr>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">MCH</td>
                        <td className="px-3 py-2">{invoice.mch || 'N/A'} pg</td>
                        <td className="px-3 py-2">27-33</td>
                    </tr>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">MCHC</td>
                        <td className="px-3 py-2">{invoice.mchc || 'N/A'} g/dL</td>
                        <td className="px-3 py-2">32-36</td>
                    </tr>
                </tbody>
            </table>

            {/* Test Table - Differential Count */}
            <h2 className="text-lg font-semibold mt-6 mb-2">Differential Count</h2>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-t border-b bg-row-blue">
                        <th className="px-3 py-2 text-left w-[40%]">Test name</th>
                        <th className="px-3 py-2 text-left w-[30%]">Test Result</th>
                        <th className="px-3 py-2 text-left w-[30%]">Normal Range</th>
                    </tr>
                </thead>

                <tbody>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">Neutrophils</td>
                        <td className="px-3 py-2">{invoice.neutrophils || 'N/A'} %</td>
                        <td className="px-3 py-2">40-75</td>
                    </tr>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">Lymphocytes</td>
                        <td className="px-3 py-2">{invoice.lymphocytes || 'N/A'} %</td>
                        <td className="px-3 py-2">20-45</td>
                    </tr>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">Monocytes</td>
                        <td className="px-3 py-2">{invoice.monocytes || 'N/A'} %</td>
                        <td className="px-3 py-2">2-10</td>
                    </tr>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">Eosinophils</td>
                        <td className="px-3 py-2">{invoice.eosinophils || 'N/A'} %</td>
                        <td className="px-3 py-2">0-6</td>
                    </tr>
                    <tr className="border-b border-dashed">
                        <td className="px-3 py-2">Basophils</td>
                        <td className="px-3 py-2">{invoice.basophils || 'N/A'} %</td>
                        <td className="px-3 py-2">0-2</td>
                    </tr>
                </tbody>
            </table>

            {/* PBF Findings */}
            {invoice.pbf_findings && (
                <>
                    <h2 className="text-lg font-semibold mt-6 mb-2">PBF Findings</h2>
                    <p className="text-sm px-3 py-2 border border-dashed">
                        {invoice.pbf_findings}
                    </p>
                </>
            )}

            {/* Tested By */}
            <p className="text-sm mt-4">
                <span className="font-semibold">Test Carried out by:</span> &nbsp;
                {invoice.test_carried_out_by || 'N/A'}
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
