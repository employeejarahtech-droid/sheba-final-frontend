import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Check, ChevronDown, ChevronLeft, ChevronRight, Trash2Icon, CircleCheck, PenLine, User, Activity, Clock, FlaskConical, ChevronsUpDown, ArrowLeft, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useDateFormat } from "@/hooks/use-date-format";
import { useCurrency } from "@/hooks/use-currency";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

type TestItem = {
  id: number
  name: string
  price: string     // since API sends "1000.00"
  category_id: number
  created_at: string
  sample_collection_room_id?: number | null
  delivery_date?: string // Tenant date-format display string (e.g. DD/MM/YYYY) — same as the invoice-level deliveryDate field; converted to ISO at submission
  delivery_time?: string // 24h HH:MM, per-test expected delivery time
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
  invoice_prefix: z.string().optional(),
  patientName: z.string().min(1, "Patient name is required"),
  sex: z.string().min(1, "Sex is required"),
  ageYears: z.string().optional(),
  ageMonths: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  date: z.string().min(1, "Date is required"),
  ref_doctor: z.string().min(1, "Reference doctor is required"),
  test_name: z.string().optional(),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  discount: z.any().optional(),
  totalCharge: z.any().optional(),
  paidAmount: z.any().optional(),
  discountedAmount: z.any().optional(),
  dueAmount: z.any().optional(),
  tests: z.array(z.any()).optional(),
  isIndoorPatient: z.boolean().optional().default(false),
  admissionNumber: z.string().optional(),
  bedCabinNumber: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  sample_collection_rooms: z.array(z.string()).min(1, "At least one sample collection room must be selected"),
}).refine((data) => {
  const hasYears = data.ageYears && data.ageYears.trim() !== "";
  const hasMonths = data.ageMonths && data.ageMonths.trim() !== "";
  return hasYears || hasMonths;
}, {
  message: "Either Age in Years or Months is required",
  path: ["ageYears"],
});

type AdmissionItem = {
  id: number
  patient_name: string
  age: number
  sex: string
  phone: string
  admission_date: string
  status: string
  bedCabin?: {
    id: number
    code: string
    type: string
    ward: string
  }
}

type AdmissionResponse = {
  data: {
    items: AdmissionItem[]
    meta: {
      total: number
      page: number
      limit: number
    }
  }
}

export default function HospitalInvoiceForm({ onSubmittingChange }: { onSubmittingChange?: (submitting: boolean) => void }) {
  //const [deliveryDate, setDeliveryDate] = useState(new Date());
  // const [open, setOpen] = useState(false)
  // const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedTests, setSelectedTests] = useState<TestItem[]>([]);
  const [deptDiscounts, setDeptDiscounts] = useState<Record<string, number>>({});
  const [deptPayments, setDeptPayments] = useState<Record<string, number>>({});
  const [useDeptDiscount, setUseDeptDiscount] = useState(true);
  const [doctorOpen, setDoctorOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [openPaymentMethod, setOpenPaymentMethod] = useState(false);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [admissionSearch, setAdmissionSearch] = useState("");
  const [selectedAdmission, setSelectedAdmission] = useState<AdmissionItem | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currencySymbol } = useCurrency();

  // Tenant date format from company settings (display in this format; submit ISO).
  const { dateFormat, formatHint, formatDate, parseDate, toISODate } = useDateFormat();
  // Tracks whether the user manually picked a date, so we don't clobber their
  // selection when the date format loads/reloads from settings.
  const dateTouchedRef = useRef(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [testDrawerOpen, setTestDrawerOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const limit = 10;

  const token = getCookie('accessToken');

  const debouncedSearch = useDebounce(search, 400);
  const debouncedDoctorSearch = useDebounce(doctorSearch, 400);

  const { data, isFetching } = useQuery<TestsResponse>({
    queryKey: ["tests", page, debouncedSearch, categoryFilter],

    queryFn: async () => {
      const categoryParam = categoryFilter !== "all" ? `&category_id=${categoryFilter}` : "";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tests?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}${categoryParam}`,
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
    queryKey: ["doctors", debouncedDoctorSearch],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor?limit=100&is_active=true&search=${encodeURIComponent(debouncedDoctorSearch)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch doctors");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: admissionsData } = useQuery<AdmissionResponse>({
    queryKey: ["admissions", "active"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admission?status=active&limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch admissions");
      return res.json();
    },
    enabled: !!token,
  });

  type SampleCollectionRoomItem = {
    id: number;
    name: string;
    location: string;
    notes?: string;
    status: 'active' | 'inactive';
  }

  type SampleCollectionRoomsResponse = {
    items: SampleCollectionRoomItem[]
    meta: {
      page: number
      total: number
      limit: number
    }
  }

  const { 
    data: roomsData, 
    isLoading: isLoadingRooms, 
    error: roomsError, 
    refetch: refetchRooms 
  } = useQuery<SampleCollectionRoomsResponse>({
    queryKey: ["sample-collection-rooms"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sample-collection-rooms?limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch sample collection rooms");
      const result = await res.json();
      // Return the data part directly
      return result.data || { items: [], meta: { page: 1, total: 0, limit: 100 } };
    },
    enabled: !!token,
    refetchOnWindowFocus: true,
  });

  // Fetch payment methods from settings
  const { data: paymentMappings } = useQuery({
    queryKey: ['payment-mappings'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings/payment-mappings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch payment mappings')
      const json = await res.json()
      return json.data || {}
    },
    enabled: !!token,
  })

  const paymentMethodOptions: string[] = paymentMappings?.outdoor_test_payment?.methods?.map((m: any) => m.name).filter(Boolean) || ["Cash", "Card", "Mobile Banking"]

  // Auto-select first payment method is handled after form initialization

  const departmentWiseTests = useMemo(() => {
    const groups: Record<string, { total: number; tests: TestItem[]; departmentId: number | null }> = {};
    const categories = categoriesData?.data?.items || [];

    selectedTests.forEach((test) => {
      const category = categories.find((c) => c.id === test.category_id);
      const deptName = category?.department_name || "Unknown";
      const deptId = category?.department_id || null;

      if (!groups[deptName]) {
        groups[deptName] = { total: 0, tests: [], departmentId: deptId };
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
      if (exists) return prev.filter((t) => t.id !== test.id);

      // Default the new row's delivery date/time from the invoice-level
      // "Expected Delivery" fields (still per-row editable afterward) so
      // reception isn't forced to fill every row from scratch. Stored in the
      // tenant's display format (matching deliveryDate) — not ISO — since the
      // per-row picker uses the same format-aware Calendar as that field.
      const defaultDeliveryDate = watch('deliveryDate') || formatDate(new Date());

      return [
        ...prev,
        {
          ...test,
          delivery_date: test.delivery_date || defaultDeliveryDate,
          delivery_time: test.delivery_time || watch('deliveryTime') || '',
        },
      ];
    });
  };

  const updateTestDelivery = (testId: number, field: 'delivery_date' | 'delivery_time', value: string) => {
    setSelectedTests((prev) => prev.map((t) => (t.id === testId ? { ...t, [field]: value } : t)));
  };

  const handleSelectAdmission = async (admissionId: number) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admission/${admissionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch admission details");
      const result = await res.json();
      const admission = result.data;

      setSelectedAdmission(admission);

      // Auto-fill patient details
      setValue('patientName', admission.patient_name || '');
      setValue('sex', admission.sex || '');
      setValue('ageYears', admission.age?.toString() || '');
      setValue('phone', admission.phone || '');
      setValue('admissionNumber', admission.id?.toString() || '');

      // Set bed/cabin number if available
      if (admission.bedCabin) {
        setValue('bedCabinNumber', `${admission.bedCabin.code} (${admission.bedCabin.type})` || '');
      }

      setAdmissionOpen(false);
    } catch (error) {
      console.error('Error fetching admission details:', error);
      toast.error('Failed to load admission details');
    }
  };

  console.log('selectedTests', selectedTests);

  const totalCharge = selectedTests.reduce(
    (sum, test) => sum + Number(test?.price ?? 0),
    0
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_prefix: "",
      patientName: "",
      sex: "",
      ageYears: "",
      ageMonths: "",
      phone: "",
      date: formatDate(new Date()),
      ref_doctor: "",
      test_name: "",
      deliveryDate: formatDate(new Date()),
      deliveryTime: "",
      discount: 0,
      totalCharge: 0,
      paidAmount: 0,
      discountedAmount: 0,
      dueAmount: 0,
      tests: [],
      isIndoorPatient: false,
      admissionNumber: "",
      bedCabinNumber: "",
      paymentMethod: "",
      sample_collection_rooms: [],
    },
  });

  const { watch, setValue } = form;

  const paymentMethod = watch("paymentMethod") || "";
  const selectedRooms = watch("sample_collection_rooms") || [];

  // Auto-select first payment method
  useEffect(() => {
    if (paymentMethodOptions.length > 0 && !paymentMethod) {
      setValue("paymentMethod", paymentMethodOptions[0], { shouldValidate: true });
    }
  }, [paymentMethodOptions, paymentMethod, setValue]);

  // Fetch app settings for invoice prefix
  const { data: appSettings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch app settings");
      return res.json();
    },
    enabled: !!token,
  });

  // Set default invoice prefix from app settings
  useEffect(() => {
    if (appSettings?.data?.invoicePrefix) {
      setValue("invoice_prefix", appSettings.data.invoicePrefix);
    }
  }, [appSettings, setValue]);

  // Date controls from settings (date-controls page). When the toggle is off,
  // the invoice date is locked to today and the picker is disabled.
  const dateControls = useMemo(() => {
    const raw = appSettings?.data?.date_controls;
    if (!raw) return {} as Record<string, boolean>;
    try {
      return (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, boolean>;
    } catch {
      return {} as Record<string, boolean>;
    }
  }, [appSettings]);

  const invoiceDateChangeable = dateControls.outdoor_invoice_date_changeable === true;

  // When invoice date is not changeable, force it to today.
  useEffect(() => {
    if (!invoiceDateChangeable) {
      setValue("date", formatDate(new Date()), { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceDateChangeable, dateFormat]);

  // Re-format the auto-seeded date fields once the tenant date format is known,
  // unless the user has already picked a date manually.
  useEffect(() => {
    if (dateTouchedRef.current) return;
    setValue("date", formatDate(new Date()), { shouldValidate: true });
    setValue("deliveryDate", formatDate(new Date()), { shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFormat]);

  // Log on component mount
  useEffect(() => {
    console.log('███████████████████████████████████████████████████████████████');
    console.log('█                                                            █');
    console.log('█           OUTDOOR INVOICE FORM - INITIALIZED               █');
    console.log('█                                                            █');
    console.log('███████████████████████████████████████████████████████████████');
    console.log('🔍 All section changes will be logged below in real-time');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, []);

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

  // ============================================================
  // REAL-TIME PAYLOAD PREVIEW (Before Submit)
  // ============================================================

  // Track update count for preview
  const [previewUpdateCount, setPreviewUpdateCount] = useState(0);

  // Function to build and log the preview payload
  const buildAndLogPayloadPreview = () => {
    // Increment update counter and use it
    const currentUpdate = previewUpdateCount + 1;
    setPreviewUpdateCount(currentUpdate);

    const totalDeptDiscount = Object.values(deptDiscounts).reduce((sum, d) => sum + (d || 0), 0);
    const totalDeptPaid = Object.values(deptPayments).reduce((sum, p) => sum + (p || 0), 0);

    const previewPayload = {
      patient_name: watch('patientName') || '',
      sex: watch('sex') || '',
      age: Number(watch('ageYears')) || Number(watch('ageMonths')) || null,
      age_text: [watch('ageYears'), watch('ageMonths')].some(v => v) ? `${watch('ageYears') || 0}Y ${watch('ageMonths') || 0}M` : null,
      phone: watch('phone') || '',
      invoice_date: watch('date') || '',
      delivery_date: watch('deliveryDate') || null,
      delivery_time: watch('deliveryTime') || null,
      doctor_id: Number(watch('ref_doctor')) || null,
      total_amount: totalCharge,
      net_amount: totalCharge - totalDeptDiscount,
      selected_tests: selectedTests.map((test) => ({
        id: test.id,
        category_id: test.category_id,
        price: Number(test.price),
        delivery_date: test.delivery_date ? toISODate(parseDate(test.delivery_date) || new Date()) : null,
        delivery_time: test.delivery_time || null,
      })),
      department_payments: Object.entries(departmentWiseTests)
        .map(([deptName, dept]) => {
          const deptId = dept.departmentId;
          if (deptId === undefined || deptId === null) return null;
          const amount = Number(deptPayments[deptName]) || 0;
          // Only include if amount > 0
          if (amount === 0) return null;
          return {
            department_id: deptId,
            amount: amount,
            method: paymentMethod || 'Cash'
          };
        })
        .filter((p): p is { department_id: number; amount: number; method: string } => p !== null),
      department_discounts: Object.entries(departmentWiseTests)
        .map(([deptName, dept]) => {
          const deptId = dept.departmentId;
          if (deptId === undefined || deptId === null) return null;
          const discount = Number(deptDiscounts[deptName]) || 0;
          // Only include if discount > 0
          if (discount === 0) return null;
          return {
            department_id: deptId,
            discount: discount
          };
        })
        .filter((d): d is { department_id: number; discount: number } => d !== null),
      payments: {
        amount: Number(paidAmount) || 0,
        method: paymentMethod || 'Cash',
        payment_date: watch('date') || ''
      },
      discounts: {
        amount: Number(discount) || 0,
        reason: discountReason || 'Department wise discount'
      }
    };

    console.log('███████████████████████████████████████████████████████████████');
    console.log('█                                                            █');
    console.log(`█     📄 PAYLOAD PREVIEW (Update #${currentUpdate})              █`);
    console.log('█                                                            █');
    console.log('███████████████████████████████████████████████████████████████');
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    FORM SECTION GROUPING                          ║');
    console.log('╠════════════════════════════════════════════════════════════════════════╣');
    console.log('║');

    // SECTION 1: PATIENT INFORMATION
    console.log('║  1️️⃣  PATIENT INFORMATION → outdoor_invoice');
    console.log('║     ─────────────────────────────────────────────────────────────');
    console.log(`║     • Patient Name  : ${previewPayload.patient_name || '—'}`);
    console.log(`║     • Sex           : ${previewPayload.sex || '—'}`);
    console.log(`║     • Phone         : ${previewPayload.phone || '—'}`);
    console.log(`║     • Invoice Date  : ${previewPayload.invoice_date || '—'}`);
    console.log(`║     • Delivery Date : ${previewPayload.delivery_date || '—'}`);
    console.log(`║     • Delivery Time : ${previewPayload.delivery_time || '—'}`);
    console.log(`║     • Ref. Doctor   : ${previewPayload.doctor_id || '—'}`);
    console.log(`║     • Total Amount  : ${previewPayload.total_amount}`);
    console.log(`║     • Net Amount    : ${previewPayload.net_amount} (total - dept_discounts)`);
    console.log('║');

    // SECTION 2: TEST SELECTION
    console.log('║  2️️⃣  TEST SELECTION → outdoor_invoice_items');
    console.log('║     ─────────────────────────────────────────────────────────────');
    console.log(`║     • Total Tests   : ${previewPayload.selected_tests.length}`);
    previewPayload.selected_tests.forEach((t, i) => {
      console.log(`║     ${i + 1}. Test ID: ${t.id}, Category: ${t.category_id}, Price: ${t.price}`);
    });
    console.log(`║     → Backend will auto-create outdoor_invoice_department_wise_bills`);
    console.log('║');

    // SECTION 3: DEPT. DISCOUNTS & PAYMENTS
    console.log('║  3️️⃣  DEPT. DISCOUNTS & PAYMENTS');
    console.log('║     ─────────────────────────────────────────────────────────────');
    console.log(`║     • Department Payments → outdoor_invoice_department_payments`);
    previewPayload.department_payments.forEach((p, i) => {
      console.log(`║       ${i + 1}. Dept ID: ${p.department_id}, Amount: ${p.amount}, Method: ${p.method}`);
    });
    console.log(`║       Total Dept Paid: ${totalDeptPaid}`);
    console.log('║     ─────────────────────────────────────────────────────────────');
    console.log(`║     • Department Discounts → outdoor_invoice_department_discount`);
    previewPayload.department_discounts.forEach((d, i) => {
      console.log(`║       ${i + 1}. Dept ID: ${d.department_id}, Discount: ${d.discount}`);
    });
    console.log(`║       Total Dept Discount: ${totalDeptDiscount}`);
    console.log('║');

    // SECTION 4: BILLING & DELIVERY
    console.log('║  4️️⃣  BILLING & DELIVERY');
    console.log('║     ─────────────────────────────────────────────────────────────');
    console.log(`║     • Global Payment → outdoor_invoice_payments`);
    console.log(`║       - Amount  : ${previewPayload.payments.amount}`);
    console.log(`║       - Method  : ${previewPayload.payments.method}`);
    console.log(`║       - Date    : ${previewPayload.payments.payment_date}`);
    console.log('║     ─────────────────────────────────────────────────────────────');
    console.log(`║     • Global Discount → outdoor_invoice_discounts`);
    console.log(`║       - Amount  : ${previewPayload.discounts.amount}`);
    console.log(`║       - Reason  : ${previewPayload.discounts.reason}`);
    console.log(`║       ⚠️  Only saved if NO department discounts exist`);
    console.log('║     ─────────────────────────────────────────────────────────────');
    console.log(`║     • Delivery Info`);
    console.log(`║       - Delivery Date : ${watch('deliveryDate') || 'Not set'}`);
    console.log(`║       - Delivery Time : ${watch('deliveryTime') || 'Not set'}`);
    console.log('║');

    console.log('╠════════════════════════════════════════════════════════════════════════╣');
    console.log('║  📊 DATABASE TABLE INSERTION SUMMARY                                 ║');
    console.log('╠════════════════════════════════════════════════════════════════════════╣');
    console.log('║  ┌────────────────────────────────────────────────────────────────┬───────────────┐');
    console.log('║  │ Table                                                            │ Records      │');
    console.log('║  ├────────────────────────────────────────────────────────────────┼───────────────┤');
    console.log(`║  │ outdoor_invoice                                                  │ 1            │`);
    console.log(`║  │ outdoor_invoice_items                                            │ ${String(previewPayload.selected_tests.length).padEnd(13)} │`);
    console.log(`║  │ outdoor_invoice_department_wise_bills                           │ AUTO         │`);
    console.log(`║  │ outdoor_invoice_department_payments                             │ ${String(previewPayload.department_payments.length).padEnd(13)} │`);
    console.log(`║  │ outdoor_invoice_department_discount                             │ ${String(previewPayload.department_discounts.length).padEnd(13)} │`);
    console.log(`║  │ outdoor_invoice_payments                                         │ 1            │`);
    console.log(`║  │ outdoor_invoice_discounts                                        │ 0 or 1        │`);
    console.log('║  └────────────────────────────────────────────────────────────────┴───────────────┘');
    console.log('╚════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📄 COMPLETE PAYLOAD JSON:');
    console.log(JSON.stringify(previewPayload, null, 2));
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💡 This preview updates in real-time as you fill the form');
    console.log('═══════════════════════════════════════════════════════════════');

    return previewPayload;
  };

  // Auto-update preview when form data changes
  useEffect(() => {
    buildAndLogPayloadPreview();
  }, [
    watch('patientName'),
    watch('sex'),
    watch('ageYears'),
    watch('ageMonths'),
    watch('phone'),
    watch('date'),
    watch('deliveryDate'),
    watch('deliveryTime'),
    watch('ref_doctor'),
    selectedTests,
    departmentWiseTests,
    deptDiscounts,
    deptPayments,
    totalCharge,
    discount,
    paidAmount
  ]);

  // ============================================================
  // END OF CONSOLE LOGGING
  // ============================================================

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

  const { mutate: createInvoice, isPending: isCreating } = useCreateOutdoorInvoice();

  // Report submission state to parent (e.g. to disable the header submit button)
  useEffect(() => {
    onSubmittingChange?.(isCreating);
  }, [isCreating, onSubmittingChange]);

  const onSubmit = (data: any) => {
    console.log(data);

    const {
      patientName,
      sex,
      ageYears,
      ageMonths,
      phone,
      date,
      ref_doctor,
      totalCharge,
      deliveryDate,
      deliveryTime,
    } = data;

    // Calculate totals for submission
    const totalDeptDiscount = Object.values(deptDiscounts).reduce((sum, d) => sum + (d || 0), 0);
    const totalDeptPaid = Object.values(deptPayments).reduce((sum, p) => sum + (p || 0), 0);

    // Dates are displayed in the tenant's format but submitted as canonical ISO
    // (YYYY-MM-DD) so the backend parses them correctly regardless of format.
    const isoInvoiceDate = toISODate(parseDate(date) || new Date());
    const isoDeliveryDate = deliveryDate ? toISODate(parseDate(deliveryDate) || new Date()) : '';

    const payload = {
      // Main Invoice Data → outdoor_invoice table
      invoice_prefix: data.invoice_prefix || null,
      patient_name: patientName,
      sex,
      age: Number(ageYears) || Number(ageMonths) || null,
      age_text: [ageYears, ageMonths].some(v => v) ? `${ageYears || 0}Y ${ageMonths || 0}M` : null,
      phone,
      invoice_date: isoInvoiceDate,
      delivery_date: isoDeliveryDate,
      delivery_time: deliveryTime || '',
      doctor_id: Number(ref_doctor) || null,
      total_amount: totalCharge,
      net_amount: totalCharge - totalDeptDiscount, // Net after department discounts

      // Indoor Patient Information
      is_indoor_patient: watch('isIndoorPatient') || false,
      admission_number: watch('isIndoorPatient') ? (watch('admissionNumber') || null) : null,
      bed_cabin_number: watch('isIndoorPatient') ? (watch('bedCabinNumber') || null) : null,

      // Sample Collection Rooms
      sample_collection_rooms: selectedRooms,

      // Selected Tests → outdoor_invoice_items table
      // Backend will auto-create outdoor_invoice_department_wise_bills from this
      selected_tests: selectedTests.map((test) => ({
        id: test.id,
        category_id: test.category_id,
        price: Number(test.price),
        delivery_date: test.delivery_date ? toISODate(parseDate(test.delivery_date) || new Date()) : null,
        delivery_time: test.delivery_time || null,
      })),

      // Department Payments → outdoor_invoice_department_payments table
      // Only include payments with amount > 0
      department_payments: Object.entries(departmentWiseTests)
        .map(([deptName, dept]) => {
          const deptId = dept.departmentId;
          if (deptId === undefined || deptId === null) {
            console.warn(`Department ID not found for: ${deptName}`);
            return null;
          }
          const amount = Number(deptPayments[deptName]) || 0;
          // Skip if no payment entered
          if (amount === 0) return null;
          return {
            department_id: deptId,
            amount: amount,
            method: paymentMethod || 'Cash'
          };
        })
        .filter((p): p is { department_id: number; amount: number; method: string } => p !== null),

      // Department Discounts → outdoor_invoice_department_discount table
      // Only include discounts with amount > 0
      department_discounts: Object.entries(departmentWiseTests)
        .map(([deptName, dept]) => {
          const deptId = dept.departmentId;
          if (deptId === undefined || deptId === null) {
            console.warn(`Department ID not found for: ${deptName}`);
            return null;
          }
          const discount = Number(deptDiscounts[deptName]) || 0;
          // Skip if no discount entered
          if (discount === 0) return null;
          return {
            department_id: deptId,
            discount: discount
          };
        })
        .filter((d): d is { department_id: number; discount: number } => d !== null),

      // Global Payment → outdoor_invoice_payments table
      payments: {
        amount: Number(paidAmount) || 0,
        method: paymentMethod || 'Cash',
        payment_date: isoInvoiceDate
      },

      // Global Discount → outdoor_invoice_discounts table
      // Note: Backend only saves this if NO department_discounts exist (avoid double entry)
      discounts: {
        amount: Number(discount) || 0,
        reason: discountReason || 'Department wise discount'
      }
    };

    // Debug logging
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🚀 INVOICE SUBMISSION - API PAYLOAD');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 Main Invoice (outdoor_invoice):');
    console.log('  - patient_name:', payload.patient_name);
    console.log('  - sex:', payload.sex);
    console.log('  - age:', payload.age, payload.age_text ? `(${payload.age_text})` : '');
    console.log('  - phone:', payload.phone);
    console.log('  - invoice_date:', payload.invoice_date);
    console.log('  - delivery_date:', payload.delivery_date || 'Not set');
    console.log('  - delivery_time:', payload.delivery_time || 'Not set');
    console.log('  - doctor_id:', payload.doctor_id);
    console.log('  - total_amount:', payload.total_amount);
    console.log('  - net_amount:', payload.net_amount, '(total - dept_discounts)');
    console.log('');
    console.log('🧪 Selected Tests (outdoor_invoice_items):', payload.selected_tests?.length || 0, 'items');
    console.log('  → Backend will auto-create outdoor_invoice_department_wise_bills');
    console.log('');
    console.log('💰 Department Payments (outdoor_invoice_department_payments):', payload.department_payments?.length || 0, 'departments');
    console.log('  Total:', totalDeptPaid);
    console.log('');
    console.log('🏷️  Department Discounts (outdoor_invoice_department_discount):', payload.department_discounts?.length || 0, 'departments');
    console.log('  Total:', totalDeptDiscount);
    console.log('');
    console.log('💵 Global Payment (outdoor_invoice_payments):', payload.payments);
    console.log('');
    console.log('🎁 Global Discount (outdoor_invoice_discounts):', payload.discounts);
    console.log('  ⚠️  Only saved if NO department discounts (backend logic)');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 TABLE INSERTION SUMMARY:');
    console.log('┌────────────────────────────────────────────────┬───────────────┐');
    console.log('│ Database Table                                 │ Records      │');
    console.log('├────────────────────────────────────────────────┼───────────────┤');
    console.log(`│ outdoor_invoice                                 │ 1            │`);
    console.log(`│ outdoor_invoice_items                           │ ${String(payload.selected_tests?.length || 0).padEnd(13)} │`);
    console.log(`│ outdoor_invoice_department_wise_bills          │ AUTO (from items) │`);
    console.log(`│ outdoor_invoice_department_payments            │ ${String(payload.department_payments?.length || 0).padEnd(13)} │`);
    console.log(`│ outdoor_invoice_department_discount            │ ${String(payload.department_discounts?.length || 0).padEnd(13)} │`);
    console.log(`│ outdoor_invoice_payments                        │ 1            │`);
    console.log(`│ outdoor_invoice_discounts                       │ 0 or 1 (conditional)│`);
    console.log('└────────────────────────────────────────────────┴───────────────┘');
    console.log('');
    console.log('Complete payload JSON:', JSON.stringify(payload, null, 2));
    console.log('═══════════════════════════════════════════════════════════════');

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
        setValue("sample_collection_rooms", []);

        // Invalidate all invoice queries to force refetch
        queryClient.invalidateQueries({
          predicate: (query) => {
            // Invalidate any query that starts with "invoices"
            return query.queryKey[0] === "invoices";
          },
        });

        navigate({ to: "/dashboard/outdoor/reception/invoices/list" });
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
          <Card className="overflow-hidden gap-0 shadow-sm p-0">
            <CardHeader className="border-b py-3 px-4 gap-0" style={{ backgroundColor: '#3B82F6' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-lg">
                  <User className="w-4 h-4" style={{ color: '#3B82F6' }} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-white">Patient Information</CardTitle>
                  <p className="text-xs text-white/80">Basic details and registration information</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 md:px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                {/* Invoice Prefix - Auto-generated */}
                <FormField
                  control={form.control}
                  name="invoice_prefix"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Invoice Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Auto-generated from settings"
                          disabled
                          className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent transition-all"
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
                          <SelectTrigger className="w-full rounded-md border-gray-200 dark:border-gray-800 bg-transparent transition-all" style={{height: "40px"}}>
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
                  <div className="flex gap-2 items-center">
                    <FormField
                      control={form.control}
                      name="ageYears"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              className="h-10 w-20 rounded-md border-gray-200 dark:border-gray-800 bg-transparent transition-all"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <span className="text-xs text-muted-foreground">Yr</span>
                    <FormField
                      control={form.control}
                      name="ageMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="11"
                              placeholder="0"
                              className="h-10 w-20 rounded-md border-gray-200 dark:border-gray-800 bg-transparent transition-all"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <span className="text-xs text-muted-foreground">Mo</span>
                  </div>
                  {form.formState.errors.ageYears && (
                    <p className="text-xs font-medium text-destructive">
                      {form.formState.errors.ageYears.message as string}
                    </p>
                  )}
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
                          className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent transition-all"
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
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all text-sm",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {selectedDoctor ? (
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">
                                      Dr. {selectedDoctor.doctor_name}
                                      {(selectedDoctor.qualification || selectedDoctor.title) && ` (${selectedDoctor.qualification || selectedDoctor.title})`}
                                    </span>
                                    {selectedDoctor.speciality && (
                                      <span className="text-xs text-muted-foreground">
                                        {selectedDoctor.speciality}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  "Select doctor..."
                                )}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command
                              filter={(value, search) => {
                                if (!search) return 1;
                                return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                              }}
                              className="border border-gray-100 dark:border-gray-800"
                            >
                              <CommandInput placeholder="Search doctor by name, qualification, or specialty..." className="h-10" value={doctorSearch} onValueChange={setDoctorSearch} />
                              <CommandList className="max-h-[300px]">
                                <CommandEmpty>No doctor found.</CommandEmpty>
                                <CommandGroup>
                                  {doctorsData?.data?.items?.map((doctor) => {
                                    const displayName = `Dr. ${doctor.doctor_name}`;
                                    const subtitle = [
                                      doctor.qualification || doctor.title,
                                      doctor.speciality
                                    ].filter(Boolean).join(" - ");

                                    return (
                                      <CommandItem
                                        key={doctor.id}
                                        value={`${doctor.doctor_name} ${doctor.qualification || doctor.title || ''} ${doctor.speciality || ''} ${doctor.id}`}
                                        className="py-2.5 px-4 cursor-pointer"
                                        onSelect={() => {
                                          field.onChange(String(doctor.id));
                                          setDoctorOpen(false);
                                        }}
                                      >
                                        <div className="flex items-center gap-2 w-full">
                                          <Check
                                            className={cn(
                                              "h-4 w-4 shrink-0",
                                              String(doctor.id) === String(field.value)
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span className="font-medium">{displayName}</span>
                                            {subtitle && (
                                              <span className="text-xs text-muted-foreground">
                                                {subtitle}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    );
                                  })}
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
                        Invoice Date <span className="text-xs font-normal text-muted-foreground">({formatHint})</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild disabled={!invoiceDateChangeable}>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!invoiceDateChangeable}
                              className={cn(
                                "h-10 justify-start text-left font-normal border-gray-200 bg-transparent",
                                !field.value && "text-muted-foreground",
                                !invoiceDateChangeable && "disabled:opacity-100 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {field.value || formatDate(new Date())}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseDate(field.value)}
                            onSelect={(date) => {
                              dateTouchedRef.current = true;
                              field.onChange(date ? formatDate(date) : "");
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {!invoiceDateChangeable && (
                        <p className="text-xs text-muted-foreground">Locked to today by settings.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Indoor Patient Card */}
          <Card className="overflow-hidden gap-0 shadow-sm p-0">
            <CardHeader className="border-b py-3 px-4 gap-0" style={{ backgroundColor: '#8B5CF6' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-lg">
                  <User className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-white">Indoor Patient</CardTitle>
                  <p className="text-xs text-white/80">Link with admitted patient records</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 md:px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Is Indoor Patient Checkbox */}
                <FormItem className="flex flex-col gap-2 md:col-span-2">
                  <div className="flex items-center space-x-3 p-4 bg-muted/40 rounded-lg border">
                    <Checkbox
                      id="isIndoorPatient"
                      checked={watch('isIndoorPatient')}
                      onCheckedChange={(checked) => {
                        if (typeof checked === 'boolean') {
                          setValue('isIndoorPatient', checked);
                          if (!checked) {
                            setSelectedAdmission(null);
                            setValue('admissionNumber', '');
                            setValue('bedCabinNumber', '');
                          }
                        }
                      }}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="isIndoorPatient"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-2"
                      >
                        <span>This is an Indoor Patient</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Check if the patient is currently admitted
                      </p>
                    </div>
                  </div>
                </FormItem>

                {/* Admission Number - Searchable Dropdown */}
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Select Admission
                  </FormLabel>
                  <div className="relative">
                    <Popover
                      open={admissionOpen}
                      onOpenChange={(open) => {
                        setAdmissionOpen(open);
                        if (!open) setAdmissionSearch(''); // Reset search when closing
                      }}
                    >
                      <PopoverTrigger asChild disabled={!watch('isIndoorPatient')}>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={admissionOpen}
                          className={cn(
                            "w-full justify-between h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent transition-all disabled:opacity-50",
                            !selectedAdmission && "text-muted-foreground"
                          )}
                        >
                          {selectedAdmission
                            ? `#${selectedAdmission.id} - ${selectedAdmission.patient_name}`
                            : "Search and select admission..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command
                          filter={(_value: string, _search: string) => {
                            // Always return 1 to match everything - manual filtering is done in the map
                            return 1;
                          }}
                        >
                          <div className="flex items-center border-b px-3">
                            <User className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <CommandInput
                              placeholder="Search admissions..."
                              onValueChange={setAdmissionSearch}
                              className="border-0 focus:ring-0 py-3"
                            />
                          </div>
                          <CommandList>
                            <CommandEmpty>
                              {admissionSearch
                                ? "No admissions found."
                                : "No active admissions."}
                            </CommandEmpty>
                            <CommandGroup>
                              {admissionsData?.data?.items
                                ?.filter((admission) => {
                                  if (!admissionSearch) return true;
                                  const searchLower = admissionSearch.toLowerCase();
                                  return (
                                    admission.patient_name?.toLowerCase().includes(searchLower) ||
                                    admission.id?.toString().includes(searchLower)
                                  );
                                })
                                .map((admission) => (
                                  <CommandItem
                                    key={admission.id}
                                    value={admission.id.toString()}
                                    onSelect={() => {
                                      handleSelectAdmission(admission.id);
                                      setAdmissionSearch(''); // Reset search after selection
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">#{admission.id}</span>
                                          <span className="font-medium">{admission.patient_name}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                          <span>{admission.age}Y</span>
                                          <span>•</span>
                                          <span>{admission.sex}</span>
                                          {admission.bedCabin && (
                                            <>
                                              <span>•</span>
                                              <span>{admission.bedCabin.code}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <CircleCheck className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedAdmission?.id === admission.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )} />
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="hidden"
                      {...form.register("admissionNumber")}
                    />
                  </div>
                  <FormMessage />
                </FormItem>

                {/* Bed/Cabin Number - Auto-filled from admission */}
                <FormField
                  control={form.control}
                  name="bedCabinNumber"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Bed/Cabin Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Auto-filled from admission"
                          disabled={true}
                          className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Auto-populated when admission is selected
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

       
          {/* Test Info Card */}
          <Card className="overflow-hidden gap-0 shadow-sm p-0">
            <CardHeader className="border-b py-3 px-4 gap-0" style={{ backgroundColor: '#6366F1' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-lg">
                  <Activity className="w-4 h-4" style={{ color: '#6366F1' }} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-white">Test Selection</CardTitle>
                  <p className="text-xs text-white/80">Select diagnostic tests and view summary</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* col-6: Select Tests */}
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Select Tests
                    </FormLabel>

                    {/* SELECT TESTS — DRAWER */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTestDrawerOpen(true)}
                      className="w-full rounded-md border-gray-200 dark:border-gray-800 bg-transparent transition-all justify-start font-normal"
                      style={{ height: '40px' }}
                    >
                      <Activity className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                      <span className={cn("truncate", !selectedTests.length && "text-muted-foreground")}>
                        {selectedTests.length
                          ? `${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''} selected`
                          : "Search and select tests..."}
                      </span>
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </div>

                  {/* col-6: Category filter */}
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Category
                    </FormLabel>
                    <Select
                      value={categoryFilter}
                      onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}
                    >
                      <SelectTrigger className="w-full rounded-md border-gray-200 dark:border-gray-800 bg-transparent transition-all" style={{ height: '40px' }}>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categoriesData?.data?.items?.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Sheet open={testDrawerOpen} onOpenChange={setTestDrawerOpen}>
                  <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                    <SheetHeader className="border-b px-4 py-3 gap-0" style={{ backgroundColor: '#6366F1' }}>
                      <SheetTitle className="flex items-center gap-3 pr-8">
                        <div className="p-2 bg-white rounded-lg shadow-lg">
                          <FlaskConical className="w-4 h-4" style={{ color: '#6366F1' }} />
                        </div>
                        <div>
                          <div className="text-base font-semibold text-left text-white">Select Tests</div>
                          <p className="text-xs text-white/80 font-normal text-left">Search and choose tests to add</p>
                        </div>
                      </SheetTitle>
                    </SheetHeader>

                    {/* Filters: category + search */}
                    <div className="p-3 border-b border-gray-100 dark:border-gray-800 space-y-2">
                      <Select
                        value={categoryFilter}
                        onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}
                      >
                        <SelectTrigger className="w-full h-9 rounded-md border-gray-200 dark:border-gray-800 bg-transparent">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categoriesData?.data?.items?.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="relative">
                        <Activity className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search tests..."
                          value={search}
                          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                          className="h-10 pl-9 border-gray-200 dark:border-gray-800"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Test list */}
                    <div className="flex-1 overflow-y-auto">
                      {data?.data?.items?.length === 0 ? (
                        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                          No tests found matching your search.
                        </div>
                      ) : (
                        data?.data?.items?.map((test) => {
                          const category = categoriesData?.data?.items?.find(c => c.id === test.category_id);
                          const department = category?.department_name || 'N/A';
                          const isChecked = selectedTests.some((t) => t.id === test.id);

                          return (
                            <div
                              key={test.id}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-accent transition-colors border-b border-border/60",
                                isChecked && "bg-accent"
                              )}
                              onClick={() => toggleTest(test)}
                            >
                              <Checkbox
                                checked={isChecked}
                              />
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{test.name}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-mono">{currencySymbol} {Number(test.price).toLocaleString()}</span>
                                  <span>•</span>
                                  <span className="truncate">{department}</span>
                                </div>
                              </div>
                              {isChecked && <Check className="ml-auto h-4 w-4 text-primary shrink-0" />}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Pagination */}
                    {(() => {
                      const meta = data?.data?.meta;
                      const total = meta?.total ?? 0;
                      const totalPages = Math.max(1, Math.ceil(total / limit));
                      const from = total === 0 ? 0 : (page - 1) * limit + 1;
                      const to = Math.min(page * limit, total);
                      return (
                        <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                          <span className="text-xs text-muted-foreground">
                            {total > 0 ? `${from}–${to} of ${total}` : 'No tests'}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={page <= 1 || isFetching}
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground px-1 min-w-[70px] text-center">
                              Page {page} / {totalPages}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={page >= totalPages || isFetching}
                              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                  </SheetContent>
                </Sheet>
              </div>

              {/* TABLE */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-16">#</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Test Name</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Room No</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Department</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-32">Price</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-40">Delivery Date</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-32">Delivery Time</th>
                      <th className="px-4 py-2.5 text-center font-medium text-muted-foreground w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {selectedTests.map((test, index) => {
                      const category = categoriesData?.data?.items?.find(c => c.id === test.category_id);
                      const department = category?.department_name || 'N/A';

                      const nestedRoomName = (test as any).sampleCollectionRoom?.name || (test as any).sample_collection_room?.name;
                      const matchedRoom = roomsData?.items?.find((r) => Number(r.id) === Number(test.sample_collection_room_id));
                      const roomName = nestedRoomName || matchedRoom?.name || '-';

                      return (
                        <tr key={test.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground font-mono">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{test.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{roomName}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{department}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                            {Number(test.price).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "h-8 w-full justify-start text-xs font-normal px-2 border-gray-200 dark:border-gray-800",
                                    !test.delivery_date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="truncate">{test.delivery_date || formatHint}</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={test.delivery_date ? parseDate(test.delivery_date) : undefined}
                                  onSelect={(date) => updateTestDelivery(test.id, 'delivery_date', date ? formatDate(date) : '')}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="time"
                              value={test.delivery_time || ''}
                              onChange={(e) => updateTestDelivery(test.id, 'delivery_time', e.target.value)}
                              className="h-8 text-xs px-2 border-gray-200 dark:border-gray-800"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => toggleTest(test)}
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}

                    {selectedTests.length === 0 && (
                      <tr>
                        <td
                          className="px-4 py-12 text-center text-muted-foreground italic bg-gray-50/30 dark:bg-transparent"
                          colSpan={8}
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
                      <tr className="bg-muted/50 border-t">
                        <td colSpan={4} className="px-4 py-3 font-semibold text-foreground text-right">
                          Subtotal:
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground text-base">
                          {totalCharge.toLocaleString()}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Sample Collection Rooms Card */}
          <Card className="overflow-hidden gap-0 shadow-sm p-0">
            <CardHeader className="border-b py-3 px-4 gap-0" style={{ backgroundColor: '#14B8A6' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-lg">
                  <FlaskConical className="w-4 h-4" style={{ color: '#14B8A6' }} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-white">Sample Collection Rooms</CardTitle>
                  <p className="text-xs text-white/80">Select rooms for sample collection</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {isLoadingRooms ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                  <p className="text-sm">Loading sample collection rooms...</p>
                </div>
              ) : roomsError ? (
                <div className="text-center py-8 text-red-500">
                  <p className="text-sm font-semibold mb-2">Failed to load sample collection rooms</p>
                  <p className="text-xs text-muted-foreground mb-4">{(roomsError as any)?.message || "Network error"}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => refetchRooms()}
                    className="border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400"
                  >
                    Retry Loading
                  </Button>
                </div>
              ) : roomsData?.items && roomsData.items.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roomsData.items
                      .filter((room) => room.status === 'active')
                      .map((room) => {
                        const roomId = String(room.id);
                        const isSelected = selectedRooms.includes(roomId);
                        return (
                          <div
                            key={room.id}
                            className={cn(
                              "relative flex items-start gap-3 p-4 rounded-lg border transition-colors",
                              isSelected
                                ? "bg-accent border-primary"
                                : "bg-background hover:border-muted-foreground/40"
                            )}
                          >
                            <Checkbox
                              id={`room-${room.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                  if (typeof checked === 'boolean') {
                                    const updatedRooms = checked
                                      ? [...selectedRooms, roomId]
                                      : selectedRooms.filter((r) => r !== roomId);
                                    setValue("sample_collection_rooms", updatedRooms, { shouldValidate: true });
                                  }
                              }}
                              className="mt-0.5"
                            />
                            <label
                              htmlFor={`room-${room.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {room.name}
                                </h4>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{room.location}</p>
                              {room.notes && (
                                <p className="text-xs text-muted-foreground mt-1 italic">{room.notes}</p>
                              )}
                            </label>
                          </div>
                        );
                      })}
                  </div>
                  {selectedRooms.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/40 rounded-lg border">
                      <p className="text-sm font-medium text-foreground">
                        {selectedRooms.length} room{selectedRooms.length > 1 ? 's' : ''} selected for sample collection
                      </p>
                    </div>
                  )}
                  {form.formState.errors.sample_collection_rooms && (
                    <p className="text-sm font-medium text-destructive mt-3 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive" />
                      {form.formState.errors.sample_collection_rooms.message as string}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sample collection rooms available</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => refetchRooms()}
                    className="mt-4"
                  >
                    Refresh Rooms
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Discount Card */}
          <Card className="overflow-hidden gap-0 shadow-sm p-0">
            <CardHeader className="border-b py-3 px-4 gap-0" style={{ backgroundColor: '#F59E0B' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-lg">
                  <PenLine className="w-4 h-4" style={{ color: '#F59E0B' }} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold text-white">Dept. Discounts & Payments</CardTitle>
                  <p className="text-xs text-white/80">Breakdown of charges and payments per department</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md shadow-sm">
                  <span className="text-[10px] font-medium text-muted-foreground">Total Dept. Discount:</span>
                  <span className="text-xs font-semibold text-foreground font-mono">{totalDeptDiscount.toLocaleString()}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Department</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Gross</th>
                      <th className="px-4 py-2.5 text-center font-medium text-muted-foreground w-32">Discount</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Net</th>
                      <th className="px-4 py-2.5 text-center font-medium text-muted-foreground w-32">Paid</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Due</th>
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
                          <tr key={deptName} className="hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">{deptName}</td>
                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">{group.total.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                className="h-8 text-right font-mono"
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
                            <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                              {netAmount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                className="h-8 text-right font-mono"
                                value={paid || ''}
                                onChange={(e) => {
                                  const valStr = e.target.value;
                                  if (valStr === '') {
                                    setDeptPayments((prev) => ({ ...prev, [deptName]: 0 }));
                                    return;
                                  }
                                  let val = Number(valStr);
                                  if (val < 0) val = 0;
                                  if (val > netAmount) val = netAmount;
                                  setDeptPayments((prev) => ({ ...prev, [deptName]: val }));
                                }}
                                min="0"
                                max={netAmount}
                              />
                            </td>
                            <td className={`px-4 py-3 text-right font-mono font-bold ${due > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
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
          <Card className="overflow-hidden gap-0 shadow-sm p-0">
            <CardHeader className="border-b py-3 px-4 gap-0" style={{ backgroundColor: '#10B981' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-lg">
                  <Clock className="w-4 h-4" style={{ color: '#10B981' }} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-white">Billing & Delivery</CardTitle>
                  <p className="text-xs text-white/80">Final summary, delivery schedule and payment</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Delivery details */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Delivery Date <span className="text-xs font-normal text-muted-foreground">({formatHint})</span>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    "h-10 justify-start text-left font-normal border-gray-200 bg-transparent",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {field.value || <span>Pick a date</span>}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? parseDate(field.value) : undefined}
                                onSelect={(date) => {
                                  dateTouchedRef.current = true;
                                  field.onChange(date ? formatDate(date) : "");
                                }}
                                disabled={(date) => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  return date < today;
                                }}
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
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                              <Input
                                type="time"
                                className="h-10 pl-10 border-gray-200 bg-transparent"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Payment Method */}
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Payment Method
                        </FormLabel>
                        <Popover open={openPaymentMethod} onOpenChange={setOpenPaymentMethod}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={openPaymentMethod}
                                className="w-full justify-between h-10 border-gray-200 dark:border-gray-800 bg-transparent"
                              >
                                {field.value
                                  ? paymentMethodOptions.find((m) => m === field.value) || field.value
                                  : "Select method..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Search method..." />
                              <CommandList>
                                <CommandEmpty>No method found.</CommandEmpty>
                                <CommandGroup>
                                  {paymentMethodOptions.map((method) => (
                                    <CommandItem
                                      key={method}
                                      value={method}
                                      onSelect={(currentValue) => {
                                        field.onChange(currentValue === field.value ? "" : currentValue);
                                        setOpenPaymentMethod(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === method ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {method}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Reason / Note */}
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Reason / Note
                    </FormLabel>
                    <Input
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="Reason for discount (optional)"
                      className="h-10 border-gray-200 dark:border-gray-800 bg-transparent"
                    />
                  </div>

                  <div className="p-4 rounded-lg bg-muted/40 border">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      Invoice Status Summary
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This invoice will be registered as {dueAmount > 0 ? <span className="text-destructive font-semibold uppercase">Partial / Due</span> : <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Fully Paid</span>}.
                      The department-wise payment breakdown ensures accurate revenue tracking across clinical units.
                    </p>
                  </div>
                </div>

                {/* Billing details */}
                <div className="bg-muted/40 p-5 rounded-lg border h-fit">
                  <div className="flex justify-between items-center pb-3">
                    <span className="text-muted-foreground font-medium">Gross Total</span>
                    <span className="text-base font-mono font-semibold text-foreground">
                      {totalCharge.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-t">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground font-medium">Total Discount
                        {totalCharge > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({((totalDeptDiscount / totalCharge) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground">(Department-wise)</span>
                    </div>
                    <span className="text-base font-mono font-semibold text-foreground">
                      - {totalDeptDiscount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-t">
                    <span className="text-foreground font-semibold">Net Payable</span>
                    <span className="text-xl font-mono font-bold text-foreground">
                      {discountedAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-t">
                    <span className="text-muted-foreground font-medium">Paid Amount</span>
                    <span className="text-base font-mono font-semibold text-foreground">
                      {totalDeptPaid.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-4 mt-1 border-t-2 border-foreground/10">
                    <span className="text-foreground font-bold text-base">BALANCE DUE</span>
                    <span className={`text-2xl font-mono font-bold ${dueAmount > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {dueAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate({ to: "/dashboard/outdoor/reception/invoices/list" })}
                >
                  <ArrowLeft className="size-4" />
                  Back to List
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      form.reset();
                      setSelectedTests([]);
                      setDeptDiscounts({});
                      setDeptPayments({});
                      setValue("sample_collection_rooms", []);
                    }}
                  >
                    Clear Form
                  </Button>
                  <Button
                    type="submit"
                    disabled={totalCharge === 0 || isCreating}
                  >
                    <CircleCheck className="size-4" />
                    {isCreating ? "Creating..." : "Create Invoice"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
