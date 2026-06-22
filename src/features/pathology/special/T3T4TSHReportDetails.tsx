import { Button } from "@/components/ui/button";
import { ReportFooter } from '@/components/pathology/ReportFooter'

interface T3T4TSHReportDetailsProps {
    t3t4tshData: {
        id: number;
        invoice_id: number;
        t3: string;
        t4: string;
        tsh: string;
        remarks?: string;
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
    paddingTop?: number;
}

export default function T3T4TSHReportDetails({ t3t4tshData, invoiceData, paddingTop = 40 }: T3T4TSHReportDetailsProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const borderWidth = 2;
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
                THYROID FUNCTION TEST (T3/T4/TSH) REPORT
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
                        <td className="px-3 py-2">T3 (Triiodothyronine)</td>
                        <td className="px-3 py-2">{t3t4tshData?.t3 || 'Pending'} ng/dL</td>
                        <td className="px-3 py-2">0.6-1.8 ng/dL</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">T4 (Thyroxine)</td>
                        <td className="px-3 py-2">{t3t4tshData?.t4 || 'Pending'} µg/dL</td>
                        <td className="px-3 py-2">4.5-12.5 µg/dL</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">TSH (Thyroid Stimulating Hormone)</td>
                        <td className="px-3 py-2">{t3t4tshData?.tsh || 'Pending'} µIU/mL</td>
                        <td className="px-3 py-2">0.4-4.2 µIU/mL</td>
                    </tr>
                    {t3t4tshData?.remarks && (
                        <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                            <td className="px-3 py-2">Remarks</td>
                            <td className="px-3 py-2" colSpan={2}>{t3t4tshData.remarks}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Tested By */}
            <p className="text-sm mt-4">
                <span className="font-semibold">Test Carried Out By:</span> &nbsp;
                {t3t4tshData?.test_carried_out_by || 'Not specified'}
            </p>

            <ReportFooter />

           
        </div>
    );
}
