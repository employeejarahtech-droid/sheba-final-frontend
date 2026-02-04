import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { format } from "date-fns";
// import { Calendar } from "@/components/ui/calendar";
import { Controller, useForm } from "react-hook-form";
//import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Check, ChevronDown, Trash2Icon, CircleCheck, PenLine, User, Activity, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

type TestItem = {
  id: number
  name: string
  price: string     // since API sends "1000.00"
  category_id: number
  created_at: string
}

type TestsResponse = {
  data: {
    items: TestItem[]
    meta: {
      page: number
      total: number
      limit: number
    }
  }
}

type CategoryItem = {
  id: number
  name: string
  department_id: number
  department_name: string
}

type CategoryResponse = {
  data: {
    items: CategoryItem[]
  }
}

type DoctorItem = {
  id: number
  doctor_name: string
  title: string
  speciality: string
  email: string
}

type DoctorResponse = {
  data: {
    items: DoctorItem[]
    meta: {
      total: number
      page: number
      limit: number
    }
  }
}


import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  sex: z.string().min(1, "Sex is required"),
  ageValue: z.string().min(1, "Age is required"),
  ageUnit: z.string().default("Y"),
  phone: z.string().min(1, "Phone is required"),
  date: z.string().min(1, "Date is required"),
  ref_doctor: z.string().min(1, "Reference doctor is required"),
  test_name: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryTime: z.string().optional(),
  discount: z.any().optional(),
  totalCharge: z.any().optional(),
  paidAmount: z.any().optional(),
  discountedAmount: z.any().optional(),
  dueAmount: z.any().optional(),
  tests: z.array(z.any()).optional(),
});

export default function HospitalInvoiceForm() {
  //const [deliveryDate, setDeliveryDate] = useState(new Date());
  // const [open, setOpen] = useState(false)
  // const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedTests, setSelectedTests] = useState<TestItem[]>([]);
  const [deptDiscounts, setDeptDiscounts] = useState<Record<string, number>>({});
  const [deptPayments, setDeptPayments] = useState<Record<string, number>>({});
  const [useDeptDiscount, setUseDeptDiscount] = useState(true);
  const [doctorOpen, setDoctorOpen] = useState(false);
  const navigate = useNavigate();

  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const token = getCookie('accessToken');

  const debouncedSearch = useDebounce(search, 400);

  const { data } = useQuery<TestsResponse>({
    queryKey: ["tests", page, debouncedSearch],

    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tests?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch tests");
      return res.json();
    },

    enabled: !!token,

    // ⭐ Perfect smooth pagination
    placeholderData: (prev) =>
      prev ?? {
        data: {
          items: [],
          meta: {
            page,
            total: 0,
            limit,
          },
        },
      },
  });

  const { data: categoriesData } = useQuery<CategoryResponse>({
    queryKey: ["test-categories"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/test-category?limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: doctorsData } = useQuery<DoctorResponse>({
    queryKey: ["doctors"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor?limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch doctors");
      return res.json();
    },
    enabled: !!token,
  });

  const departmentWiseTests = useMemo(() => {
    const groups: Record<string, { total: number; tests: TestItem[] }> = {};
    const categories = categoriesData?.data?.items || [];

    selectedTests.forEach((test) => {
      const category = categories.find((c) => c.id === test.category_id);
      const deptName = category?.department_name || "Unknown";

      if (!groups[deptName]) {
        groups[deptName] = { total: 0, tests: [] };
      }
      groups[deptName].total += Number(test.price);
      groups[deptName].tests.push(test);
    });

    return groups;
  }, [selectedTests, categoriesData]);

  const totalDeptDiscount = useMemo(() => {
    if (!useDeptDiscount) return 0;
    return Object.values(deptDiscounts).reduce((sum, d) => sum + d, 0);
  }, [deptDiscounts, useDeptDiscount]);

  const totalDeptPaid = useMemo(() => {
    return Object.values(deptPayments).reduce((sum, p) => sum + p, 0);
  }, [deptPayments]);

  // Re-validate department payments when discounts or totals change
  useEffect(() => {
    setDeptPayments(prevPayments => {
      const newPayments = { ...prevPayments };
      let hasChanges = false;

      Object.entries(departmentWiseTests).forEach(([deptName, group]) => {
        const discount = deptDiscounts[deptName] || 0;
        const discountedTotal = Math.max(0, group.total - discount);
        const currentPayment = newPayments[deptName] || 0;

        if (currentPayment > discountedTotal) {
          newPayments[deptName] = discountedTotal;
          hasChanges = true;
        }
      });

      return hasChanges ? newPayments : prevPayments;
    });
  }, [departmentWiseTests, deptDiscounts]);

  console.log(data);


  const toggleTest = (test: TestItem) => {
    setSelectedTests((prev) => {
      const exists = prev.some((t) => t.id === test.id);
      return exists
        ? prev.filter((t) => t.id !== test.id)
        : [...prev, test];
    });
  };



  console.log('selectedTests', selectedTests);

  const totalCharge = selectedTests.reduce(
    (sum, test) => sum + Number(test?.price ?? 0),
    0
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      sex: "",
      ageValue: "",
      ageUnit: "Y",
      phone: "",
      date: "",
      ref_doctor: "",
      test_name: "",
      deliveryDate: "",
      deliveryTime: "",
      discount: 0,
      totalCharge: 0,
      paidAmount: 0,
      discountedAmount: 0,
      dueAmount: 0,
      tests: [],
    },
  });

  const { control, watch, setValue, setError, clearErrors, formState: { errors } } = form;

  // compute derived values
  const discount = watch("discount");
  const paidAmount = watch("paidAmount");

  const rawDiscounted = totalCharge - (Number(discount) || 0);
  const clampedDiscounted = rawDiscounted < 0 ? 0 : rawDiscounted;

  // Make sure you have totalCharge from your selected tests logic
  // (compute `totalCharge` as you already did)
  // const totalCharge = /* your computed total charge */ 0;

  // Compute derived amounts
  const discountedAmount = totalCharge - (Number(discount) || 0);
  const dueAmount = discountedAmount - (Number(paidAmount) || 0);

  const clampedDueAmount = dueAmount < 0 ? 0 : dueAmount;

  // Whenever discount or paidAmount (or totalCharge) changes, update the form values
  useEffect(() => {
    if (useDeptDiscount) {
      setValue("discount", totalDeptDiscount, { shouldValidate: true });
    }
    // Sync paidAmount with totalDeptPaid
    setValue("paidAmount", totalDeptPaid, { shouldValidate: true });

    setValue("discountedAmount", clampedDiscounted, { shouldValidate: true });
    setValue("dueAmount", dueAmount, { shouldValidate: true });
  }, [discount, paidAmount, totalCharge, setValue, discountedAmount, dueAmount, useDeptDiscount, totalDeptDiscount, totalDeptPaid]);

  const useCreateOutdoorInvoice = () => {
    return useMutation({
      mutationFn: async (payload: any) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to create invoice");
        }

        return response.json();
      },
    });
  };

  const { mutate: createInvoice } = useCreateOutdoorInvoice();

  const onSubmit = (data: any) => {
    console.log(data);

    const {
      patientName,
      sex,
      phone,
      date,
      ref_doctor,
      totalCharge,
    } = data;

    const payload = {
      patient_name: patientName,
      sex,
      //age: `${ageValue} ${ageUnit}`,
      phone,
      invoice_date: date,
      doctor_id: Number(ref_doctor),
      //delivery_date: deliveryDate,
      //discounts: discount,
      total_amount: totalCharge,
      selected_tests: selectedTests.map((test) => ({
        id: test.id,
        category_id: test.category_id,
        price: Number(test.price),
      })),

      // ✅ Add Department Wise Payments
      department_payments: Object.entries(deptPayments).map(([deptName, amount]) => {
        // Find department ID from categories or map 
        // (We need logic to get ID from Name, as state uses Name as key. 
        // Ideally state should use ID. But let's look up ID from categoriesData)
        const deptId = categoriesData?.data?.items?.find(c => c.department_name === deptName)?.department_id;
        return {
          department_id: deptId,
          amount: Number(amount),
          method: 'Cash' // Defaulting to Cash for now
        };
      }).filter(p => p.amount > 0),

      // ✅ Add Department Wise Discounts
      department_discounts: Object.entries(deptDiscounts).map(([deptName, discount]) => {
        const deptId = categoriesData?.data?.items?.find(c => c.department_name === deptName)?.department_id;
        return {
          department_id: deptId,
          discount: Number(discount)
        };
      }).filter(d => d.discount > 0),

      // ✅ Add Global Payment (Sum)
      payments: {
        amount: Number(paidAmount),
        method: 'Cash',
        payment_date: date
      },

      // ✅ Add Global Discount (Sum)
      discounts: {
        amount: Number(discount),
        reason: 'Department wise discount'
      },

      net_amount: discountedAmount
    }

    console.log('payload to be sent', payload);

    // Send the payload to the backend
    createInvoice(payload, {
      onSuccess: (res) => {
        console.log("Invoice created successfully:", res);
        // Optional: toast, redirect, reset form
        toast.success(res.message || "Invoice created successfully");
        form.reset();
        setSelectedTests([]);
        setDeptDiscounts({});
        setUseDeptDiscount(false);
        navigate({ to: "/outdoor/reception/invoices/list" });
      },
      onError: (error) => {
        console.error("Error creating invoice:", error);
        toast.error(error.message || "Failed to create invoice");
      },
    });

  }
  return (
    <div className="w-full">
      <Form {...form}>
        <form id="hospital-invoice-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient Info Card */}
          <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl shadow-sm overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
            <CardHeader className="p-0 border-b border-blue-100 dark:border-blue-900">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 px-6 py-4 flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Patient Information
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Basic details and registration information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {/* Patient Name */}
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Patient Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter full name"
                          className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sex */}
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Sex
                      </FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all shadow-sm">
                            <SelectValue placeholder="Select sex..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Age */}
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Age
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="ageValue"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Value"
                              className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all shadow-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ageUnit"
                      render={({ field }) => (
                        <FormItem className="w-28">
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all shadow-sm">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Y">Years</SelectItem>
                                <SelectItem value="M">Months</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormItem>

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="01xxxxxxxxx"
                          className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ref. Doctor */}
                <FormField
                  control={form.control}
                  name="ref_doctor"
                  render={({ field }) => {
                    const selectedDoctor = doctorsData?.data?.items?.find(
                      (doc) => String(doc.id) === String(field.value)
                    );

                    return (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Ref. Doctor
                        </FormLabel>
                        <Popover open={doctorOpen} onOpenChange={setDoctorOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <button
                                type="button"
                                className={cn(
                                  "w-full flex justify-between items-center px-3 py-1 border border-gray-200 dark:border-gray-800 rounded-md h-10 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all shadow-sm text-sm",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <span>{selectedDoctor?.doctor_name || "Select doctor..."}</span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command className="border border-gray-100 dark:border-gray-800">
                              <CommandInput placeholder="Search doctor..." className="h-10" />
                              <CommandList className="max-h-[300px]">
                                <CommandEmpty>No doctor found.</CommandEmpty>
                                <CommandGroup>
                                  {doctorsData?.data?.items?.map((doctor) => (
                                    <CommandItem
                                      key={doctor.id}
                                      className="py-2.5 px-4"
                                      onSelect={() => {
                                        field.onChange(String(doctor.id));
                                        setDoctorOpen(false);
                                      }}
                                    >
                                      {doctor.doctor_name}
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          String(doctor.id) === String(field.value)
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

                {/* Invoice Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Invoice Date
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                          <Input
                            type="date"
                            className="h-10 pl-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all shadow-sm block w-full"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Info Card */}
          <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl shadow-sm overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
            <CardHeader className="p-0 border-b border-blue-100 dark:border-blue-900">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 px-6 py-4 flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Test Selection
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Select diagnostic tests and view summary
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Select Tests
                </FormLabel>

                {/* SEARCHABLE MULTI SELECT */}
                <Select>
                  <SelectTrigger className="w-full h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                    <SelectValue
                      placeholder="Search and select tests..."
                      children={
                        selectedTests.length
                          ? `${selectedTests.length} tests selected`
                          : "Search and select tests..."
                      }
                    />
                  </SelectTrigger>

                  <SelectContent className="max-h-[400px]">
                    {/* Search bar */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-popover z-10">
                      <div className="relative">
                        <Input
                          placeholder="Search tests..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="h-9 pl-8 border-gray-200"
                        />
                        <Activity className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Test list */}
                    <div className="py-2">
                      {data?.data?.items?.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                          No tests found matching your search.
                        </div>
                      ) : (
                        data?.data?.items?.map((test) => (
                          <div
                            key={test.id}
                            className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                            onClick={() => toggleTest(test)}
                          >
                            <Checkbox
                              checked={selectedTests.some((t) => t.id === test.id)}
                              className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{test.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">{test.price}</span>
                            </div>
                            {selectedTests.some((t) => t.id === test.id) && (
                              <Check className="ml-auto h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {/* TABLE */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 w-16">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Test Name</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 w-32">Price</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {selectedTests.map((test, index) => (
                      <tr key={test.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="px-4 py-3 text-gray-500 font-mono">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{test.name}</td>
                        <td className="px-4 py-3 text-right font-mono text-blue-600 dark:text-blue-400 font-semibold">
                          {Number(test.price).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => toggleTest(test)}
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {selectedTests.length === 0 && (
                      <tr>
                        <td
                          className="px-4 py-12 text-center text-muted-foreground italic bg-gray-50/30 dark:bg-transparent"
                          colSpan={4}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Activity className="h-8 w-8 opacity-20" />
                            <span>No tests selected. Use the search above to add tests.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {selectedTests.length > 0 && (
                    <tfoot>
                      <tr className="bg-blue-50/30 dark:bg-blue-950/20 border-t border-blue-100 dark:border-blue-900">
                        <td colSpan={2} className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200 text-right">
                          Subtotal:
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-blue-700 dark:text-blue-300 text-lg">
                          {totalCharge.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Department Discount Card */}
          <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl shadow-sm overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
            <CardHeader className="p-0 border-b border-blue-100 dark:border-blue-900">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 px-6 py-4 flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                  <PenLine className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Dept. Discounts & Payments
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Breakdown of charges and payments per department
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-blue-100/50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-200/50">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Dept. Discount:</span>
                  <span className="text-sm font-bold text-blue-800 dark:text-blue-100 font-mono">{totalDeptDiscount.toLocaleString()}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Department</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Gross</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 w-32">Discount</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Net</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 w-32">Paid</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {Object.keys(departmentWiseTests).length > 0 ? (
                      Object.entries(departmentWiseTests).map(([deptName, group]) => {
                        const discount = deptDiscounts[deptName] || 0;
                        const netAmount = group.total - discount;
                        const paid = deptPayments[deptName] || 0;
                        const due = netAmount - paid;

                        return (
                          <tr key={deptName} className="hover:bg-gray-50/20 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{deptName}</td>
                            <td className="px-4 py-3 text-right font-mono text-gray-500">{group.total.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                className="h-8 text-right font-mono bg-white dark:bg-gray-950 border-gray-200"
                                value={discount}
                                onChange={(e) => {
                                  let val = Number(e.target.value);
                                  if (val < 0) val = 0;
                                  if (val > group.total) val = group.total;
                                  setDeptDiscounts((prev) => ({ ...prev, [deptName]: val }));
                                }}
                                min="0"
                                max={group.total}
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                              {netAmount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                className="h-8 text-right font-mono bg-white dark:bg-gray-950 border-gray-200"
                                value={paid}
                                onChange={(e) => {
                                  let val = Number(e.target.value);
                                  if (val < 0) val = 0;
                                  if (val > netAmount) val = netAmount;
                                  setDeptPayments((prev) => ({ ...prev, [deptName]: val }));
                                }}
                                min="0"
                                max={netAmount}
                              />
                            </td>
                            <td className={`px-4 py-3 text-right font-mono font-bold ${due > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {due.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                          No department breakdown available. Please select tests first.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Billing Summary Card */}
          <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl shadow-sm overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
            <CardHeader className="p-0 border-b border-blue-100 dark:border-blue-900">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 px-6 py-4 flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Billing & Delivery
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Final summary, delivery schedule and payment
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Delivery details */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Expected Delivery Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "h-10 justify-start text-left font-normal border-gray-200 bg-transparent shadow-sm",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                                  {field.value
                                    ? new Date(field.value).toLocaleDateString()
                                    : <span>Pick a date</span>}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? date.toISOString() : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryTime"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Expected Delivery Time
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                              <Input
                                type="time"
                                className="h-10 pl-10 border-gray-200 bg-transparent shadow-sm"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50">
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Invoice Status Summary
                    </h4>
                    <p className="text-xs text-blue-800/70 dark:text-blue-400/70 leading-relaxed">
                      This invoice will be registered as {dueAmount > 0 ? <span className="text-red-600 font-bold uppercase">Partial / Due</span> : <span className="text-green-600 font-bold uppercase">Fully Paid</span>}.
                      The department-wise payment breakdown ensures accurate revenue tracking across clinical units.
                    </p>
                  </div>
                </div>

                {/* Billing details */}
                <div className="space-y-4 bg-gray-50/50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Gross Total</span>
                    <span className="text-lg font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {totalCharge.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-t border-dashed border-gray-200">
                    <div className="flex flex-col">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Total Discount</span>
                      <span className="text-[10px] text-muted-foreground">(Department-wise)</span>
                    </div>
                    <span className="text-lg font-mono font-semibold text-green-600">
                      - {totalDeptDiscount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-gray-100 font-bold">Net Payable</span>
                    <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                      {discountedAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-t border-dashed border-gray-200">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Paid Amount</span>
                    <span className="text-lg font-mono font-semibold text-indigo-600">
                      {totalDeptPaid.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-4 border-t-2 border-gray-300 dark:border-gray-600 mt-2 bg-blue-600/5 -mx-6 px-6">
                    <span className="text-gray-900 dark:text-gray-100 font-black text-lg">BALANCE DUE</span>
                    <span className={`text-3xl font-mono font-black ${dueAmount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {dueAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-6 mt-10 pt-10 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="outline"
                  type="button"
                  className="px-10 h-14 text-lg rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all font-semibold"
                  onClick={() => {
                    form.reset();
                    setSelectedTests([]);
                    setDeptDiscounts({});
                    setDeptPayments({});
                  }}
                >
                  Clear Form
                </Button>
                <Button
                  type="submit"
                  disabled={totalCharge === 0}
                  className="px-12 h-14 text-lg rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 font-bold text-white shadow-xl shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/40 active:translate-y-0 disabled:opacity-50 disabled:grayscale"
                >
                  <CircleCheck className="mr-2 h-6 w-6" />
                  Generate Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
