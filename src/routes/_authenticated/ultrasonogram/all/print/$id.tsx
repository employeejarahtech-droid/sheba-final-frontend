import { createFileRoute, Link } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Header } from "@/components/layout/header"
import { Main } from "@/components/layout/main"
import { TopNav } from "@/components/layout/top-nav"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Search } from "@/components/search"
import { ThemeSwitch } from "@/components/theme-switch"
import { ConfigDrawer } from "@/components/config-drawer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { topNav } from '@/data/data'
import { useEffect, useRef } from 'react'

type LabTest = {
  id: number
  invoice_id: number
  test_id: number | null
  test_name: string | null
  test_result: string | null
  created_at: string | null
  updated_at: string | null
}

type InvoiceData = {
  invoice_information: {
    id: number
    patient_name: string
    age: string
    age_text?: string
    sex: string
    invoice_date: string
    phone: string
  } | null
  ultrasonogram_all_info: LabTest[]
}

export const Route = createFileRoute('/_authenticated/ultrasonogram/all/print/$id')({
  component: PrintUltrasonogramReport,
})

function PrintUltrasonogramReport() {
  const { id } = Route.useParams()
  const token = getCookie('accessToken')
  const hasPrinted = useRef(false)

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["ultrasonogram-invoice", id],
    queryFn: async (): Promise<InvoiceData> => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!res.ok) {
        throw new Error(`Failed to fetch Ultrasonogram data (${res.status}: ${res.statusText})`)
      }

      const json = await res.json()
      return json.data
    },
    enabled: !!token,
  })

  // Auto-print only on initial load, not on refresh
  useEffect(() => {
    if (invoiceData && !hasPrinted.current) {
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
  }, [invoiceData, id])

  if (isLoading) {
    return (
      <>
        <Header fixed className="print:hidden">
          <TopNav links={topNav} />
          <div className='ms-auto flex items-center space-x-4'>
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading...</p>
          </div>
        </Main>
      </>
    )
  }

  const invoice = invoiceData
  const patientInfo = invoice?.invoice_information
  const tests = invoice?.ultrasonogram_all_info || []

  const invoiceDate = patientInfo?.invoice_date
    ? new Date(patientInfo.invoice_date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "N/A"

  return (
    <>
      <Header fixed className="print:hidden">
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-4 print:hidden">
          <Link to="/ultrasonogram/all">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Ultrasonogram Reports
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl w-full mx-auto bg-background pt-10 pb-10 px-5 mt-6 print:w-[850px] print-report">
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
            <thead>
              <tr className="border-t border-b bg-row-blue">
                <th className="px-3 py-2 text-left w-[15%]">#</th>
                <th className="px-3 py-2 text-left w-[85%]">Test Name & Result</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test, index) => (
                <tr key={test.id} className="border-b border-dashed">
                  <td className="px-3 py-2 align-top">{index + 1}</td>
                  <td className="px-3 py-2">
                    <div className="mb-2">
                      <span className="font-semibold">{test.test_name || '-'}</span>
                    </div>
                    <div
                      className="text-gray-700 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: test.test_result || '<em>Pending...</em>'
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Signatures */}
          <div className="grid grid-cols-2 mt-32 text-sm">
            <div>
              <p className="border-t border-dashed w-40 pt-1 text-center">Checked By:</p>
            </div>
            <div className="text-right">
              <p className="border-t border-dashed w-56 ml-auto pt-1">Radiologist:</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-10 print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              Print
            </Button>
          </div>
        </div>
      </Main>
    </>
  )
}
