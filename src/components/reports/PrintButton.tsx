import { Printer } from 'lucide-react'

interface PrintButtonProps {
  reportTitle?: string
  className?: string
}

export function PrintButton({ reportTitle, className = '' }: PrintButtonProps) {
  const handlePrint = () => {
    if (reportTitle) {
      document.title = `${reportTitle} - Sheba Hospital`
    }
    window.print()
    if (reportTitle) {
      // restore title after print dialog
      setTimeout(() => { document.title = 'Sheba HMS' }, 1000)
    }
  }

  return (
    <button
      onClick={handlePrint}
      className={`inline-flex items-center gap-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors print:hidden ${className}`}
    >
      <Printer className="w-4 h-4" />
      Print Report
    </button>
  )
}
