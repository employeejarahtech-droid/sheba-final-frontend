/**
 * Permission helpers for role-based UI gating.
 *
 * Safety model (avoids locking anyone out during rollout):
 *   • Admins (company_admin / platform_admin) → full access
 *   • A role whose permission list contains '*'   → full access
 *   • A role with NO permissions configured (empty) → full access
 *       (permissions only start restricting once explicitly assigned)
 *   • Otherwise → the role must hold the specific permission string
 */

interface PermUser {
    userType?: string | null
    permissions?: string[] | null
}

// '/dashboard/outdoor/master/tests' → 'outdoor.master.tests'
// '/dashboard'                      → 'dashboard'
export const urlToPermission = (url: string): string => {
    const path = url.replace(/^\/+/, '').replace(/^dashboard\/?/, '')
    return path ? path.replace(/\//g, '.') : 'dashboard'
}

export const isUnrestricted = (user?: PermUser | null): boolean => {
    if (!user) return false
    if (user.userType === 'company_admin' || user.userType === 'platform_admin') return true
    const perms = Array.isArray(user.permissions) ? user.permissions : []
    if (perms.length === 0) return true // not configured yet → don't restrict
    if (perms.includes('*')) return true
    return false
}

export const hasPermission = (user: PermUser | null | undefined, permission: string): boolean => {
    if (isUnrestricted(user)) return true
    const perms = Array.isArray(user?.permissions) ? user!.permissions! : []
    return perms.includes(permission)
}

// Can the user open the page at this URL? (checks the page's ".view" permission)
export const canViewUrl = (user: PermUser | null | undefined, url?: string): boolean => {
    if (!url) return true
    if (isUnrestricted(user)) return true
    return hasPermission(user, `${urlToPermission(url)}.view`)
}

/**
 * Recursively filter sidebar items to those the user may see. Parent
 * (collapsible) items are kept only if at least one descendant is visible.
 */
export const filterNavItems = <T extends { url?: string; items?: T[] }>(
    user: PermUser | null | undefined,
    items: T[],
): T[] => {
    if (isUnrestricted(user)) return items
    const out: T[] = []
    for (const item of items) {
        if (item.items && item.items.length > 0) {
            const children = filterNavItems(user, item.items)
            if (children.length > 0) out.push({ ...item, items: children })
        } else if (item.url) {
            if (canViewUrl(user, item.url)) out.push(item)
        } else {
            out.push(item)
        }
    }
    return out
}

/** Filter whole sidebar groups, dropping any that end up empty. */
export const filterNavGroups = <G extends { items: any[] }>(
    user: PermUser | null | undefined,
    groups: G[],
): G[] => {
    if (isUnrestricted(user)) return groups
    return groups
        .map((g) => ({ ...g, items: filterNavItems(user, g.items) }))
        .filter((g) => g.items.length > 0)
}
