import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const DEFAULT_ITEMS = ['Checked by', 'Medical Technologist Lab.']

export function ReportFooter() {
    const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null)
    const [showSignature, setShowSignature] = useState(() => {
        // Pathology default is true (yes), others default to false (no)
        const isPathology = window.location.pathname.includes('/pathology/')
        return isPathology
    })

    const { data } = useQuery({
        queryKey: ['company-settings'],
        queryFn: async () => {
            const res = await api.get('/company-settings')
            return res.data.data
        },
        staleTime: 5 * 60 * 1000,
    })

    useEffect(() => {
        let container: HTMLDivElement | null = null

        const tryInject = () => {
            const selectEl = document.getElementById('padding-select')
            if (!selectEl) return false

            const parentDiv = selectEl.parentElement
            if (!parentDiv) return false

            const grandParent = parentDiv.parentElement
            if (!grandParent) return false

            // Create a wrapper container for the checkbox
            container = document.createElement('div')
            container.className = 'flex items-center gap-1.5 ml-4 print:hidden'
            
            // Insert it as a sibling right after the padding-select container
            grandParent.insertBefore(container, parentDiv.nextSibling)
            setPortalTarget(container)
            return true
        }

        if (!tryInject()) {
            const interval = setInterval(() => {
                if (tryInject()) {
                    clearInterval(interval)
                }
            }, 100)
            return () => {
                clearInterval(interval)
                if (container) container.remove()
            }
        }

        return () => {
            if (container) container.remove()
        }
    }, [])

    let items = DEFAULT_ITEMS
    if (data?.report_footer_items) {
        try {
            const parsed = JSON.parse(data.report_footer_items)
            if (Array.isArray(parsed) && parsed.length > 0) items = parsed.filter((s: string) => s?.trim())
        } catch { /* defaults */ }
    }

    const checkboxPortal = portalTarget ? createPortal(
        <>
            <input
                type="checkbox"
                id="signature-checkbox"
                checked={showSignature}
                onChange={(e) => setShowSignature(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="signature-checkbox" className="text-sm font-medium cursor-pointer select-none text-gray-700">
                Signature
            </label>
        </>,
        portalTarget
    ) : null

    return (
        <>
            {checkboxPortal}
            {showSignature && (
                <div
                    className="flex mt-32 text-sm w-full report-signature-footer"
                    style={{ justifyContent: items.length === 1 ? 'center' : 'space-between' }}
                >
                    {items.map((item: string, i: number) => {
                        const align = items.length === 1 ? 'center' : i === 0 ? 'left' : i === items.length - 1 ? 'right' : 'center'
                        return (
                            <div key={i} style={{ textAlign: align }}>
                                <span className="inline-block border-t border-dashed pt-1">{item}:</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </>
    )
}
