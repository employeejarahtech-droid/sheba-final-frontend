import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader, ShieldCheck, Lock, CircleCheck } from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { cn } from '@/lib/utils'



import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { useGetRoleByIdQuery, useUpdateRoleMutation } from '@/features/roles/roleQueries'
import { PERMISSION_GROUPS } from '@/constants/permissions'

const roleSchema = z.object({
    role: z.string().min(1, "Role code is required"),
    display_name: z.string().min(1, "Display name is required"),
    description: z.string().optional(),
    status: z.enum(["active", "inactive"]),
    permissions: z.array(z.string()),
    dashboard: z.array(z.string()),
});

type RoleFormValues = z.infer<typeof roleSchema>;

// Permissions/dashboard can arrive from the API as an array, a JSON string,
// or null. Always coerce to a string array so the UI never crashes.
const toStringArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string');
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
        } catch {
            return [];
        }
    }
    return [];
};

// Shared form-control styling — one height (h-10) and one look across every
// input and select so the form reads clean and professional.
const FIELD_BASE =
    "h-10 rounded-md border border-input bg-transparent text-sm shadow-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring";

// Cycled gradient palette for the permission-group cards (Dashboard + each
// Features group) so every nested group is a proper card matching the page's
// card design, kept coordinated instead of a rainbow.
const GROUP_GRADIENTS = [
    "bg-gradient-to-r from-blue-600 to-indigo-600",
    "bg-gradient-to-r from-emerald-600 to-teal-600",
    "bg-gradient-to-r from-amber-600 to-orange-600",
    "bg-gradient-to-r from-rose-600 to-pink-600",
    "bg-gradient-to-r from-cyan-600 to-sky-600",
    "bg-gradient-to-r from-violet-600 to-purple-600",
];

export const Route = createFileRoute(
    '/_authenticated/dashboard/roles/permissions/$roleId/edit',
)({
    component: EditRolePermissions,
})

function EditRolePermissions() {
    const { roleId } = Route.useParams();
    const [activeTab, setActiveTab] = useState("dashboard");

    const { data, isLoading } = useGetRoleByIdQuery(roleId);
    const { mutateAsync: updateRole, isPending: updateRoleIsLoading } = useUpdateRoleMutation();

    const roleView = data?.data;

    const form = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            role: "",
            display_name: "",
            description: "",
            status: "active",
            permissions: [],
            dashboard: [],
        },
    });

    // Update form when API data is loaded
    useEffect(() => {
        if (roleView) {
            form.reset({
                role: roleView.role || "",
                display_name: roleView.display_name || "",
                description: roleView.description || "",
                status: (roleView.status as "active" | "inactive") || "active",
                permissions: toStringArray(roleView.permissions),
                dashboard: toStringArray(roleView.settings?.dashboard),
            });
        }
    }, [roleView, form]);

    const permissions = useWatch({
        control: form.control,
        name: "permissions",
    });

    const dashboardPermissions = useWatch({
        control: form.control,
        name: "dashboard",
    });

    // Defensive: render code calls .includes(), so guarantee arrays.
    const selectedPermissions = Array.isArray(permissions) ? permissions : [];
    const selectedDashboard = Array.isArray(dashboardPermissions) ? dashboardPermissions : [];

    const togglePermission = (value: string) => {
        const current = form.getValues("permissions");
        form.setValue(
            "permissions",
            current.includes(value)
                ? current.filter(p => p !== value)
                : [...current, value]
        );
    };

    const toggleDashboardPermission = (value: string) => {
        const current = form.getValues("dashboard");
        form.setValue(
            "dashboard",
            current.includes(value)
                ? current.filter(p => p !== value)
                : [...current, value]
        );
    };

    const toggleGroup = (groupPermissions: string[]) => {
        const current = form.getValues("permissions");
        const allSelected = groupPermissions.every(p =>
            current.includes(p)
        );

        form.setValue(
            "permissions",
            allSelected
                ? current.filter(p => !groupPermissions.includes(p))
                : Array.from(new Set([...current, ...groupPermissions]))
        );
    };

    const toggleDashboardGroup = (groupPermissions: string[]) => {
        const current = form.getValues("dashboard");
        const allSelected = groupPermissions.every(p =>
            current.includes(p)
        );

        form.setValue(
            "dashboard",
            allSelected
                ? current.filter(p => !groupPermissions.includes(p))
                : Array.from(new Set([...current, ...groupPermissions]))
        );
    };

    const onSubmit = async (values: RoleFormValues) => {
        try {
            const response = await updateRole({
                roleId,
                body: {
                    display_name: values.display_name,
                    description: values.description,
                    status: values.status,
                    permissions: values.permissions,
                    dashboard: values.dashboard,
                }
            });
            if (response.status) {
                toast.success(response.message || "Role updated successfully");
            } else {
                toast.error(response.message || "Failed to update role");
            }
        } catch (error: any) {
            console.error("Failed to update role:", error);
            toast.error(error?.response?.data?.message || "Something went wrong while updating the role.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Loading role...</span>
                </div>
            </div>
        );
    }

    if (!roleView) {
        return (
            <div className="p-6 text-center text-red-500">
                Role not found or data is missing.
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader fixed />

            <Main className="p-6 lg:p-10 w-full flex-1">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
                        <div>
                            <h1 className="text-2xl font-black">Edit Role & Permissions</h1>
                            <p className="text-muted-foreground mt-1 text-sm font-medium">
                                Update role details and manage permissions
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="hidden sm:flex items-center gap-2 rounded-xl border-gray-200" asChild>
                                <Link to="/dashboard/roles">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Roles
                                </Link>
                            </Button>
                            <Button type="submit" form="role-permissions-form" disabled={updateRoleIsLoading}>
                                {updateRoleIsLoading ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CircleCheck className="h-4 w-4" />
                                )}
                                {updateRoleIsLoading ? "Saving..." : "Save Role"}
                            </Button>
                        </div>
                    </div>

                    <Form {...form}>
                        <form id="role-permissions-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Card 1: Role Details */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 border-b py-1.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <ShieldCheck className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-white">Role Details</CardTitle>
                                            <p className="text-xs text-blue-100">Role information and status</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6 py-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Role Code</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ADMIN" {...field} disabled readOnly className={cn(FIELD_BASE, "bg-muted/50 cursor-not-allowed")} />
                                                    </FormControl>
                                                    <p className="text-xs text-muted-foreground">The role code is the identifier and can't be changed.</p>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="display_name"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Display Name <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="System Administrator" className={FIELD_BASE} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Short description" className={FIELD_BASE} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status <span className="text-destructive">*</span></FormLabel>
                                                    <Select key={field.value} onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className={cn("w-full", FIELD_BASE)}>
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="active">Active</SelectItem>
                                                            <SelectItem value="inactive">Inactive</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Permissions */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                                <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 border-b py-1.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <Lock className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-white">Permissions</CardTitle>
                                            <p className="text-xs text-purple-100">Dashboard and feature access control</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6 py-6">
                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                                            <TabsTrigger value="role-permissions">Features Permissions</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="dashboard" className="space-y-4 pt-4">
                                            {(() => {
                                                const pages = PERMISSION_GROUPS.Dashboard;
                                                const values = pages.flatMap((p) => p.actions.map((a) => a.value));
                                                const allChecked = values.length > 0 && values.every(v =>
                                                    selectedDashboard.includes(v)
                                                );

                                                return (
                                                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                                                        <CardHeader className={cn("border-b py-2 px-4 gap-0", GROUP_GRADIENTS[0])}>
                                                            <div className="flex items-center justify-between gap-2 w-full">
                                                                <CardTitle className="text-sm font-bold text-white">Dashboard</CardTitle>
                                                                <div className="flex items-center gap-2">
                                                                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs text-white hover:bg-white/20 underline" onClick={() => toggleDashboardGroup(values)}>
                                                                        {allChecked ? "Unselect All" : "Select All"}
                                                                    </Button>
                                                                    <Button type="submit" size="sm" disabled={updateRoleIsLoading} className="h-7 px-3 text-xs bg-white/20 hover:bg-white/30 text-white border-0 shadow-none">
                                                                        {updateRoleIsLoading ? "Saving..." : "Save"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="px-4 py-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                {pages.map((page) => (
                                                                    <label key={page.label} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                                                                        <Checkbox
                                                                            checked={selectedDashboard.includes(page.actions[0].value)}
                                                                            onCheckedChange={() => toggleDashboardPermission(page.actions[0].value)}
                                                                        />
                                                                        {page.label}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })()}
                                        </TabsContent>

                                        <TabsContent value="role-permissions" className="space-y-4 pt-4">
                                            {Object.entries(PERMISSION_GROUPS)
                                                .filter(([groupName]) => groupName !== "Dashboard")
                                                .map(([groupName, pages], idx) => {
                                                    const values = pages.flatMap((p) => p.actions.map((a) => a.value));
                                                    const allChecked = values.length > 0 && values.every(v =>
                                                        selectedPermissions.includes(v)
                                                    );

                                                    return (
                                                        <Card key={groupName} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                                                            <CardHeader className={cn("border-b py-2 px-4 gap-0", GROUP_GRADIENTS[idx % GROUP_GRADIENTS.length])}>
                                                                <div className="flex items-center justify-between gap-2 w-full">
                                                                    <CardTitle className="text-sm font-bold text-white">{groupName}</CardTitle>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs text-white hover:bg-white/20 underline" onClick={() => toggleGroup(values)}>
                                                                            {allChecked ? "Unselect All" : "Select All"}
                                                                        </Button>
                                                                        <Button type="submit" size="sm" disabled={updateRoleIsLoading} className="h-7 px-3 text-xs bg-white/20 hover:bg-white/30 text-white border-0 shadow-none">
                                                                            {updateRoleIsLoading ? "Saving..." : "Save"}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="px-4 py-2">
                                                                <div className="hidden sm:flex items-center justify-between px-0 pt-1 pb-2">
                                                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Page</span>
                                                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>
                                                                </div>
                                                                <div className="divide-y">
                                                                    {pages.map((page) => (
                                                                        <div key={page.label} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                                                                            <span className="text-sm font-medium text-foreground">{page.label}</span>
                                                                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                                                                                {page.actions.length > 0 ? page.actions.map((action) => (
                                                                                    <label key={action.value} className="flex items-center gap-1.5 text-xs cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                                                                        <Checkbox
                                                                                            checked={selectedPermissions.includes(action.value)}
                                                                                            onCheckedChange={() => togglePermission(action.value)}
                                                                                        />
                                                                                        {action.label}
                                                                                    </label>
                                                                                )) : (
                                                                                    <span className="text-xs text-muted-foreground italic">No actions defined</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {/* Action Buttons at Bottom */}
                            <div className="flex items-center justify-end gap-3 pt-4 pb-10">
                                <Button type="button" variant="outline" className="rounded-xl border-gray-200" asChild>
                                    <Link to="/dashboard/roles">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={updateRoleIsLoading} className="min-w-[150px]">
                                    {updateRoleIsLoading ? (
                                        <Loader className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <CircleCheck className="h-4 w-4 mr-2" />
                                    )}
                                    {updateRoleIsLoading ? "Saving..." : "Save Role"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </Main>
        </div>
    )
}
