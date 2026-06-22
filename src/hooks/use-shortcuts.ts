import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export type ShortcutCombo = {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    key: string
}

export type ShortcutDef = {
    combo: ShortcutCombo
    to: string
    label: string
    category: string
}

/** Ordered categories used for display on the Help page. */
export const SHORTCUT_CATEGORIES = [
    'Quick Actions',
    'General',
    'Patients & Reception',
    'Accounting',
    'Pathology',
    'Masters',
] as const

/** Global keyboard shortcuts. `ctrl` matches Ctrl OR ⌘ (meta) for cross-platform. */
export const SHORTCUTS: ShortcutDef[] = [
    // Quick Actions
    { combo: { ctrl: true, key: 'i' }, to: '/dashboard/admission/invoice/create', label: 'New Indoor Invoice', category: 'Quick Actions' },
    { combo: { ctrl: true, key: 'o' }, to: '/dashboard/outdoor/reception/invoices/create', label: 'New Outdoor Invoice', category: 'Quick Actions' },
    { combo: { ctrl: true, key: 'n' }, to: '/dashboard/admission/new-admission', label: 'New Admission', category: 'Quick Actions' },
    { combo: { ctrl: true, key: 'p' }, to: '/dashboard/admission/patients', label: 'Admitted Patients', category: 'Quick Actions' },
    { combo: { ctrl: true, key: 'l' }, to: '/dashboard/outdoor/reception/invoices/list', label: 'Outdoor Invoices list', category: 'Quick Actions' },
    { combo: { ctrl: true, key: 'e' }, to: '/dashboard/admission/invoice/list', label: 'Indoor Invoices list', category: 'Quick Actions' },
    // General
    { combo: { alt: true, key: 'd' }, to: '/dashboard', label: 'Dashboard', category: 'General' },
    { combo: { alt: true, key: 's' }, to: '/dashboard/settings', label: 'Settings', category: 'General' },
    { combo: { alt: true, key: 'm' }, to: '/dashboard/my-account', label: 'My Account', category: 'General' },
    { combo: { alt: true, key: 'n' }, to: '/dashboard/notifications', label: 'Notifications', category: 'General' },
    // Patients & Reception
    { combo: { alt: true, key: 'p' }, to: '/dashboard/outdoor/reception/patients', label: 'Outdoor Patients', category: 'Patients & Reception' },
    { combo: { alt: true, key: 'u' }, to: '/dashboard/outdoor/reception/due-collection', label: 'Outdoor Due Collection', category: 'Patients & Reception' },
    { combo: { alt: true, key: 'x' }, to: '/dashboard/admission/due-collection', label: 'Indoor Due Collection', category: 'Patients & Reception' },
    { combo: { alt: true, key: 'f' }, to: '/dashboard/admission/final-bills', label: 'Final Bills', category: 'Patients & Reception' },
    { combo: { alt: true, key: 'g' }, to: '/dashboard/admission/patients/discharged', label: 'Discharged Patients', category: 'Patients & Reception' },
    // Accounting
    { combo: { alt: true, key: 'a' }, to: '/dashboard/accounting/accounts', label: 'Chart of Accounts', category: 'Accounting' },
    { combo: { alt: true, key: 'j' }, to: '/dashboard/accounts/journal', label: 'Journal', category: 'Accounting' },
    { combo: { alt: true, key: 't' }, to: '/dashboard/accounting/transactions', label: 'Transactions', category: 'Accounting' },
    { combo: { alt: true, key: 'q' }, to: '/dashboard/accounting/income', label: 'Income', category: 'Accounting' },
    { combo: { alt: true, key: 'w' }, to: '/dashboard/accounting/expenses', label: 'Expenses', category: 'Accounting' },
    { combo: { alt: true, key: 'r' }, to: '/dashboard/accounting/reports/trial-balance', label: 'Trial Balance', category: 'Accounting' },
    { combo: { alt: true, key: 'z' }, to: '/dashboard/accounting/reports/profit-and-loss', label: 'Profit & Loss', category: 'Accounting' },
    // Pathology
    { combo: { alt: true, key: 'h' }, to: '/dashboard/pathology/hematology/all', label: 'Hematology — All Reports', category: 'Pathology' },
    { combo: { alt: true, key: 'c' }, to: '/dashboard/pathology/biochemical/all', label: 'Biochemical — All Reports', category: 'Pathology' },
    { combo: { alt: true, key: 'y' }, to: '/dashboard/pathology/hormone/all', label: 'Hormone — All Reports', category: 'Pathology' },
    { combo: { alt: true, key: 'o' }, to: '/dashboard/pathology/immunology/all', label: 'Immunology — All Reports', category: 'Pathology' },
    // Masters
    { combo: { alt: true, key: 'v' }, to: '/dashboard/outdoor/master/tests', label: 'Tests (master)', category: 'Masters' },
    { combo: { alt: true, key: 'k' }, to: '/dashboard/outdoor/master/doctors', label: 'Doctors (master)', category: 'Masters' },
    { combo: { alt: true, key: 'b' }, to: '/dashboard/indoor/master/bed-cabin-list', label: 'Bed / Cabin list', category: 'Masters' },
]

function isEditableTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null
    if (!el) return false
    const tag = el.tagName
    return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
    )
}

function matches(combo: ShortcutCombo, e: KeyboardEvent): boolean {
    const wantCtrl = !!combo.ctrl
    const hasCtrl = e.ctrlKey || e.metaKey
    return (
        wantCtrl === hasCtrl &&
        !!combo.alt === e.altKey &&
        !!combo.shift === e.shiftKey &&
        e.key.toLowerCase() === combo.key.toLowerCase()
    )
}

/**
 * Registers a global keydown listener that navigates to a route for each
 * registered shortcut. Mount once inside the authenticated layout.
 * Shortcuts are ignored while typing in inputs/textareas/contenteditable.
 */
export function useShortcuts() {
    const navigate = useNavigate()

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (isEditableTarget(e.target)) return
            for (const s of SHORTCUTS) {
                if (matches(s.combo, e)) {
                    e.preventDefault()
                    navigate({ to: s.to as any })
                    return
                }
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [navigate])
}
