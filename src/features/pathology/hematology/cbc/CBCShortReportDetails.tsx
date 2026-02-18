import { Button } from "@/components/ui/button";

interface CBCShortReportDetailsProps {
    cbcData: {
        id: number;
        invoice_id: number;
        hemoglobin?: string;
        rbc_count?: string;
        wbc_count?: string;
        platelets?: string;
        hct?: string;
        mcv?: string;
        mch?: string;
        mchc?: string;
        neutrophils?: string;
        lymphocytes?: string;
        monocytes?: string;
        eosinophils?: string;
        basophils?: string;
        test_carried_out_by?: string;
        created_at: string;
    };
    invoiceData: {
        id: number;
        patient_name: string;
        age: string;
        sex: string;
        invoice_date: string;
        reference_doctor?: string;
    };
}

export default function CBCShortReportDetails({ cbcData, invoiceData }: CBCShortReportDetailsProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

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
                COMPLETE BLOOD COUNT (CBC) REPORT
            </h1>

            {/* Header Table */}
            <table className="w-full text-sm border">
                <tbody>
                    <tr className="border">
                        <td className="border px-3 py-2 w-1/4">Receipt ID : {invoiceData?.id}</td>
                        <td className="border px-3 py-2 w-1/4">Date: {invoiceData?.invoice_date ? formatDate(invoiceData.invoice_date) : 'N/A'}</td>
                        <td className="border px-3 py-2 w-1/4">Age: {invoiceData?.age} years</td>

                    </tr>
                    <tr className="border">
                        <td className="border px-3 py-2" colSpan={2}>Patient name: {invoiceData?.patient_name}</td>
                        <td className="border px-3 py-2">Sex: {invoiceData?.sex}</td>
                    </tr>
                    <tr className="border">
                        <td className="border px-3 py-2" colSpan={3}>
                            Refd. By: {invoiceData?.reference_doctor ? `Prof./Dr. ${invoiceData.reference_doctor}` : 'N/A'}
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
                        <td className="px-3 py-2">Hemoglobin (Hb)</td>
                        <td className="px-3 py-2">{cbcData?.hemoglobin || 'Pending'} g/dL</td>
                        <td className="px-3 py-2">Male: 13.5-17.5 g/dL<br/>Female: 12.0-15.5 g/dL</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">RBC Count</td>
                        <td className="px-3 py-2">{cbcData?.rbc_count || 'Pending'} million/cmm</td>
                        <td className="px-3 py-2">Male: 4.5-5.9 million/cmm<br/>Female: 4.0-5.2 million/cmm</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">WBC Count</td>
                        <td className="px-3 py-2">{cbcData?.wbc_count || 'Pending'} /cmm</td>
                        <td className="px-3 py-2">4,000-11,000 /cmm</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">Platelets</td>
                        <td className="px-3 py-2">{cbcData?.platelets || 'Pending'} /cmm</td>
                        <td className="px-3 py-2">1,50,000-4,50,000 /cmm</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">Hematocrit (HCT)</td>
                        <td className="px-3 py-2">{cbcData?.hct || 'Pending'} %</td>
                        <td className="px-3 py-2">Male: 41-53%<br/>Female: 36-46%</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">MCV</td>
                        <td className="px-3 py-2">{cbcData?.mcv || 'Pending'} fL</td>
                        <td className="px-3 py-2">80-100 fL</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">MCH</td>
                        <td className="px-3 py-2">{cbcData?.mch || 'Pending'} pg</td>
                        <td className="px-3 py-2">27-34 pg</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">MCHC</td>
                        <td className="px-3 py-2">{cbcData?.mchc || 'Pending'} g/dL</td>
                        <td className="px-3 py-2">32-36 g/dL</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">Neutrophils</td>
                        <td className="px-3 py-2">{cbcData?.neutrophils || 'Pending'} %</td>
                        <td className="px-3 py-2">40-75 %</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">Lymphocytes</td>
                        <td className="px-3 py-2">{cbcData?.lymphocytes || 'Pending'} %</td>
                        <td className="px-3 py-2">20-45 %</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">Monocytes</td>
                        <td className="px-3 py-2">{cbcData?.monocytes || 'Pending'} %</td>
                        <td className="px-3 py-2">2-10 %</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">Eosinophils</td>
                        <td className="px-3 py-2">{cbcData?.eosinophils || 'Pending'} %</td>
                        <td className="px-3 py-2">0-6 %</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">Basophils</td>
                        <td className="px-3 py-2">{cbcData?.basophils || 'Pending'} %</td>
                        <td className="px-3 py-2">0-1 %</td>
                    </tr>
                </tbody>
            </table>

            {/* Tested By */}
            <p className="text-sm mt-4">
                <span className="font-semibold">Test Carried out by:</span> &nbsp;
                {cbcData?.test_carried_out_by || 'Not specified'}
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
