import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '@/stores/auth-store'

type FooterItemType = 'blank' | 'current_user' | 'custom'
type FooterItem = { text: string; type: FooterItemType; customText?: string }

const DEFAULT_ITEMS: FooterItem[] = [
    { text: 'Checked by', type: 'blank' },
    { text: 'Medical Technologist Lab.', type: 'blank' },
]

// Older saved settings are a plain string[] — upgrade each entry to the
// current { text, type } shape (defaulting to 'blank').
function normalizeItems(raw: unknown): FooterItem[] | null {
    if (!Array.isArray(raw) || raw.length === 0) return null
    const items = raw
        .map((it) =>
            typeof it === 'string'
                ? { text: it, type: 'blank' as const }
                : {
                    text: it?.text ?? '',
                    type: it?.type === 'current_user' ? 'current_user' as const : it?.type === 'custom' ? 'custom' as const : 'blank' as const,
                    customText: typeof it?.customText === 'string' ? it.customText : '',
                }
        )
        .filter((it) => it.text?.trim())
    return items.length > 0 ? items : null
}

interface ReportFooterProps {
    // Controlled mode: pages with their own Print Settings panel own this
    // state themselves and pass it in (+ a setter for a checkbox they render
    // inside their own panel). When omitted, ReportFooter falls back to its
    // legacy self-contained behavior below (own state + DOM-portal-injected
    // checkbox next to a `#padding-select` element) for pages that haven't
    // been migrated to a Print Settings panel yet.
    showSignature?: boolean
    onShowSignatureChange?: (value: boolean) => void
}

export function ReportFooter({ showSignature: controlledShowSignature, onShowSignatureChange }: ReportFooterProps = {}) {
    const isControlled = controlledShowSignature !== undefined

    const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null)
    const [uncontrolledShowSignature, setUncontrolledShowSignature] = useState(() => {
        // Pathology default is true (yes), others default to false (no)
        const isPathology = window.location.pathname.includes('/pathology/')
        return isPathology
    })

    const showSignature = isControlled ? controlledShowSignature : uncontrolledShowSignature
    const setShowSignature = isControlled ? (onShowSignatureChange ?? (() => {})) : setUncontrolledShowSignature

    const { data } = useQuery({
        queryKey: ['company-settings'],
        queryFn: async () => {
            const res = await api.get('/company-settings')
            return res.data.data
        },
        staleTime: 5 * 60 * 1000,
    })

    const currentUserName = useAuthStore((s) => s.user?.name)

    useEffect(() => {
        if (isControlled) return // the parent's own Print Settings panel owns the checkbox
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
    }, [isControlled])

    let items = DEFAULT_ITEMS
    if (data?.report_footer_items) {
        try {
            const normalized = normalizeItems(JSON.parse(data.report_footer_items))
            if (normalized) items = normalized
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
                    {items.map((item: FooterItem, i: number) => {
                        const align = items.length === 1 ? 'center' : i === 0 ? 'left' : i === items.length - 1 ? 'right' : 'center'
                        return (
                            <div key={i} style={{ textAlign: align }}>
                                {item.type === 'current_user' ? (
                                    <>
                                        <p className="font-medium">{currentUserName || '-'}</p>
                                        <span className="inline-block border-t border-dashed pt-1">{item.text}:</span>
                                    </>
                                ) : item.type === 'custom' && item.customText?.trim() ? (
                                    <>
                                        <p className="font-medium whitespace-pre-line">{item.customText}</p>
                                        <span className="inline-block border-t border-dashed pt-1">{item.text}:</span>
                                    </>
                                ) : (
                                    <span className="inline-block border-t border-dashed pt-1">{item.text}:</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </>
    )
}
