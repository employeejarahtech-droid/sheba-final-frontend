// Hospital Management System — module & page permissions.
//
// Generated from the dashboard sidebar (components/layout/data/sidebar-data.ts)
// so it always covers EVERY module and page. Each page exposes action-level
// permissions (View / Create / Edit / Delete); report pages are view-only.

import { sidebarData } from '@/components/layout/data/sidebar-data'

export const SuperAdminPermission = {
    ACCESS_ALL: '*' as const,
}

export type PermAction = { label: string; value: string }
export type PermPage = { label: string; actions: PermAction[] }
export type PermGroups = Record<string, PermPage[]>

const ACTION_LABELS: Record<string, string> = {
    view: 'View',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
}
const CRUD = ['view', 'create', 'edit', 'delete']
const VIEW_ONLY = ['view']

// '/dashboard/outdoor/master/tests' → 'outdoor.master.tests'
// '/dashboard'                      → 'dashboard'
const urlToPermission = (url: string): string => {
    const path = url.replace(/^\/+/, '').replace(/^dashboard\/?/, '')
    return path ? path.replace(/\//g, '.') : 'dashboard'
}

// Pages whose permissions aren't plain CRUD get a custom action set here, keyed
// by the permission base (urlToPermission of the page's sidebar URL). These
// override the auto-generated CRUD for pages like view-only utilities or the
// media gallery (view / upload / delete).
const CUSTOM_PAGE_ACTIONS: Record<string, { label: string; action: string }[]> = {
    // Overview utility pages are view-only.
    dashboard: [{ label: 'View', action: 'view' }],
    subscription: [{ label: 'View', action: 'view' }],
    'company-account': [{ label: 'View', action: 'view' }],
    // Gallery manages media: view / upload / delete.
    gallery: [
        { label: 'View', action: 'view' },
        { label: 'Upload', action: 'upload' },
        { label: 'Delete', action: 'delete' },
    ],
    // Outdoor — Reception. Invoice + payment-collection pages; most are
    // view-only reports. "Collection" gates the collect / confirm-payment action.
    'outdoor.reception.invoices.create': [
        { label: 'View', action: 'view' },
        { label: 'Create', action: 'create' },
    ],
    'outdoor.reception.due-collection': [
        { label: 'View', action: 'view' },
        { label: 'Collection', action: 'collection' },
    ],
    'outdoor.reception.paid-invoices': [
        { label: 'View', action: 'view' },
        { label: 'Collection', action: 'collection' },
    ],
    // "All Invoices" and "Patients by Referrer" share the same list component
    // (features/invoices/index.tsx), whose Actions column has real Edit / Note
    // / Pay-Now buttons beyond plain viewing — gate those separately instead
    // of bundling them into "view".
    'outdoor.reception.invoices.list': [
        { label: 'View', action: 'view' },
        { label: 'Edit', action: 'edit' },
        { label: 'Note', action: 'note' },
        { label: 'Collection', action: 'collection' },
    ],
    'outdoor.reception.my-invoices': [{ label: 'View', action: 'view' }],
    'outdoor.reception.user-invoices': [{ label: 'View', action: 'view' }],
    'outdoor.reception.all-collections': [{ label: 'View', action: 'view' }],
    'outdoor.reception.my-collections': [{ label: 'View', action: 'view' }],
    'outdoor.reception.user-wise-collections': [{ label: 'View', action: 'view' }],
    'outdoor.reception.patients-by-referrer': [
        { label: 'View', action: 'view' },
        { label: 'Edit', action: 'edit' },
        { label: 'Note', action: 'note' },
        { label: 'Collection', action: 'collection' },
    ],
    // Indoor — Admission. Admission + billing/discharge workflow; most list
    // pages are view-only. "All Patients" exposes the workflow actions.
    // NOTE: sidebar URLs are /dashboard/admission/* (no "indoor/" segment),
    // so the permission base is "admission.*".
    'admission.new-admission': [
        { label: 'View', action: 'view' },
        { label: 'Create', action: 'create' },
    ],
    'admission.patients': [
        { label: 'View', action: 'view' },
        { label: 'Bill Create', action: 'bill-create' },
        { label: 'Final Bill Create', action: 'final-bill-create' },
        { label: 'Discharge', action: 'discharge' },
        { label: 'Collection', action: 'collection' },
    ],
    'admission.patients.active': [{ label: 'View', action: 'view' }],
    'admission.patients.bill-created-list': [{ label: 'View', action: 'view' }],
    'admission.patients.final-bill-created-list': [{ label: 'View', action: 'view' }],
    'admission.patients.discharged-list': [{ label: 'View', action: 'view' }],
    'admission.patients.discharged-paid-list': [{ label: 'View', action: 'view' }],
    'admission.patients.discharged-due-list': [{ label: 'View', action: 'view' }],
    'admission.all-collections': [{ label: 'View', action: 'view' }],
    'admission.my-collections': [{ label: 'View', action: 'view' }],
    'admission.user-wise-collections': [{ label: 'View', action: 'view' }],
    // Indoor — Management. Bill-distribution + professional-fee reports; all
    // view-only. (The 4 bill-distribution items sit in this card but their
    // URLs are /dashboard/admission/patients/*, so their base is admission.*.)
    'admission.patients.bill-not-distributed-list': [{ label: 'View', action: 'view' }],
    'admission.patients.bill-distributed-partial-list': [{ label: 'View', action: 'view' }],
    'admission.patients.bill-distributed-list': [{ label: 'View', action: 'view' }],
    'admission.patients.balance-distributed-list': [{ label: 'View', action: 'view' }],
    'indoor.management.doctor-referred': [{ label: 'View', action: 'view' }],
    'indoor.management.anesthesia-bill': [{ label: 'View', action: 'view' }],
    'indoor.management.assistant-bill': [{ label: 'View', action: 'view' }],
    'indoor.management.surgeon-bill': [{ label: 'View', action: 'view' }],
    'indoor.management.clinical-bills': [{ label: 'View', action: 'view' }],
    'indoor.management.other-bills': [{ label: 'View', action: 'view' }],
}

// Custom pages use their mapped action set; reports/registers are view-only;
// everything else gets full CRUD.
const actionsFor = (groupName: string, base: string): PermAction[] => {
    const custom = CUSTOM_PAGE_ACTIONS[base]
    if (custom) {
        return custom.map((a) => ({ label: a.label, value: `${base}.${a.action}` }))
    }
    // Pathology report pages and Diagnostics pages: view + edit (edit report
    // results). Matches "Pathology — <sub>" / "Diagnostics — <sub>" cards only,
    // NOT the Reports-section "Pathology Reports" card (no " — " separator).
    if (groupName.startsWith('Pathology — ') || groupName.startsWith('Diagnostics — ')) {
        return ['view', 'edit'].map((a) => ({ label: ACTION_LABELS[a], value: `${base}.${a}` }))
    }
    const isReadOnly = groupName.startsWith('Reports')
    const acts = isReadOnly ? VIEW_ONLY : CRUD
    return acts.map((a) => ({ label: ACTION_LABELS[a], value: `${base}.${a}` }))
}

// Build one group per sidebar sub-menu; each page becomes a row with actions.
const buildFeatureGroups = (): PermGroups => {
    const groups: PermGroups = {}

    for (const navGroup of sidebarData.navGroups as any[]) {
        for (const item of navGroup.items as any[]) {
            if (Array.isArray(item.items) && item.items.length > 0) {
                const groupName = `${navGroup.title} — ${item.title}`
                const pages: PermPage[] = []
                for (const sub of item.items as any[]) {
                    if (sub.url) {
                        pages.push({ label: sub.title, actions: actionsFor(groupName, urlToPermission(sub.url)) })
                    }
                }
                if (pages.length > 0) groups[groupName] = pages
            } else if (item.url) {
                groups[navGroup.title] = groups[navGroup.title] || []
                groups[navGroup.title].push({
                    label: item.title,
                    actions: actionsFor(navGroup.title, urlToPermission(item.url)),
                })
            }
        }
    }

    return groups
}

// Dashboard widgets — single toggle each, shown on the "Dashboard" tab.
const Dashboard: PermPage[] = [
    { label: 'View Dashboard', actions: [{ label: 'Enable', value: 'dashboard.view' }] },
    { label: 'Financial Summary', actions: [{ label: 'Enable', value: 'dashboard.financial_summary' }] },
    { label: 'Patient Statistics', actions: [{ label: 'Enable', value: 'dashboard.patient_stats' }] },
    { label: 'Revenue Charts', actions: [{ label: 'Enable', value: 'dashboard.revenue_charts' }] },
    { label: 'Recent Activity', actions: [{ label: 'Enable', value: 'dashboard.recent_activity' }] },
]

// `Dashboard` powers the "Dashboard" tab; every other group powers the
// "Features Permissions" tab (the editor filters out the Dashboard key).
export const PERMISSION_GROUPS: PermGroups = {
    Dashboard,
    ...buildFeatureGroups(),
}

export type PermissionType = string
