import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ArrowLeft,
    CircleCheck,
    User,
    Activity,
    Stethoscope,
    Bed,
    ClipboardList,
    Check,
    ChevronDown
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useState } from "react";
import { toast } from "sonner";

import {
    Form,
    FormField,
    FormItem,
    FormControl,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { AppHeader } from '@/components/layout/app-header';
;
;
;
;
import { Main } from '@/components/layout/main';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";


export const Route = createFileRoute('/_authenticated/dashboard/admission/new-admission/')({
    component: IndoorNewAdmission,
})

const admissionSchema = z.object({
    patientName: z.string().min(1, "Patient name is required"),
    fatherName: z.string().min(1, "Father name is required"),
    ageValue: z.string().min(1, "Age value is required"),
    ageUnit: z.enum(["Y", "M", "D"]),
    gender: z.string().min(1, "Gender is required"),
    patientType: z.string().min(1, "Patient type is required"),
    mobile_number: z.string().min(11, "Phone number required"),
    address: z.string().min(1, "Address required"),
    underConsultant: z.string().optional(),
    referredBy: z.string().optional(),
    attendingDoctor: z.string().optional(),
    admittedBy: z.string().optional(),
    admissionDate: z.string().min(1, "Admission date required"),
    admissionTime: z.string().min(1, "Admission time required"),
    ward: z.string().optional(),
    bedNumber: z.string().min(1, "Bed number required"),
    reason: z.string().min(1, "Reason required"),
});

// Doctor Select Component with Search
interface DoctorSelectProps {
    doctors: any[];
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder: string;
    disabled?: boolean;
    loading?: boolean;
}

function DoctorSelect({
    doctors,
    value,
    onChange,
    label: _label,
    placeholder,
    disabled = false,
    loading = false
}: DoctorSelectProps) {
    const [open, setOpen] = useState(false);

    const selectedDoctor = doctors.find((d: any) => String(d.id) === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                            "w-full justify-between h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm",
                            !value && "text-muted-foreground"
                        )}
                        disabled={disabled || loading}
                    >
                        {selectedDoctor ? (
                            <div className="flex flex-col items-start">
                                <span className="font-medium">
                                    Dr. {selectedDoctor.doctor_name}
                                    {selectedDoctor.qualification && ` (${selectedDoctor.qualification})`}
                                </span>
                                {selectedDoctor.speciality && (
                                    <span className="text-xs text-muted-foreground">
                                        {selectedDoctor.speciality}
                                    </span>
                                )}
                            </div>
                        ) : (
                            placeholder
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search doctor by name, qualification, or specialty..." />
                    <CommandList>
                        <CommandEmpty>
                            {loading ? "Loading doctors..." : "No doctor found."}
                        </CommandEmpty>
                        <CommandGroup>
                            {doctors.map((doctor: any) => {
                                const displayName = `Dr. ${doctor.doctor_name}`;
                                const subtitle = [
                                    doctor.qualification,
                                    doctor.speciality
                                ].filter(Boolean).join(" - ");

                                return (
                                    <CommandItem
                                        key={doctor.id}
                                        value={`${doctor.doctor_name} ${doctor.qualification || ''} ${doctor.speciality || ''} ${doctor.id}`}
                                        onSelect={() => {
                                            onChange(String(doctor.id));
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === String(doctor.id) ? "opacity-100" : "opacity-0"
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
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// Bed Select Component with Search
interface BedSelectProps {
    beds: any[];
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder: string;
    disabled?: boolean;
    loading?: boolean;
}

function BedSelect({
    beds,
    value,
    onChange,
    label: _label,
    placeholder,
    disabled = false,
    loading = false
}: BedSelectProps) {
    const [open, setOpen] = useState(false);

    const selectedBed = beds.find((b: any) => String(b.id) === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                            "w-full justify-between h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm",
                            !value && "text-muted-foreground"
                        )}
                        disabled={disabled || loading}
                    >
                        {selectedBed ? (
                            <div className="flex flex-col items-start">
                                <span className="font-medium">{selectedBed.code}</span>
                                <span className="text-xs text-muted-foreground">
                                    {selectedBed.type} - {selectedBed.ward} (৳{selectedBed.price})
                                </span>
                            </div>
                        ) : (
                            placeholder
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[450px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search by code, type, or ward..." />
                    <CommandList>
                        <CommandEmpty>
                            {loading ? "Loading beds..." : "No bed found."}
                        </CommandEmpty>
                        <CommandGroup>
                            {beds.map((bed: any) => {
                                const displayName = bed.code;
                                const subtitle = `${bed.type} - ${bed.ward} - ৳${bed.price}`;

                                return (
                                    <CommandItem
                                        key={bed.id}
                                        value={`${bed.code} ${bed.type} ${bed.ward} ${bed.price} ${bed.id}`}
                                        onSelect={() => {
                                            onChange(String(bed.id));
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === String(bed.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{displayName}</span>
                                                <span className="text-sm font-semibold text-blue-600">৳{bed.price}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {subtitle}
                                            </span>
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// Patient Type Select Component with Search
interface PatientTypeSelectProps {
    patientTypes: any[];
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder: string;
    disabled?: boolean;
    loading?: boolean;
}

function PatientTypeSelect({
    patientTypes,
    value,
    onChange,
    label: _label,
    placeholder,
    disabled = false,
    loading = false
}: PatientTypeSelectProps) {
    const [open, setOpen] = useState(false);

    const selectedType = patientTypes.find((t: any) => String(t.id) === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                            "w-full justify-between h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm",
                            !value && "text-muted-foreground"
                        )}
                        disabled={disabled || loading}
                    >
                        {selectedType ? (
                            <div className="flex flex-col items-start">
                                <span className="font-medium">{selectedType.name}</span>
                                {selectedType.description && (
                                    <span className="text-xs text-muted-foreground">
                                        {selectedType.description}
                                    </span>
                                )}
                            </div>
                        ) : (
                            placeholder
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search patient type..." />
                    <CommandList>
                        <CommandEmpty>
                            {loading ? "Loading patient types..." : "No patient type found."}
                        </CommandEmpty>
                        <CommandGroup>
                            {patientTypes.map((type: any) => {
                                const displayName = type.name;
                                const subtitle = type.description;

                                return (
                                    <CommandItem
                                        key={type.id}
                                        value={`${type.name} ${type.description || ''} ${type.id}`}
                                        onSelect={() => {
                                            onChange(String(type.id));
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === String(type.id) ? "opacity-100" : "opacity-0"
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
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function IndoorNewAdmission() {
    const navigate = useNavigate();
    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    // Fetch doctors list
    const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
        queryKey: ['doctors-list'],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/doctor?limit=1000`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch doctors");
            return res.json();
        },
        enabled: !!token,
    });

    const doctors = doctorsData?.data?.rows || doctorsData?.data?.items || [];

    // Fetch patient types
    const { data: patientTypesData } = useQuery({
        queryKey: ['patient-types'],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patient-type?limit=100`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) return { data: { items: [] } };
            return res.json();
        },
        enabled: !!token,
    });

    const patientTypes = patientTypesData?.data?.items || [];

    // Fetch beds/cabins - only available ones for new admission
    const { data: bedsData } = useQuery({
        queryKey: ['beds-cabins'],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bed-cabin?limit=100&status=Active&available_only=true`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) return { data: { items: [] } };
            return res.json();
        },
        enabled: !!token,
    });

    const beds = bedsData?.data?.items || [];

    const form = useForm({
        resolver: zodResolver(admissionSchema),
        defaultValues: {
            patientName: "",
            fatherName: "",
            ageValue: "",
            ageUnit: "Y",
            gender: "",
            patientType: "",
            mobile_number: "",
            address: "",
            underConsultant: "",
            referredBy: "",
            attendingDoctor: "",
            admittedBy: "",
            admissionDate: new Date().toISOString().split('T')[0],
            admissionTime: new Date().toTimeString().slice(0, 5),
            ward: "",
            bedNumber: "",
            reason: "",
        },
    });

    // Create admission mutation
    const createMutation = useMutation({
        mutationFn: async (values: z.infer<typeof admissionSchema>) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admission`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    patient_name: values.patientName,
                    age: parseInt(values.ageValue),
                    age_unit: values.ageUnit,
                    sex: values.gender,
                    phone: values.mobile_number,
                    admission_date: values.admissionDate,
                    admission_time: values.admissionTime,
                    bed_cabin_id: parseInt(values.bedNumber),
                    doctor_id: values.underConsultant ? parseInt(values.underConsultant) : null,
                    diagnosis: values.reason,
                    status: 'active',
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Admission API Error:', errorData);
                throw new Error(errorData.message || errorData.error || 'Failed to create admission');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Patient admitted successfully");
            queryClient.invalidateQueries({ queryKey: ['admissions'] });
            navigate({ to: '/dashboard/admission/patients' });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to admit patient');
        },
    });

    function onSubmit(values: z.infer<typeof admissionSchema>) {
        createMutation.mutate(values);
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-background">
            <AppHeader fixed />

            <Main className="p-6 lg:p-10 w-full flex-1">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
                        <div>
                            <h1 className="text-2xl font-black">
                                Indoor Patient Admission
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm font-medium">
                                Register and assign beds for new hospital admissions
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="hidden sm:flex items-center gap-2 rounded-xl border-gray-200"
                                onClick={() => navigate({ to: '/dashboard/admission/patients' })}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to List
                            </Button>
                            <Button
                                type="submit"
                                form="hospital-admission-form"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CircleCheck className="h-4 w-4" />
                                )}
                                {createMutation.isPending ? "Submitting..." : "Admit Patient"}
                            </Button>
                        </div>
                    </div>

                    <Form {...form}>
                        <form id="hospital-admission-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Card 1: Patient Identity */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Patient Identity</CardTitle>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Personal details and identification</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6 py-6">
                                    {/* Custom Admission ID - Auto-generated */}
                                    <div className="mb-5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3">
                                        <FormLabel className="text-sm font-semibold text-blue-700 dark:text-blue-300">Custom Admission ID</FormLabel>
                                        <Input
                                            placeholder="Auto-generated from settings (e.g., ADM-20260228-1)"
                                            disabled
                                            className="h-10 mt-1.5 rounded-md border-blue-300 dark:border-blue-900 bg-white dark:bg-gray-950 text-blue-800 dark:text-blue-200 font-semibold text-sm cursor-not-allowed"
                                        />
                                        <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                                            Auto-generated on creation, based on Settings → Prefix configuration
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                                        <FormField
                                            control={form.control}
                                            name="patientName"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Patient Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Full name" className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="fatherName"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Father / Husband Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Guardian name" className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ageValue"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Age</FormLabel>
                                                    <div className="flex gap-2">
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Value"
                                                                className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormField
                                                            control={form.control}
                                                            name="ageUnit"
                                                            render={({ field }) => (
                                                                <FormItem className="w-28">
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="w-full h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all">
                                                                                <SelectValue placeholder="Years" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                                            <SelectItem value="Y">Years</SelectItem>
                                                                            <SelectItem value="M">Months</SelectItem>
                                                                            <SelectItem value="D">Days</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="gender"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Gender</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all">
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                            <SelectItem value="male">Male</SelectItem>
                                                            <SelectItem value="female">Female</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="patientType"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Patient Type</FormLabel>
                                                    <PatientTypeSelect
                                                        patientTypes={patientTypes}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        label="Patient Type"
                                                        placeholder="Select patient type"
                                                        disabled={false}
                                                        loading={false}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="mobile_number"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mobile Number</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input placeholder="017XXX..." className="h-10 pl-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Address - full width */}
                                    <div className="mt-5">
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detailed Address</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter complete residential address"
                                                            className="min-h-[80px] rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all resize-none"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Clinical Assignment */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b py-1.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-lg">
                                            <Stethoscope className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Clinical Assignment</CardTitle>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Medical supervisors and referrals</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6 py-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                        {[
                                            { name: "underConsultant", label: "Under Consultant", placeholder: "Select consultant" },
                                            { name: "referredBy", label: "Referred By", placeholder: "Select referrer" },
                                            { name: "attendingDoctor", label: "Attending Doctor", placeholder: "Select attending doctor" },
                                            { name: "admittedBy", label: "Admitted By", placeholder: "Select admitting doctor" },
                                        ].map((fieldInfo) => (
                                            <FormField
                                                key={fieldInfo.name}
                                                control={form.control}
                                                name={fieldInfo.name as any}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col gap-2">
                                                        <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">{fieldInfo.label}</FormLabel>
                                                        <DoctorSelect
                                                            doctors={doctors}
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            label={fieldInfo.label}
                                                            placeholder={fieldInfo.placeholder}
                                                            disabled={doctorsLoading}
                                                            loading={doctorsLoading}
                                                        />
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 3: Admission Logistics */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-b py-1.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg shadow-lg">
                                            <Bed className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Admission Logistics</CardTitle>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Stay details and room allocation</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6 py-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
                                        <FormField
                                            control={form.control}
                                            name="admissionDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Admission Date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="admissionTime"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Admission Time</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="time"
                                                            className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="bedNumber"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bed / Cabin Allocation</FormLabel>
                                                    <BedSelect
                                                        beds={beds}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        label="Bed / Cabin Allocation"
                                                        placeholder="Select bed or cabin"
                                                        disabled={false}
                                                        loading={false}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 4: Admission Reason */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b py-1.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg">
                                            <ClipboardList className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">Admission Reason</CardTitle>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Clinical notes and reason for admission</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6 py-6">
                                    <FormField
                                        control={form.control}
                                        name="reason"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col gap-2">
                                                <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chief Complaint / Reason</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe the clinical reason for patient admission..."
                                                        className="min-h-[110px] rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-[11px] mt-1 italic text-muted-foreground">
                                                    Ensure all critical symptoms and diagnosed conditions are mentioned here.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </form>
                    </Form>
                </div>
            </Main>
        </div>
    );
}
