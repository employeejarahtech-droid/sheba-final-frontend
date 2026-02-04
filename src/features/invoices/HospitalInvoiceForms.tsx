import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { format } from "date-fns";
// import { Calendar } from "@/components/ui/calendar";
import { Controller, useForm } from "react-hook-form";
//import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Trash2Icon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Link } from "@tanstack/react-router";

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


interface InvoiceFormValues {
  patientName: string;
  sex: string;
  ageValue: string;
  ageUnit: string;
  phone: string;
  date: string;
  ref_doctor: string;
  test_name: string;
  deliveryDate: string;
  deliveryTime: string;
  discount: number;
  totalCharge: number;
  paidAmount: number;
  discountedAmount: number;
  dueAmount: number;
  tests: number[];
}

export default function HospitalInvoiceForm() {
  //const [deliveryDate, setDeliveryDate] = useState(new Date());
  // const [open, setOpen] = useState(false)
  // const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedTests, setSelectedTests] = useState<number[]>([]);

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

  console.log(data);


  const toggleTest = (id: number) => {
    setSelectedTests((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };


  console.log('selectedTests', selectedTests);

  const totalCharge = selectedTests.reduce((sum, id) => {
    const test = data?.data?.items?.find((t: TestItem) => t.id === id);
    return sum + (test ? Number(test.price) : 0);
  }, 0);

  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      patientName: "",
      sex: "",
      ageValue: "",
      ageUnit: "years",
      phone: "",
      date: "",
      ref_doctor: "",
      test_name: "",
      deliveryDate: "",
      deliveryTime: "",
      discount: 0,
      totalCharge: 0,
      paidAmount: 0,
      discountedAmount: 0, // register this too
      dueAmount: 0,
      tests: [], // if you want to send test IDs
    },
  });

  const { control, watch, setValue, setError, clearErrors, formState: { errors } } = form;

  // compute derived values
  const discount = watch("discount");
  const paidAmount = watch("paidAmount");

  // Compute derived amounts
  const discountedAmount = Math.max(0, totalCharge - (Number(discount) || 0));
  const dueAmount = Math.max(0, discountedAmount - (Number(paidAmount) || 0));

  // Whenever discount or paidAmount (or totalCharge) changes, update the form values
  useEffect(() => {
    setValue("discountedAmount", discountedAmount, { shouldValidate: true });
    setValue("dueAmount", dueAmount, { shouldValidate: true });
  }, [discount, paidAmount, totalCharge, setValue, discountedAmount, dueAmount]);

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

  const onSubmit = (formData: InvoiceFormValues) => {
    console.log(formData);

    const {
      patientName,
      sex,
      phone,
      date,
      ref_doctor,
      totalCharge,
    } = formData;

    const transformedTests = selectedTests.map(id => {
      const test = data?.data?.items?.find((t: TestItem) => t.id === id);
      return {
        id: test?.id,
        category_id: test?.category_id,
        price: test ? Number(test.price) : 0
      };
    }).filter(t => t.id !== undefined);

    const payload = {
      patient_name: patientName,
      sex,
      //age: `${ageValue} ${ageUnit}`,
      phone,
      invoice_date: date,
      reference_doctor: ref_doctor,
      //delivery_date: deliveryDate,
      //discounts: discount,
      total_amount: totalCharge,
      selected_tests: transformedTests,
      //payments: paidAmount,
      net_amount: discountedAmount
    }

    console.log('payload to be sent', payload);

    // Send the payload to the backend
    createInvoice(payload, {
      onSuccess: (res) => {
        console.log("Invoice created successfully:", res);
        // Optional: toast, redirect, reset form
      },
      onError: (error) => {
        console.error("Error creating invoice:", error);
      },
    });

  }
  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="w-full max-w-6xl shadow-xl p-6 rounded-2xl bg-white">
            <h2 className="text-2xl font-bold text-center mb-2">Outdoor: New Invoice</h2>
            {/* Patient Info */}
            <Card className="mb-4">
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* <div>
                  <Label>Patient ID</Label>
                  <Input value="14086" readOnly className="bg-gray-100" />
                </div> */}
                <div>
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Patient Name</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Patient name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Sex</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select sex..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormItem>
                  <FormLabel>Age</FormLabel>

                  <div className="flex gap-2">

                    {/* Age value */}
                    <FormField
                      control={form.control}
                      name="ageValue"
                      render={({ field }: { field: any }) => (
                        <FormControl>
                          <Input type="number" placeholder="Age" {...field} />
                        </FormControl>
                      )}
                    />

                    {/* Age unit (Y/M) */}
                    <FormField
                      control={form.control}
                      name="ageUnit"
                      render={({ field }: { field: any }) => (
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Y">Years</SelectItem>
                              <SelectItem value="M">Months</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      )}
                    />

                  </div>

                </FormItem>


                <div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="phone" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="ref_doctor"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Ref. Doctor</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select doctor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dr1">Dr. A</SelectItem>
                              <SelectItem value="dr2">Dr. B</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Invoice Date</FormLabel>
                        {/* <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild className="w-full">
                            <Button
                              variant="outline"
                              id="date"
                              className="w-48 justify-between font-normal"
                            >
                              {date ? date.toLocaleDateString() : "Select date"}
                              <ChevronDownIcon />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={date || field.value}
                              captionLayout="dropdown"
                              onSelect={(date) => {
                                setDate(date)
                                setOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover> */}
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Test Info */}
            <Card className="mb-4">
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2">
                  <div className="space-y-2">
                    <FormLabel>Test Name</FormLabel>

                    {/* SEARCHABLE MULTI SELECT */}
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select test...">
                          {selectedTests.length
                            ? selectedTests
                              .map((id) => data?.data?.items?.find((t: TestItem) => t.id === id)?.name)
                              .filter(Boolean)
                              .join(", ")
                            : "Select test..."}
                        </SelectValue>
                      </SelectTrigger>

                      <SelectContent>
                        {/* Search bar */}
                        <div className="px-2 py-2 border-b">
                          <Input
                            placeholder="Search test..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8"
                          />
                        </div>

                        {/* Test list */}
                        {data?.data?.items?.length === 0 ? (
                          <div className="px-2 py-2 text-sm text-muted-foreground">
                            No tests found.
                          </div>
                        ) : (
                          data?.data?.items?.map((test: TestItem) => (
                            <div
                              key={test.id}
                              className="flex items-center gap-2 px-2 py-1 cursor-pointer"
                              onClick={() => toggleTest(test.id)}
                            >
                              <Checkbox checked={selectedTests.includes(test.id)} />
                              <span>{test.name}</span>
                              <span>({test.price})</span>
                            </div>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                  </div>

                  {/* TABLE */}
                  <div className="min-h-[140px]">
                    <table className="w-full mt-4 border border-gray-300 rounded-md">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 border">ID</th>
                          <th className="p-2 border">Test Name</th>
                          <th className="p-2 border">Price (BDT)</th>
                          <th className="p-2 border"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTests.map((id, index) => {
                          const test = data?.data?.items?.find((t: TestItem) => t.id === id);
                          return (
                            <tr key={id} className="text-center">
                              <td className="p-2 border w-12">{index + 1}</td>
                              <td className="p-2 border text-left">{test?.name}</td>
                              <td className="p-2 border w-30">{test?.price}</td>
                              <td className="p-2 border w-10">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  onClick={() => toggleTest(id)}
                                >
                                  <Trash2Icon className="w-4 h-4 text-red-500" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}

                        {selectedTests.length === 0 && (
                          <tr>
                            <td
                              className="p-2 border text-muted-foreground text-sm text-center"
                              colSpan={3}
                            >
                              No tests selected.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="col-span-1">
                  <label htmlFor="" className="flex gap-2 items-center">
                    <input type="checkbox" />
                    <span>Department Wise Discount</span>
                  </label>
                  <table className="w-full mt-4 border border-gray-300 rounded-md">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border">Dept.</th>
                        <th className="p-2 border">Total</th>
                        <th className="p-2 border">Discount</th>
                        <th className="p-2 border">Discounted</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border">Pathology</td>
                        <td className="p-2 border">0</td>
                        <td className="p-2 border">
                          <input className="w-16 border border-gray-300 focus:outline-none focus:ring rounded-sm py-1 px-1 text-right" />
                        </td>
                        <td className="p-2 border">0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Billing Summary */}
            <Card className="mb-6">
              <CardContent className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Charge (BDT)</span>
                    <span className="w-24 flex justify-between">
                      <span>=</span> <span>{totalCharge}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Discount</span>
                    <Controller
                      name="discount"
                      control={control}
                      render={({ field }: { field: any }) => {
                        const value = field.value as number;
                        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                          const num = Number(e.target.value);
                          // Validation logic here:
                          if (num < 0) {
                            setError("discount", { type: "manual", message: "Discount cannot be negative" });
                          } else if (num > totalCharge) {
                            setError("discount", { type: "manual", message: `Discount cannot exceed total charge (${totalCharge})` });
                          } else {
                            clearErrors("discount");
                          }
                          field.onChange(isNaN(num) ? 0 : num);
                        };

                        return (
                          <div className="flex flex-col gap-2 w-24">
                            <div>
                              <Input
                                type="number"
                                min='0'
                                value={value}
                                onChange={handleChange}
                                className="w-24 text-right"
                              />
                            </div>
                          </div>
                        );
                      }}
                    />
                  </div>
                  <div className="text-right">
                    {errors.discount && <span className="inline-block text-xs leading-relaxed text-red-500">{errors.discount.message}</span>}
                  </div>

                  <div className="flex justify-between">
                    <span>Discounted Amount</span>
                    <span className="w-24 flex justify-between">
                      <span>=</span> <span>{discountedAmount}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Paid</span>
                    <Controller
                      name="paidAmount"
                      control={control}
                      render={({ field }: { field: any }) => {
                        const value = field.value as number;
                        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                          const num = Number(e.target.value);
                          // Validation logic here:
                          if (num < 0) {
                            setError("paidAmount", { type: "manual", message: "Paid amount cannot be negative" });
                          } else if (num > totalCharge) {
                            setError("paidAmount", { type: "manual", message: `Paid amount cannot exceed total charge (${discountedAmount})` });
                          } else {
                            clearErrors("paidAmount");
                          }
                          field.onChange(isNaN(num) ? 0 : num);
                        };

                        return (
                          <div className="flex flex-col gap-2 w-24">
                            <div>
                              <Input
                                type="number"
                                min='0'
                                value={value}
                                onChange={handleChange}
                                className="w-24 text-right"
                              />
                            </div>

                          </div>
                        );
                      }}
                    />
                  </div>
                  <div>
                    {errors.paidAmount && <span className="inline-block text-[10px] leading-relaxed text-red-500">{errors.paidAmount.message}</span>}
                  </div>

                  <div className="flex justify-between">
                    <span>Due Amount</span>
                    <span className="w-24 flex justify-between">
                      <span>=</span> <span>{dueAmount}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  <div className="flex gap-5">
                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Delivery Date</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-[280px] justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value
                                    ? new Date(field.value).toLocaleDateString()
                                    : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    field.onChange(date); // Update RHF
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="w-full">
                      <FormField
                        control={form.control}
                        name="deliveryTime"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>Delivery Date</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Link to="/outdoor/reception/invoices/create">
                      <Button variant="default" className="px-10 py-6 text-lg" type="button">New</Button>
                    </Link>
                    <Button variant="default" className="px-10 py-6 text-lg" type="submit" disabled={!!(errors && Object.keys(errors).length > 0) || totalCharge === 0}>Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Card>
        </form>
      </Form>

    </div>
  );
}
