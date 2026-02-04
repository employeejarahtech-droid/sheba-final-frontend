import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAddRoleMutation } from "@/store/features/role/roleApiService";
import { toast } from "sonner";
import { useAppSelector } from "@/store/store";
import { RolePermission, SuperAdminPermission } from "@/config/permissions";
import { ShieldAlert, PlusCircle } from "lucide-react";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const roleSchema = z.object({
  role: z.string().min(1, "Required"),
  display_name: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  status: z.string().min(1, "Required"),
  permissions: z.array(z.string())

});
export default function AddNewRoleForm({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {


  const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);
  const canCreateRole = userPermissions.includes(RolePermission.CREATE_ROLES) || userPermissions.includes(SuperAdminPermission.ACCESS_ALL);







  const [createRole] = useAddRoleMutation()


  const form = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: "",
      display_name: "",
      description: "",
      status: "active",
      permissions: []
    },
  });

  const handleAddRole = async (values: z.infer<typeof roleSchema>) => {
    console.log(values);

    try {
      const res = await createRole(values).unwrap();

      if (res.status) {
        toast.success(res.message || "Role create successfully.")
        setOpen(false)

      }
    } catch (error) {
      console.log('Error: ==>', error)
      toast.error("somthing went wrong!")
    }

  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
          <PlusCircle size={18} />
          Add Role
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="max-w-[400px] w-full">
        <SheetHeader>
          <SheetTitle>Add Role</SheetTitle>
        </SheetHeader>
        <div className="px-4">
          {!canCreateRole ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
                <ShieldAlert className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Access Denied
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You do not have permission to add a new Role. <br />
                Please contact your administrator if you believe this is an error.
              </p>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="mt-4"
              >
                Close
              </Button>
            </div>
          ) : (<Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddRole)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name (Code)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ADMIN, SALES, STORE etc."
                        {...field}
                      />
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
                      <Input
                        placeholder="e.g. System Administrator"
                        {...field}
                      />
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
                      <Input
                        placeholder="short description"
                        {...field}
                      />
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
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Add Role</Button>
            </form>
          </Form>)}
        </div>
      </SheetContent>
    </Sheet>
  );
}
