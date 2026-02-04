"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// role.schema.ts

import { z } from "zod";
import { PERMISSION_GROUPS } from "@/config/permissions";
import { Link, useParams } from "react-router";
import { useGetRoleByIdQuery, useUpdateRoleMutation } from "@/store/features/role/roleApiService";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader } from "lucide-react";


const roleSchema = z.object({
  role: z.string().min(1, "Required"),
  display_name: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  status: z.enum(["active", "inactive"]),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
});

export type RoleFormValues = z.infer<typeof roleSchema>;


export default function PermissionsPage() {

  const { roleId } = useParams();
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data, isLoading } = useGetRoleByIdQuery(roleId as string, { skip: !roleId });
  const [updateRole, { isLoading: updateRoleIsLoading }] = useUpdateRoleMutation()

  const roleView = data?.data


  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: "",
      display_name: "",
      description: "",
      status: "active",
      permissions: [],
    },
  });



  // Update form when API data is loaded
  useEffect(() => {
    if (roleView && Object.keys(roleView).length) {
      form.reset({
        role: roleView.role || "",
        display_name: roleView.display_name || "",
        description: roleView.description || "",
        status: roleView.status as "active" | "inactive",
        permissions: roleView.permissions || [],
      });

    }
  }, [roleView, form]);




  // Watch permissions for checkboxes
  const permissions = useWatch({
    control: form.control,
    name: "permissions",
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

  const onSubmit = async (values: RoleFormValues) => {
    if (!roleId) return;

    try {
      // Call the API mutation
      const response = await updateRole({ roleId, body: values }).unwrap();
      // Success feedback (you can replace with toast or modal)
      if (response.status) {
        console.log("Role updated successfully:", response);
        toast.success(response.message || "Role updated successfully")

      }


      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Error handling
      console.error("Failed to update role:", error);
      alert(
        error?.data?.message || "Something went wrong while updating the role."
      );
    }
  };


  // Loading state
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


  // Role not found
  if (!roleView) {
    return (
      <div className="p-6 text-center text-red-500">
        Role not found or data is missing.
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Card className="py-6">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          {/* Title */}
          <div className="flex flex-col">
            <CardTitle className="text-lg font-semibold">
              Edit Role & Permissions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Update role details and manage permissions
            </p>
          </div>

          {/* Back Button */}
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/dashboard/roles">
              <ArrowLeft className="h-4 w-4" />
              Back to Roles
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Role Info */}
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

              {/* Permissions */}
              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">
                      Permissions
                    </FormLabel>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="role-permissions">Role Permissions</TabsTrigger>
                      </TabsList>

                      {/* Dashboard Tab */}
                      <TabsContent value="dashboard" className="space-y-4">
                        {(() => {
                          const dashboardPerms = PERMISSION_GROUPS.Dashboard;
                          const values = Object.values(dashboardPerms);
                          const allChecked = values.every(p =>
                            permissions.includes(p)
                          );

                          return (
                            <Card className="py-10">
                              <CardHeader className="flex flex-row items-center justify-between py-3">
                                <CardTitle className="text-sm">
                                  Dashboard
                                </CardTitle>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleGroup(values)}
                                >
                                  {allChecked ? "Unselect All" : "Select All"}
                                </Button>
                              </CardHeader>

                              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {values.map(permission => (
                                  <label
                                    key={permission}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <Checkbox
                                      checked={permissions.includes(permission)}
                                      onCheckedChange={() =>
                                        togglePermission(permission)
                                      }
                                    />
                                    {permission}
                                  </label>
                                ))}
                              </CardContent>
                            </Card>
                          );
                        })()}
                      </TabsContent>

                      {/* Role Permissions Tab */}
                      <TabsContent value="role-permissions" className="space-y-4">
                        {Object.entries(PERMISSION_GROUPS)
                          .filter(([groupName]) => groupName !== "Dashboard")
                          .map(([groupName, perms]) => {
                            const values = Object.values(perms);
                            const allChecked = values.every(p =>
                              permissions.includes(p)
                            );

                            return (
                              <Card key={groupName} className="py-10" >
                                <CardHeader className="flex flex-row items-center justify-between py-3">
                                  <CardTitle className="text-sm">
                                    {groupName}
                                  </CardTitle>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toggleGroup(values)}
                                  >
                                    {allChecked ? "Unselect All" : "Select All"}
                                  </Button>
                                </CardHeader>

                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 ">
                                  {values.map(permission => (
                                    <label
                                      key={permission}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <Checkbox
                                        checked={permissions.includes(permission)}
                                        onCheckedChange={() =>
                                          togglePermission(permission)
                                        }
                                      />
                                      {permission}
                                    </label>
                                  ))}
                                </CardContent>
                              </Card>
                            );
                          })}
                      </TabsContent>
                    </Tabs>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={updateRoleIsLoading}>
                  {updateRoleIsLoading ? "Saving..." : "Save Role"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}






//  old code

// "use client";

// import { useForm, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Checkbox } from "@/components/ui/checkbox";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Form,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormControl,
//   FormMessage,
// } from "@/components/ui/form";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";

// // role.schema.ts

// import { z } from "zod";
// import { PERMISSION_GROUPS } from "@/config/permissions";
// import { Link, useParams } from "react-router";
// import { useGetRoleByIdQuery, useUpdateRoleMutation } from "@/store/features/role/roleApiService";
// import { useEffect } from "react";
// import { toast } from "sonner";
// import { ArrowLeft, Loader } from "lucide-react";


// const roleSchema = z.object({
//   role: z.string().min(1, "Required"),
//   display_name: z.string().min(1, "Required"),
//   description: z.string().min(1, "Required"),
//   status: z.enum(["active", "inactive"]),
//   permissions: z.array(z.string()).min(1, "Select at least one permission"),
// });

// export type RoleFormValues = z.infer<typeof roleSchema>;


// export default function PermissionsPage() {

//   const { roleId } = useParams();

//   const { data, isLoading } = useGetRoleByIdQuery(roleId as string, { skip: !roleId });
//   const [updateRole, { isLoading: updateRoleIsLoading }] = useUpdateRoleMutation()

//   const roleView = data?.data


//   const form = useForm<RoleFormValues>({
//     resolver: zodResolver(roleSchema),
//     defaultValues: {
//       role: "",
//       display_name: "",
//       description: "",
//       status: "active",
//       permissions: [],
//     },
//   });



//   // Update form when API data is loaded
//   useEffect(() => {
//     if (roleView && Object.keys(roleView).length) {
//       form.reset({
//         role: roleView.role || "",
//         display_name: roleView.display_name || "",
//         description: roleView.description || "",
//         status: roleView.status as "active" | "inactive",
//         permissions: roleView.permissions || [],
//       });

//     }
//   }, [roleView, form]);




//   // Watch permissions for checkboxes
//   const permissions = useWatch({
//     control: form.control,
//     name: "permissions",
//   });

//   const togglePermission = (value: string) => {
//     const current = form.getValues("permissions");
//     form.setValue(
//       "permissions",
//       current.includes(value)
//         ? current.filter(p => p !== value)
//         : [...current, value]
//     );
//   };

//   const toggleGroup = (groupPermissions: string[]) => {
//     const current = form.getValues("permissions");
//     const allSelected = groupPermissions.every(p =>
//       current.includes(p)
//     );

//     form.setValue(
//       "permissions",
//       allSelected
//         ? current.filter(p => !groupPermissions.includes(p))
//         : Array.from(new Set([...current, ...groupPermissions]))
//     );
//   };

//   const onSubmit = async (values: RoleFormValues) => {
//     if (!roleId) return;

//     try {
//       // Call the API mutation
//       const response = await updateRole({ roleId, body: values }).unwrap();
//       // Success feedback (you can replace with toast or modal)
//       if (response.status) {
//         console.log("Role updated successfully:", response);
//         toast.success(response.message || "Role updated successfully")

//       }


//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (error: any) {
//       // Error handling
//       console.error("Failed to update role:", error);
//       alert(
//         error?.data?.message || "Something went wrong while updating the role."
//       );
//     }
//   };


//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="flex min-h-[60vh] items-center justify-center">
//         <div className="flex items-center gap-3 text-muted-foreground">
//           <Loader className="h-5 w-5 animate-spin" />
//           <span className="text-sm font-medium">Loading role...</span>
//         </div>
//       </div>
//     );
//   }


//   // Role not found
//   if (!roleView) {
//     return (
//       <div className="p-6 text-center text-red-500">
//         Role not found or data is missing.
//       </div>
//     );
//   }


//   return (
//     <div className=" p-6 space-y-6">
//       <Card>
//         <CardHeader className="flex flex-row items-center justify-between gap-4 border-b pb-4">
//           {/* Title */}
//           <div className="flex flex-col">
//             <CardTitle className="text-lg font-semibold">
//               Edit Role & Permissions
//             </CardTitle>
//             <p className="text-sm text-muted-foreground">
//               Update role details and manage permissions
//             </p>
//           </div>

//           {/* Back Button */}
//           <Button asChild variant="outline" size="sm" className="gap-2">
//             <Link to="/dashboard/roles">
//               <ArrowLeft className="h-4 w-4" />
//               Back to Roles
//             </Link>
//           </Button>
//         </CardHeader>

//         <CardContent>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

//               {/* Role Info */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="role"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Role Code</FormLabel>
//                       <FormControl>
//                         <Input placeholder="ADMIN" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="display_name"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Display Name</FormLabel>
//                       <FormControl>
//                         <Input placeholder="System Administrator" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Description</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Short description" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="status"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="block w-full">Status</FormLabel>
//                       <Select key={field.value} onValueChange={field.onChange} value={field.value}>
//                         <FormControl>
//                           <SelectTrigger className="w-full">
//                             <SelectValue placeholder="Select status" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent className="w-full">
//                           <SelectItem value="active">Active</SelectItem>
//                           <SelectItem value="inactive">Inactive</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               {/* Permissions */}
//               <FormField
//                 control={form.control}
//                 name="permissions"
//                 render={() => (
//                   <FormItem>
//                     <FormLabel className="text-lg font-semibold">
//                       Permissions
//                     </FormLabel>

//                     <div className="space-y-4">
//                       {Object.entries(PERMISSION_GROUPS).map(
//                         ([groupName, perms]) => {
//                           const values = Object.values(perms);
//                           const allChecked = values.every(p =>
//                             permissions.includes(p)
//                           );

//                           return (
//                             <Card key={groupName}>
//                               <CardHeader className="flex flex-row items-center justify-between py-3">
//                                 <CardTitle className="text-sm">
//                                   {groupName}
//                                 </CardTitle>
//                                 <Button
//                                   type="button"
//                                   size="sm"
//                                   variant="outline"
//                                   onClick={() => toggleGroup(values)}
//                                 >
//                                   {allChecked ? "Unselect All" : "Select All"}
//                                 </Button>
//                               </CardHeader>

//                               <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                                 {values.map(permission => (
//                                   <label
//                                     key={permission}
//                                     className="flex items-center gap-2 text-sm"
//                                   >
//                                     <Checkbox
//                                       checked={permissions.includes(permission)}
//                                       onCheckedChange={() =>
//                                         togglePermission(permission)
//                                       }
//                                     />
//                                     {permission}
//                                   </label>
//                                 ))}
//                               </CardContent>
//                             </Card>
//                           );
//                         }
//                       )}
//                     </div>

//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="flex justify-end">
//                 <Button type="submit" disabled={updateRoleIsLoading}>
//                   {updateRoleIsLoading ? "Saving..." : "Save Role"}
//                 </Button>
//               </div>
//             </form>
//           </Form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
