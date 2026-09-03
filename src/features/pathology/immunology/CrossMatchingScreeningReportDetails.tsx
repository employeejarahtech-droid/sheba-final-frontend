import { Button } from "@/components/ui/button";
import { ReportFooter } from '@/components/pathology/ReportFooter'

interface CrossMatchingScreeningData {
    id: number;
    invoice_id: number;
    ict_for_tpha?: string | null;
    ict_for_hbsag?: string | null;
    ict_for_hiv?: string | null;
    ict_for_hcv?: string | null;
    ict_for_malaria_parasite_mp?: string | null;
    major_crossmatch?: string | null;
    antibody_identification?: string | null;
    compatible_blood_unit?: string | null;
    bag_no?: string | null;
    donor_abo_rh?: string | null;
    crossmatch_method?: string | null;
    remarks?: string | null;
    test_carried_out_by?: string | null;
    created_at: string;
}

interface CrossMatchingScreeningReportDetailsProps {
    cmsData: CrossMatchingScreeningData;
    invoiceData: {
        id: number;
        patient_name: string;
        age: string;
        sex: string;
        invoice_date: string;
        phone?: string;
        doctor?: {
            doctor_name?: string;
            qualification?: string;
            title?: string;
        };
    };
    paddingTop?: number;
    fontSize?: number;
    showSignature?: boolean;
}

// The 11 designed fields (Test name / Result only — no Normal Range column).
const RESULT_FIELDS: { label: string; key: keyof CrossMatchingScreeningData }[] = [
    { label: 'ICT for TPHA', key: 'ict_for_tpha' },
    { label: 'ICT for HBsAg', key: 'ict_for_hbsag' },
    { label: 'ICT for HIV', key: 'ict_for_hiv' },
    { label: 'ICT for HCV', key: 'ict_for_hcv' },
    { label: 'ICT for Malaria Parasite (MP)', key: 'ict_for_malaria_parasite_mp' },
    { label: 'Major Crossmatch', key: 'major_crossmatch' },
    { label: 'Antibody Identification', key: 'antibody_identification' },
    { label: 'Compatible Blood Unit', key: 'compatible_blood_unit' },
    { label: 'Bag No', key: 'bag_no' },
    { label: 'Donor ABO/Rh', key: 'donor_abo_rh' },
    { label: 'Crossmatch Method', key: 'crossmatch_method' },
];

export default function CrossMatchingScreeningReportDetails({ cmsData, invoiceData, paddingTop = 40, fontSize = 1, showSignature = true }: CrossMatchingScreeningReportDetailsProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const borderWidth = 2;
    return (
        <div className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:w-[850px] print-report" style={{ paddingTop: `${paddingTop}px`, zoom: fontSize }}>
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
                BLOOD CROSS MATCHING &amp; SCREENING REPORT
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
                        <td className="border px-3 py-2" colSpan={2}>
                            Ref. By: {invoiceData?.doctor?.doctor_name ? `Prof./Dr. ${invoiceData.doctor.doctor_name}` : '-'}{invoiceData?.doctor?.qualification ? ` (${invoiceData.doctor.qualification})` : ''}
                        </td>
                        <td className="border px-3 py-2">
                            Phone: {invoiceData?.phone || '-'}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Test Table */}
            <table className="w-full text-sm mt-6">
                <thead>
                    <tr className="border-t border-b bg-row-blue">
                        <th className="px-3 py-2 text-left w-[50%]">Test name</th>
                        <th className="px-3 py-2 text-left w-[50%]">Test Result</th>
                    </tr>
                </thead>

                <tbody>
                    {RESULT_FIELDS.map((f) => (
                        <tr key={f.key} className={`border-b-${borderWidth} border-dashed border-b`}>
                            <td className="px-3 py-2">{f.label}</td>
                            <td className="px-3 py-2">{cmsData?.[f.key] || 'Pending'}</td>
                        </tr>
                    ))}
                    {cmsData?.remarks && (
                        <tr className={`border-b-${borderWidth} border-dashed border-b`}>
                            <td className="px-3 py-2">Remarks</td>
                            <td className="px-3 py-2" colSpan={2}>{cmsData.remarks}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Tested By */}
            <p className="text-sm mt-4">
                <span className="font-semibold">Test Carried Out By:</span> &nbsp;
                {cmsData?.test_carried_out_by || 'Not specified'}
            </p>

            <ReportFooter showSignature={showSignature} />

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
