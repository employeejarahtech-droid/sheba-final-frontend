
export type Role =
    | "super-admin"
    | "tenant-admin"
    | "employee"
    | "hr"
    | "sales"
    | "accounting"
    | "inventory";

export interface RoleRoute {
    path: string;
    element: string; // or React.ComponentType if you want actual components
    allowed: Role[];
}


export const roleRoutes: RoleRoute[] = [
    {
        path: "/dashboard",
        element: "DashboardPage",
        allowed: ["super-admin", "tenant-admin", "employee", "hr"],
    },
    {
        path: "/sales",
        element: "SalesPage",
        allowed: ["super-admin", "sales", "tenant-admin"],
    },
    {
        path: "/accounting",
        element: "AccountingPage",
        allowed: ["super-admin", "accounting", "tenant-admin"],
    },
    {
        path: "/hr",
        element: "HRPage",
        allowed: ["super-admin", "hr", "tenant-admin"],
    },
    {
        path: "/inventory",
        element: "InventoryPage",
        allowed: ["super-admin", "inventory", "tenant-admin"],
    },
];
