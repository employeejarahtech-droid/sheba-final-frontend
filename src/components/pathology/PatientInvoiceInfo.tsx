
export default function PatientInvoiceInfo({ invoiceInfo }: any) {
    return (
        <div className="w-full rounded-xl mx-auto">

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Invoice No</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">{invoiceInfo.invoiceNo}</div>
                </div>

                <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Patient Name</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">Maksudul Haque</div>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Age</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">40 Years</div>
                </div>

                <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Gender</div>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">Male</div>
                </div>
            </div>

        </div>
    )
}
