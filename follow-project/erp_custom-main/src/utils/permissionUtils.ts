import type { TUserPath } from "@/types/sidebar.types";

/**
 * Recursively find the first route that the user is allowed to access.
 */
export const getFirstAllowedRoute = (
    items: TUserPath[],
    permissions: string[]
): string => {
    // Check for SuperAdmin permission first (if it's just a string, we might need to handle '*' specifically)
    const isSuperAdmin = permissions.includes("*");

    for (const item of items) {
        const isAllowed =
            isSuperAdmin ||
            !item.allowedPermissions ||
            item.allowedPermissions.length === 0 ||
            item.allowedPermissions.some((p) => permissions.includes(p));

        if (isAllowed) {
            // If it's a direct link (not a parent with children only)
            if (item.url && item.url !== "#") {
                return item.url;
            }
            // If it has children, search them
            if (item.items && item.items.length > 0) {
                const nestedAllowed = getFirstAllowedRoute(item.items, permissions);
                // If we found a valid nested route, return it
                if (nestedAllowed !== "/dashboard") return nestedAllowed;
            }
        }
    }

    return "/dashboard"; // Ultimate fallback
};
