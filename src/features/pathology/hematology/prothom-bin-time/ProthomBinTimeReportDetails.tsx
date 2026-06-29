import { Button } from "@/components/ui/button";
import { ReportFooter } from '@/components/pathology/ReportFooter'

interface ProthombinTimeData {
    id: number;
    invoice_id: number;
    pt_test: string | null;
    control_pt: string | null;
    inr: string | null;
    remarks: string | null;
    machine_id: number | null;
    test_carried_out_by: string | null;
    created_at: string;
        ref_doctor?: string | null;
    outdoor_invoice?: {
        id: number;
        patient_name: string;
        age: string;
        sex: string;
        age_text: string;
        doctor_id: number | null;
        invoice_date: string;
            phone?: string;
    };
}

interface ProthomBinTimeReportDetailsProps {
    data: ProthombinTimeData | null;
    paddingTop?: number;
}

export default function ProthomBinTimeReportDetails({ data, paddingTop = 40 }: ProthomBinTimeReportDetailsProps) {
    const borderWidth = 2;

    if (!data) {
        return <div className="flex justify-center items-center min-h-screen">No data available</div>;
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:w-[850px]" style={{ paddingTop: `${paddingTop}px` }}>
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
                PROTHROMBIN TIME REPORT
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
            <td className="border px-3 py-2" colSpan={2}>
              Ref. Doctor: {data?.ref_doctor || (data?.outdoor_invoice?.doctor_id ? `Dr. ID: ${data.outdoor_invoice.doctor_id}` : '-')}
            </td>
            <td className="border px-3 py-2">
              Phone: {data?.outdoor_invoice?.phone || '-'}
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
                    <tr className={`border-b-${borderWidth} border-dashed`}>
                        <td className="px-3 py-2">Prothrombin Time (PT)</td>
                        <td className="px-3 py-2">{data.pt_test ? `${data.pt_test} sec` : 'N/A'}</td>
                        <td className="px-3 py-2">11-15 seconds</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed`}>
                        <td className="px-3 py-2">Control PT</td>
                        <td className="px-3 py-2">{data.control_pt ? `${data.control_pt} sec` : 'N/A'}</td>
                        <td className="px-3 py-2">11-15 seconds</td>
                    </tr>
                    <tr className={`border-b-${borderWidth} border-dashed`}>
                        <td className="px-3 py-2">INR (International Normalized Ratio)</td>
                        <td className="px-3 py-2">{data.inr || 'N/A'}</td>
                        <td className="px-3 py-2">0.9-1.1</td>
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
                <span className="font-semibold">Test Carried Out By:</span> &nbsp;
                {data.test_carried_out_by || 'N/A'}
            </p>

            <ReportFooter />

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
