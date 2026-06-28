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

// Reports/registers are read-only → View only. Everything else gets full CRUD.
const actionsFor = (groupName: string, base: string): PermAction[] => {
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
