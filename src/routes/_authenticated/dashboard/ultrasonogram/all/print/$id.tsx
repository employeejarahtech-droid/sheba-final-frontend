import { createFileRoute, Link } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Main } from "@/components/layout/main"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import { useEffect, useRef, useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'

export const Route = createFileRoute('/_authenticated/dashboard/ultrasonogram/all/print/$id')({
  component: PrintUltrasonogramReport,
})

function PrintUltrasonogramReport() {
  const { id } = Route.useParams()
  const token = getCookie('accessToken')
  const hasPrinted = useRef(false)
  const [paddingTop, setPaddingTop] = useState(100)

  // Generate padding options from 10 to 200 in increments of 5
  const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5); // [10, 15, 20, ..., 200]

  const { data: ultrasonogramData, isLoading } = useQuery({
    queryKey: ["ultrasonogram-record", id],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all/builder/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!res.ok) {
        throw new Error(`Failed to fetch Ultrasonogram data (${res.status}: ${res.statusText})`)
      }

      const json = await res.json()
      console.log('API Response:', json)
      return json.data
    },
    enabled: !!token,
  })

  // Auto-print only on initial load, not on refresh
  useEffect(() => {
    if (ultrasonogramData && !hasPrinted.current) {
      const printKey = `ultrasonogram-print-${id}`
      const alreadyPrinted = sessionStorage.getItem(printKey)

      if (!alreadyPrinted) {
        hasPrinted.current = true
        sessionStorage.setItem(printKey, 'true')
        setTimeout(() => {
          window.print()
        }, 500)
      }
    }
  }, [ultrasonogramData, id])

  if (isLoading) {
    return (
      <>
        <AppHeader fixed />
        <Main>
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading...</p>
          </div>
        </Main>
      </>
    )
  }

  const patientInfo = ultrasonogramData?.invoice_information
  const testResult = ultrasonogramData?.test_result

  const invoiceDate = patientInfo?.invoice_date
    ? new Date(patientInfo.invoice_date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "N/A"

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/dashboard/ultrasonogram/all/edit/builder/$id" params={{ id }}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Edit
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="padding-select" className="text-sm font-medium">Margin Top:</label>
              <select
                id="padding-select"
                value={paddingTop}
                onChange={(e) => setPaddingTop(Number(e.target.value))}
                className="h-8 px-2 text-sm border rounded-md bg-background"
              >
                {paddingOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}px
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

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
            `}
          </style>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center underline mb-6 tracking-wide uppercase">
            Ultrasonogram Report
          </h1>

          {/* Header Table */}
          <table className="w-full text-sm border">
            <tbody>
              <tr className="border">
                <td className="border px-3 py-2 w-1/4">Receipt ID : {patientInfo?.id || 'N/A'}</td>
                <td className="border px-3 py-2 w-1/4">Date: {invoiceDate}</td>
                <td className="border px-3 py-2 w-1/4">Age: {patientInfo?.age_text || patientInfo?.age || 'N/A'}</td>
              </tr>
              <tr className="border">
                <td className="border px-3 py-2" colSpan={2}>Patient name: {patientInfo?.patient_name || 'N/A'}</td>
                <td className="border px-3 py-2">Sex: {patientInfo?.sex || 'N/A'}</td>
              </tr>
              <tr className="border">
                <td className="border px-3 py-2" colSpan={3}>
                  Phone: {patientInfo?.phone || 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Test Table */}
          <table className="w-full text-sm mt-6">
            <tbody>
              <tr className="">
                <td className="px-3 py-2">
                  <div
                    className="text-gray-700 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: testResult || '<em>Pending...</em>'
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer Signatures */}
          <div className="grid grid-cols-2 mt-32 text-sm">
            <div>
              <p className="border-t border-dashed w-40 pt-1 text-center">Checked By:</p>
            </div>
            <div className="text-center">
              <p className="border-t border-dashed w-56 ml-auto pt-1">Radiologist:</p>
            </div>
          </div>

          {/* Buttons */}

        </div>
      </Main>
    </>
  )
}
