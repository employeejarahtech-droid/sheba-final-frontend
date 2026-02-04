"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CalendarIcon, ChevronDown, Check, UserCog, Info, CheckCircle2, Eye, EyeOff, ImageIcon } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router";
import {
  useGetStaffByIdQuery,
  useUpdateStaffMutation,
} from "@/store/features/staffs/staffApiService";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import ImageUploaderPro from "@/components/form/ImageUploaderPro";
import type { Staff } from "@/types/staff.types";
import { useGetAllDepartmentsQuery } from "@/store/features/admin/departmentApiService";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAppSelector } from "@/store/store";
import { BackButton } from "@/components/BackButton";
import { useGetAllRolesQuery } from "@/store/features/role/roleApiService";

// =====================================================
//  FORM SCHEMA
// =====================================================
const StaffSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  department: z.number().min(1, "Required"),
  position: z.string().optional(),
  hire_date: z.string().optional(),
  salary: z.number().optional(),
  status: z.enum(["active", "terminated", "on_leave"]),
  image: z.string().optional(),
  gallery_items: z.array(z.string()).optional().nullable(),
  password: z.string().min(4, "Password must be at least 4 characters").optional().or(z.literal("")),
  role_id: z.number().optional(),
});

type StaffFormValues = z.infer<typeof StaffSchema>;

// =====================================================
//  EDIT PAGE
// =====================================================
export default function EditStaffPage() {
  const [open, setOpen] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [page] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;
  const { staffId } = useParams<{ staffId: string }>();
  const { data, isLoading: isFetching } = useGetStaffByIdQuery(staffId!);
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();

  const [rolePage] = useState(1);
  const [roleSearch] = useState("");
  const roleLimit = 100;

  const { data: rolesData } = useGetAllRolesQuery({
    page: rolePage,
    limit: roleLimit,
    search: roleSearch,
  });

  const currency = useAppSelector((state) => state.currency.value);

  const navigate = useNavigate();

  const { data: fetchedDepartments } = useGetAllDepartmentsQuery({
    page,
    limit,
    search,
  });

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(StaffSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      department: 0,
      position: "",
      hire_date: "",
      salary: 0,
      status: "active",
      image: "",
      gallery_items: [],
      password: "",
      role_id: undefined,
    },
  });

  const staff: Staff | undefined = Array.isArray(data?.data)
    ? data?.data[0]
    : data?.data;

  // Reset initialization when staffId changes (e.g. navigating to another staff)
  useEffect(() => {
    setIsInitialized(false);
  }, [staffId]);

  useEffect(() => {
    if (staff && !isInitialized) {
      form.reset({
        first_name: staff?.first_name,
        last_name: staff?.last_name,
        email: staff?.email,
        phone: staff?.phone || "",
        department: staff?.department_id,
        position: staff?.position || "",
        hire_date: staff?.hire_date || "",
        salary: staff?.salary || 0,
        status: staff.status === "inactive" ? "terminated" : staff.status,
        image: staff?.thumb_url || "",
        gallery_items: staff?.gallery_items || [],
        password: "", // Usually we don't load the password from backend for security
        role_id: staff?.role_id !== null && staff?.role_id !== undefined
          ? Number(staff.role_id)
          : (staff?.role?.id ? Number(staff.role.id) : undefined),
      });
      setIsInitialized(true);
    }
  }, [staff, form, isInitialized]);

  // =====================================================
  //  SUBMIT HANDLER
  // =====================================================
  const onSubmit = async (values: StaffFormValues) => {
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone || "",
      department_id: values.department || 0,
      position: values.position || "",
      hire_date: values.hire_date || "",
      salary: values.salary || 0,
      status: values.status,
      thumb_url: values.image,
      gallery_items: values.gallery_items || [],
      password: values.password || undefined,
      role_id: values.role_id ?? undefined,
    };
    try {
      // const fd = new FormData();

      // Object.entries(values).forEach(([key, val]) => {
      //   if (val !== null && val !== undefined) {
      //     if (key === "image") {
      //       if (val) fd.append("image", val);
      //     } else fd.append(key, String(val));
      //   }
      // });

      // const res = await updateStaff({ id, data: fd }).unwrap();
      const res = await updateStaff({ id: staffId!, body: payload }).unwrap();

      if (res.status) {
        toast.success("Staff updated successfully!");
        navigate("/dashboard/staffs");
      }
    } catch (err) {
      toast.error("Failed to update staff.");
      console.log(err);
    }
  };

  if (isFetching) return <p>Loading...</p>;

  return (
    <div className="w-full max-w-7xl mx-auto pb-6">
      {/* PAGE TITLE */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Edit Staff Member
          </h1>
          <p className="text-muted-foreground mt-2">Update staff profile and employment details</p>
        </div>
        <BackButton />
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
              e.preventDefault();
            }
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMN 1: STAFF INFO + GALLERY */}
            <div className="space-y-6 lg:col-span-2">
              <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                      <UserCog className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Staff Information</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Personal and employment details</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-6">
                  <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                    {/* Left side: Form fields */}
                    <div className="flex-1">
                      <div className="space-y-4">

                        {/* FIRST + LAST NAME */}
                        <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6">
                          <FormField
                            control={form.control}
                            name="first_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="First name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="last_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Last name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* ROW 2: EMAIL + PASSWORD */}
                        <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="email@example.com" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={showPassword ? "text" : "password"}
                                      placeholder="••••••••"
                                      className="pr-10"
                                      {...field}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                                    >
                                      {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* ROW 3: PHONE + DEPARTMENT */}
                        <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="+60123456789" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => {
                              const selected = fetchedDepartments?.data?.find(
                                (dept) => Number(dept.id) === Number(field.value)
                              );

                              return (
                                <FormItem>
                                  <FormLabel>Department</FormLabel>
                                  <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        type="button"
                                        aria-expanded={open}
                                        className="w-full justify-between font-medium"
                                      >
                                        {selected
                                          ? selected?.name
                                          : "Select department..."}
                                        <ChevronDown className="opacity-50 h-4 w-4" />
                                      </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-full p-0">
                                      <Command>
                                        {/* Search input */}
                                        <CommandInput
                                          placeholder="Search category..."
                                          className="h-9"
                                          value={search}
                                          onValueChange={setSearch}
                                        />

                                        <CommandList>
                                          <CommandEmpty>
                                            No department found.
                                          </CommandEmpty>

                                          <CommandGroup>
                                            {fetchedDepartments?.data?.map((dept) => (
                                              <CommandItem
                                                key={dept?.id}
                                                value={`${dept?.name}-${dept?.id}`} // unique, string
                                                onSelect={() => {
                                                  field.onChange(dept?.id); // convert back to number
                                                  setOpen(false);
                                                }}
                                              >
                                                {dept?.name}
                                                <Check
                                                  className={cn(
                                                    "ml-auto h-4 w-4",
                                                    Number(field.value) ===
                                                      Number(dept?.id)
                                                      ? "opacity-100"
                                                      : "opacity-0"
                                                  )}
                                                />
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                        </div>

                        {/* ROW 4: POSITION + HIRE DATE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6">
                          <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Position" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="hire_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hire Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        type="button"
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value
                                          ? new Date(field.value).toLocaleDateString()
                                          : "Pick date"}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="p-0">
                                    <Calendar
                                      mode="single"
                                      selected={
                                        field.value ? new Date(field.value) : undefined
                                      }
                                      onSelect={(date: Date | undefined) => {
                                        if (date) {
                                          field.onChange(date.toISOString());
                                        }
                                      }}

                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* ROW 5: SALARY + STATUS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6">
                          <FormField
                            control={form.control}
                            name="salary"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Salary {`${currency ? `(${currency})` : ""}`}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(e.target.valueAsNumber)
                                    }
                                    placeholder="1000"
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
                                <FormLabel>
                                  Status <span className="text-red-600">*</span>
                                </FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="terminated">Terminated</SelectItem>
                                    <SelectItem value="on_leave">On Leave</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="role_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>

                              <Select
                                key={rolesData?.data ? `role-loaded-${field.value}` : `role-loading-${field.value}`}
                                value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                                onValueChange={(val) => field.onChange(Number(val))}
                                disabled={isUpdating}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Role" />
                                  </SelectTrigger>
                                </FormControl>

                                <SelectContent>
                                  {/* Always include assigned role_id as an option to prevent it being "missing" */}
                                  {(staff?.role_id || staff?.role?.id) && (
                                    <SelectItem value={String(staff?.role_id || staff?.role?.id)}>
                                      {staff?.role?.display_name || `Role ${staff?.role_id || staff?.role?.id}`}
                                    </SelectItem>
                                  )}
                                  {Array.isArray(rolesData?.data) &&
                                    rolesData.data
                                      .filter((r) => Number(r.id) !== Number(staff?.role_id || staff?.role?.id))
                                      .map((role) => (
                                        <SelectItem key={role.id} value={String(role.id)}>
                                          {role?.display_name}
                                        </SelectItem>
                                      ))}
                                </SelectContent>
                              </Select>

                              <FormMessage />
                            </FormItem>
                          )}
                        />

                      </div>
                    </div>

                    {/* Right side: Profile Image */}
                    <div className="flex md:justify-end">
                      <div>
                        <FormField
                          control={form.control}
                          name="image"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile Image</FormLabel>
                              <ImageUploaderPro
                                value={field.value}
                                onChange={(file) => field.onChange(file)}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* STAFF GALLERY */}
              <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Staff Gallery</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Upload additional staff images</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <FormField
                    control={form.control}
                    name="gallery_items"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Gallery</FormLabel>
                        <ImageUploaderPro
                          value={field.value || []}
                          onChange={(file) => field.onChange(file)}
                          multiple
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* RIGHT INFO BOX */}
            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg h-fit">
              <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-2 border-blue-100 dark:border-blue-900 py-3 gap-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Information</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Important notes</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">You can update any field of this staff member.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Email must remain unique.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Uploading a new image will replace the old one.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/50 active:translate-y-0 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {isUpdating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
