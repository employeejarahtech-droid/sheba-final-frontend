import { ReportFooter } from '@/components/pathology/ReportFooter'

interface SemenReportDetailsProps {
    semenData: {
        id: number;
        invoice_id: number;
        // Collection & timing
        sample_collection?: string;
        time_of_ejaculation?: string;
        time_of_examination?: string;
        // Physical
        volume?: string;
        color?: string;
        odour?: string;
        consistency?: string;
        // Chemical
        ph?: string;
        fructose?: string;
        // Microscopic
        pus_cells?: string;
        epithelial?: string;
        rbc?: string;
        // Sperm analysis
        count?: string;
        motility?: string;
        morphology?: string;
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

export default function SemenReportDetails({ semenData, invoiceData, paddingTop = 40 }: SemenReportDetailsProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // A single label / value / normal-range row.
    const Row = ({ label, value, range }: { label: string; value?: string; range?: string }) => (
        <tr className="border-b">
            <td className="px-3 py-1">{label}</td>
            <td className="px-3 py-1">{value || '-'}</td>
            {range !== undefined && <td className="px-3 py-1">{range}</td>}
        </tr>
    );

    // Section header for a sub-table.
    const SectionHead = ({ title, withRange = false }: { title: string; withRange?: boolean }) => (
        <tr className="border-b">
            <td className="px-3 py-1 font-semibold bg-gray-100" colSpan={withRange ? 3 : 2}>{title}</td>
        </tr>
    );

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
                SEMEN ANALYSIS REPORT
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

            {/* Collection & Timing */}
            <table className="w-full text-sm mt-6">
                <tbody>
                    <SectionHead title="REPORT OF EXAMINATION OF SEMINAL FLUID" />
                    <Row label="Sample Collection" value={semenData?.sample_collection} />
                    <Row label="Time of Ejaculation" value={semenData?.time_of_ejaculation} />
                    <Row label="Time of Examination" value={semenData?.time_of_examination} />
                </tbody>
            </table>

            {/* Physical | Chemical & Microscopic - 2 column layout */}
            <table className="w-full text-sm mt-4">
                <tbody>
                    <tr className="align-top">
                        <td className="py-1" colSpan={2}>
                            <table className="w-full">
                                <tbody>
                                    <SectionHead title="PHYSICAL EXAMINATION" />
                                    <Row label="Volume" value={semenData?.volume ? `${semenData.volume} mL` : undefined} />
                                    <Row label="Color" value={semenData?.color} />
                                    <Row label="Odour" value={semenData?.odour} />
                                    <Row label="Consistency" value={semenData?.consistency} />
                                </tbody>
                            </table>
                        </td>
                        <td className="pl-4 py-1" colSpan={2}>
                            <table className="w-full">
                                <tbody>
                                    <SectionHead title="CHEMICAL EXAMINATION" />
                                    <Row label="pH" value={semenData?.ph} />
                                    <Row label="Fructose" value={semenData?.fructose} />
                                </tbody>
                            </table>
                            <table className="w-full mt-2">
                                <tbody>
                                    <SectionHead title="MICROSCOPIC EXAMINATION (per HPF)" />
                                    <Row label="Pus Cells" value={semenData?.pus_cells} />
                                    <Row label="Epithelial" value={semenData?.epithelial} />
                                    <Row label="RBC" value={semenData?.rbc} />
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Sperm Analysis with normal ranges */}
            <table className="w-full text-sm mt-6">
                <thead>
                    <tr className="border-t border-b bg-row-blue">
                        <th className="px-3 py-2 text-left w-[40%]">Sperm Analysis</th>
                        <th className="px-3 py-2 text-left w-[30%]">Result</th>
                        <th className="px-3 py-2 text-left w-[30%]">Normal Range</th>
                    </tr>
                </thead>
                <tbody>
                    <Row label="Volume" value={semenData?.volume ? `${semenData.volume} mL` : undefined} range="1.5 - 5.0 mL" />
                    <Row label="Sperm Count" value={semenData?.count ? `${semenData.count} million/mL` : undefined} range="≥ 15 million/mL" />
                    <Row label="Motility" value={semenData?.motility ? `${semenData.motility}%` : undefined} range="≥ 40% (progressive)" />
                    <Row label="Morphology" value={semenData?.morphology ? `${semenData.morphology}%` : undefined} range="≥ 4% normal forms" />
                </tbody>
            </table>

            {/* Remarks */}
            {semenData?.remarks && (
                <div className="mt-6 text-sm border p-4">
                    <p><span className="font-semibold">Remarks:</span> {semenData.remarks}</p>
                </div>
            )}

            {/* Tested By */}
            <p className="text-sm mt-4">
                <span className="font-semibold">Test Carried Out By:</span> &nbsp;
                {semenData?.test_carried_out_by || 'Not specified'}
            </p>

            <ReportFooter />
        </div>
    );
}
