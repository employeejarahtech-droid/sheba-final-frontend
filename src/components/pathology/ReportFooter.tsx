import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

const DEFAULT_ITEMS = ['Checked by', 'Medical Technologist Lab.']

export function ReportFooter() {
    const { data } = useQuery({
        queryKey: ['company-settings'],
        queryFn: async () => {
            const res = await api.get('/company-settings')
            return res.data.data
        },
        staleTime: 5 * 60 * 1000,
    })

    let items = DEFAULT_ITEMS
    if (data?.report_footer_items) {
        try {
            const parsed = JSON.parse(data.report_footer_items)
            if (Array.isArray(parsed) && parsed.length > 0) items = parsed.filter((s: string) => s?.trim())
        } catch { /* defaults */ }
    }

    return (
        <div className="grid mt-32 text-sm" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
            {items.map((item: string, i: number) => {
                const align = items.length === 1 ? 'center' : i === 0 ? 'left' : i === items.length - 1 ? 'right' : 'center'
                return (
                    <div key={i} style={{ textAlign: align }}>
                        <span className="inline-block border-t border-dashed pt-1">{item}:</span>
                    </div>
                )
            })}
        </div>
    )
}
