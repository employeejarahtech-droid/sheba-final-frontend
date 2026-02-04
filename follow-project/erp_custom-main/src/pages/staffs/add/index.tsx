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
// import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { CalendarIcon, ChevronDown, Check, UserPlus, Info, CheckCircle2, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
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
//import { ImageUploader } from "@/components/form/ImageUploader";
import { useNavigate } from "react-router";
import { useAddStaffMutation } from "@/store/features/staffs/staffApiService";
import { toast } from "sonner";
import ImageUploaderPro from "@/components/form/ImageUploaderPro";
import { useState } from "react";
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
//  FORM SCHEMA (PAYLOAD READY)
// =====================================================
const StaffSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  email: z.string().min(1, "Required").email("Invalid email"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  phone: z.string().optional(),
  department: z.number().min(1, "Required"),
  position: z.string().optional(),
  // hire_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
  //   message: "Invalid date",
  // }),
  hire_date: z.string().optional(),
  salary: z.number().optional(),
  // address: z.string().optional(),
  status: z.enum(["active", "terminated", "on_leave"]),
  image: z.string().optional(),
  gallery_items: z.array(z.string()).optional().nullable(),
  role_id: z.number().optional(),
});

type StaffFormValues = z.infer<typeof StaffSchema>;

// =====================================================
//  PAGE COMPONENT
// =====================================================
export default function AddStaffPage() {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [addStaff, { isLoading }] = useAddStaffMutation();
  const [page] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const limit = 10;
  const [rolePage] = useState(1);
  const [roleSearch] = useState("");
  const roleLimit = 10;

  const navigate = useNavigate();

  const { data: fetchedDepartments } = useGetAllDepartmentsQuery({
    page,
    limit,
    search,
  });


  const { data: rolesData } = useGetAllRolesQuery({
    page: rolePage,
    limit: roleLimit,
    search: roleSearch,
  });

  const currency = useAppSelector((state) => state.currency.value);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(StaffSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone: "",
      department: 0,
      position: "",
      hire_date: "",
      salary: 0,
      status: "active",
      role_id: undefined,
      image: "",
      gallery_items: [],
    },
  });

  // =====================================================
  // API PAYLOAD + SUBMIT HANDLER
  // =====================================================
  const onSubmit = async (values: StaffFormValues) => {
    console.log("API Payload:", values);
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      password: values.password,
      phone: values.phone,
      department_id: values.department,
      position: values.position,
      hire_date: values.hire_date,
      salary: values.salary,
      status: values.status,
      role_id: values.role_id,
      thumb_url: values.image,
      gallery_items: values.gallery_items || [],
    };

    try {
      // const fd = new FormData();

      // fd.append("first_name", values.first_name);
      // fd.append("last_name", values.last_name);
      // fd.append("email", values.email);
      // fd.append("phone", values.phone ?? "");
      // fd.append("department", values.department ?? "");
      // fd.append("position", values.position);
      // fd.append("hire_date", values.hire_date);
      // fd.append("salary", values.salary ?? "");
      // fd.append("status", values.status);

      // if (values.image) {
      //   fd.append("image", values.image);
      // }

      // const res = await addStaff(fd).unwrap();
      const res = await addStaff(payload).unwrap();

      if (res.status) {
        navigate("/dashboard/staffs");
        toast.success("Staff member added successfully!");
      }
      console.log("API Response:", res);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.log("API Error:", err);
      toast.error(
        err?.data?.message || "Failed to add staff member. Please try again."
      );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* PAGE TITLE */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Add New Staff Member
          </h1>
          <p className="text-muted-foreground mt-2">Create a new staff profile with complete information</p>
        </div>
        <BackButton />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMN 1: STAFF INFO + GALLERY */}
            <div className="space-y-6 lg:col-span-2">
              {/* STAFF INFORMATION */}
              <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Staff Information</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Personal and employment details</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-6">
                  <div className="space-y-6">
                    {/* ROW 1 — FIRST + LAST NAME (Col 1) + PROFILE IMAGE (Col 2) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Column 1: First Name and Last Name Stacked (2/3 width) */}
                      <div className="md:col-span-2 space-y-4">
                        <FormField
                          control={form.control}
                          name="first_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                First Name <span className="text-red-600">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter first name" {...field} />
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
                              <FormLabel>
                                Last Name <span className="text-red-600">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Column 2: Profile Image (1/3 width) */}
                      <div className="md:col-span-1">
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

                    {/* ROW 2 — EMAIL + PASSWORD */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Email <span className="text-red-600">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="example@email.com" {...field} />
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
                            <FormLabel>
                              Password <span className="text-red-600">*</span>
                            </FormLabel>
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

                    {/* ROW 3 — PHONE + DEPARTMENT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+60123456789" {...field} />
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
                                    aria-expanded={open}
                                    className="w-full justify-between"
                                  >
                                    {selected
                                      ? selected.name
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

                    {/* ROW 4 — POSITION + HIRE DATE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Position <span className="text-red-600">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="position" {...field} />
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
                                  initialFocus
                                  required={false}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* ROW 5 — SALARY + STATUS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                                placeholder="salary i.e. 1000"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.valueAsNumber)
                                }
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
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* ROW 6 — ROLE (Full Width) */}
                    <FormField
                      control={form.control}
                      name="role_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>

                          <Select
                            value={field.value ? String(field.value) : ""}
                            onValueChange={(val) => field.onChange(Number(val))}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Role" />
                            </SelectTrigger>

                            <SelectContent>
                              {Array.isArray(rolesData?.data) &&
                                rolesData.data.map((role) => (
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
                        <FormLabel>Profile Gallery (max 10)</FormLabel>
                        <ImageUploaderPro
                          value={field.value || []}
                          onChange={(file) => field.onChange(file)}
                          multiple
                        />
                        <p className="text-sm text-muted-foreground">
                          Optional. Upload up to 10 additional images for the staff member.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </CardContent>
              </Card>
            </div>

            {/* COLUMN 2: INFORMATION */}
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
                    <p className="text-sm text-gray-700 dark:text-gray-300">Employee ID will be generated automatically.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Fields marked with <span className="text-red-600 font-semibold">*</span> are required.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Email addresses must be unique.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* BUTTONS */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/50 active:translate-y-0 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Save Staff Member</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
