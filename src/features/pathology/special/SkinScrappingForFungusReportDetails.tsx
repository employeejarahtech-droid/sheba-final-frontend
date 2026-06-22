import { Button } from "@/components/ui/button";
import { ReportFooter } from '@/components/pathology/ReportFooter'

interface SkinScrappingForFungusReportDetailsProps {
    skinScrappingData: {
        id: number;
        invoice_id: number;
        site: string;
        fungus_type: string;
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

export default function SkinScrappingForFungusReportDetails({ skinScrappingData, invoiceData, paddingTop = 40 }: SkinScrappingForFungusReportDetailsProps) {
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
                SKIN SCRAPPING FOR FUNGUS REPORT
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
                        <td className="px-3 py-2">10% KOH Mount Result</td>
                        <td className="px-3 py-2 font-semibold">{skinScrappingData?.site || 'Pending'}</td>
                        <td className="px-3 py-2">Negative</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                        <td className="px-3 py-2">Type of Fungus Identified</td>
                        <td className="px-3 py-2">{skinScrappingData?.fungus_type || 'Pending'}</td>
                        <td className="px-3 py-2">--</td>
                    </tr>
                    {skinScrappingData?.remarks && (
                        <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                            <td className="px-3 py-2">Comments / Impression</td>
                            <td className="px-3 py-2" colSpan={2}>{skinScrappingData.remarks}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Tested By */}
            <p className="text-sm mt-4">
                <span className="font-semibold">Test Carried Out By:</span> &nbsp;
                {skinScrappingData?.test_carried_out_by || 'Not specified'}
            </p>

            <ReportFooter />

           
        </div>
    );
}
