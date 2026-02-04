import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { topNav } from '@/data/data'
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

export const Route = createFileRoute(
    '/_authenticated/roles/permissions/$roleId/edit',
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
                permissions: roleView.permissions || [],
                dashboard: roleView.settings?.dashboard || [],
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
        <>
            <Header fixed>
                <TopNav links={topNav} />
                <div className="ms-auto flex items-center space-x-4">
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <main className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
                <div className="space-y-6 lg:p-6">
                    <Card className="py-6">
                        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b pb-4">
                            <div className="flex flex-col">
                                <CardTitle className="text-lg font-semibold">
                                    Edit Role & Permissions
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Update role details and manage permissions
                                </p>
                            </div>

                            <Button asChild variant="outline" size="sm" className="gap-2">
                                <Link to="/roles">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Roles
                                </Link>
                            </Button>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Role Code</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ADMIN" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="display_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Display Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="System Administrator" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Short description" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="block w-full">Status</FormLabel>
                                                    <Select key={field.value} onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="w-full">
                                                            <SelectItem value="active">Active</SelectItem>
                                                            <SelectItem value="inactive">Inactive</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Permissions</h3>
                                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                                                <TabsTrigger value="role-permissions">Features Permissions</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="dashboard" className="space-y-4 pt-4">
                                                {(() => {
                                                    const dashboardPerms = PERMISSION_GROUPS.Dashboard;
                                                    const values = Object.values(dashboardPerms);
                                                    const allChecked = values.length > 0 && values.every(p =>
                                                        dashboardPermissions.includes(p)
                                                    );

                                                    return (
                                                        <Card>
                                                            <CardHeader className="flex flex-row items-center justify-between py-3 border-b">
                                                                <CardTitle className="text-sm font-medium">
                                                                    Dashboard
                                                                </CardTitle>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 text-xs underline"
                                                                    onClick={() => toggleDashboardGroup(values)}
                                                                >
                                                                    {allChecked ? "Unselect All" : "Select All"}
                                                                </Button>
                                                            </CardHeader>

                                                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                                                                {Object.entries(dashboardPerms).map(([label, permission]) => (
                                                                    <label
                                                                        key={permission}
                                                                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                                                    >
                                                                        <Checkbox
                                                                            checked={dashboardPermissions.includes(permission)}
                                                                            onCheckedChange={() =>
                                                                                toggleDashboardPermission(permission)
                                                                            }
                                                                        />
                                                                        {label}
                                                                    </label>
                                                                ))}
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })()}
                                            </TabsContent>

                                            <TabsContent value="role-permissions" className="space-y-4 pt-4">
                                                {Object.entries(PERMISSION_GROUPS)
                                                    .filter(([groupName]) => groupName !== "Dashboard")
                                                    .map(([groupName, perms]) => {
                                                        const values = Object.values(perms);
                                                        const allChecked = values.length > 0 && values.every(p =>
                                                            permissions.includes(p)
                                                        );

                                                        return (
                                                            <Card key={groupName}>
                                                                <CardHeader className="flex flex-row items-center justify-between py-3 border-b">
                                                                    <CardTitle className="text-sm font-medium">
                                                                        {groupName}
                                                                    </CardTitle>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-8 text-xs underline"
                                                                        onClick={() => toggleGroup(values)}
                                                                    >
                                                                        {allChecked ? "Unselect All" : "Select All"}
                                                                    </Button>
                                                                </CardHeader>

                                                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                                                    {Object.entries(perms).map(([label, permission]) => (
                                                                        <label
                                                                            key={permission}
                                                                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                                                        >
                                                                            <Checkbox
                                                                                checked={permissions.includes(permission)}
                                                                                onCheckedChange={() =>
                                                                                    togglePermission(permission)
                                                                                }
                                                                            />
                                                                            {label}
                                                                        </label>
                                                                    ))}
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                            </TabsContent>
                                        </Tabs>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={updateRoleIsLoading}>
                                            {updateRoleIsLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                            {updateRoleIsLoading ? "Saving..." : "Save Role"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    )
}
