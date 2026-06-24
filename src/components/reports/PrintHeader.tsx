interface PrintHeaderProps {
  title: string
  subtitle?: string
  dateRange?: { start?: string; end?: string }
  generatedAt?: string
}

export function PrintHeader({ title, subtitle, dateRange, generatedAt }: PrintHeaderProps) {
  const now = generatedAt || new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="hidden print:block print-report-header mb-6">
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase">Sheba Hospital</h1>
        <p className="text-sm text-gray-600 mt-1">123 Hospital Road, Dhaka, Bangladesh | Tel: +880-1234-567890</p>
        <div className="mt-3 inline-block border border-gray-300 rounded px-6 py-1">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>
          {dateRange?.start && dateRange?.end
            ? `Period: ${dateRange.start} to ${dateRange.end}`
            : dateRange?.start
            ? `From: ${dateRange.start}`
            : 'All dates'}
        </span>
        <span>Generated: {now}</span>
      </div>
    </div>
  )
}
