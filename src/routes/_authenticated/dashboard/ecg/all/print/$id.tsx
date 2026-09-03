import { createFileRoute, Link } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { Main } from "@/components/layout/main"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, Settings2 } from "lucide-react"
import { useEffect, useRef, useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { ReportFooter } from '@/components/pathology/ReportFooter'
import { FONT_SIZE_OPTIONS, DEFAULT_FONT_SIZE, type FontSizeKey } from '@/lib/print-font-size'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

export const Route = createFileRoute('/_authenticated/dashboard/ecg/all/print/$id')({
  component: PrintECGReport,
})

function PrintECGReport() {
  const { id } = Route.useParams()
  const token = getCookie('accessToken')
  const hasPrinted = useRef(false)
  const [paddingTop, setPaddingTop] = useState(100)
  const [fontSize, setFontSize] = useState<FontSizeKey>(DEFAULT_FONT_SIZE)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showSignature, setShowSignature] = useState(true)

  const { data: ecgData, isLoading } = useQuery({
    queryKey: ["ecg-record", id],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ecg-all/builder/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!res.ok) {
        throw new Error(`Failed to fetch ECG data (${res.status}: ${res.statusText})`)
      }

      const json = await res.json()
      console.log('API Response:', json)
      return json.data
    },
    enabled: !!token,
  })



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

  const patientInfo = ecgData?.invoice_information
  const testName = ecgData?.test_name
  const testResult = ecgData?.test_result

  const invoiceDate = patientInfo?.invoice_date
    ? new Date(patientInfo.invoice_date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "N/A"

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/dashboard/ecg/all/edit/$id" params={{ id: String(ecgData?.invoice_id) }}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Edit
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="h-4 w-4" />
              <span>Print Settings</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
            <SheetHeader className="border-b px-4 py-3 gap-0">
              <SheetTitle className="flex items-center gap-3 pr-8">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-base font-semibold text-left">Print Settings</div>
                  <SheetDescription className="text-xs font-normal text-left">Adjust how this report looks and prints</SheetDescription>
                </div>
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Size</Label>
                <Select value={fontSize} onValueChange={(v) => setFontSize(v as FontSizeKey)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Font size" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FONT_SIZE_OPTIONS).map(([key, opt]) => (
                      <SelectItem key={key} value={key}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="padding-top" className="text-sm font-medium">Margin Top (px)</Label>
                <Input
                  id="padding-top"
                  type="number"
                  min={0}
                  value={paddingTop}
                  onChange={(e) => setPaddingTop(Number(e.target.value) || 0)}
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="show-signature"
                  checked={showSignature}
                  onCheckedChange={(checked) => setShowSignature(checked === true)}
                />
                <Label htmlFor="show-signature" className="text-sm font-medium cursor-pointer select-none">
                  Signature
                </Label>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:w-[850px] print-report" style={{ paddingTop: `${paddingTop}px`, zoom: FONT_SIZE_OPTIONS[fontSize].zoom }}>
          <style>
            {`
              .bg-row-blue {
                background-color: #cfd2d8ff !important;
              }

              /* Tables inserted via the Content Editor carry no styling of their
                 own (the grid only shows inside Summernote), so paint them here
                 for both screen and print. */
              .custom-html-content table {
                border-collapse: collapse !important;
                width: 100%;
                margin: 8px 0;
              }
              .custom-html-content th,
              .custom-html-content td {
                border: 1px solid rgb(0 0 0 / 0.15) !important;
                padding: 4px 8px;
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
            ECG Report
          </h1>

          {/* Header Table */}
          <table className="w-full text-sm border">
            <tbody>
              <tr className="border">
                <td className="border px-3 py-2 w-1/4">Receipt ID : {patientInfo?.id || '-'}</td>
                <td className="border px-3 py-2 w-1/4">Date: {invoiceDate}</td>
                <td className="border px-3 py-2 w-1/4">Age: {patientInfo?.age || '-'} years</td>
              </tr>
              <tr className="border">
                <td className="border px-3 py-2" colSpan={2}>Patient name: {patientInfo?.patient_name || '-'}</td>
                <td className="border px-3 py-2">Sex: {patientInfo?.sex || '-'}</td>
              </tr>
              <tr className="border">
                <td className="border px-3 py-2" colSpan={2}>
                  Ref. Doctor: {patientInfo?.ref_doctor || '-'}
                </td>
                <td className="border px-3 py-2">
                  Phone: {patientInfo?.phone || '-'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Test Table */}
          <table className="w-full text-sm mt-6">
            <tbody>
              <tr className="">
                <td className="px-3 py-2">
                  <div className="mb-2 text-center">
                    <span className="font-semibold text-lg">{testName || '-'}</span>
                  </div>
                  <div
                    className="custom-html-content text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: testResult || '<em>Pending...</em>'
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer Signatures */}
          <ReportFooter showSignature={showSignature} onShowSignatureChange={setShowSignature} />

          {/* Buttons */}
         
        </div>
      </Main>
    </>
  )
}
