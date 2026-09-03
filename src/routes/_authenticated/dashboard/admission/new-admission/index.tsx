import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ArrowLeft,
    CircleCheck,
    User,
    Activity,
    Loader2,
    Stethoscope,
    Check,
    ChevronDown,
    Bed,
    CalendarIcon,
    ClipboardList,
    X,
    LayoutGrid,
    Search,
    AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useState, useEffect, useRef, useMemo } from "react";
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

import { Calendar } from "@/components/ui/calendar";
import { useDateFormat } from "@/hooks/use-date-format";
import { useDateControls } from "@/hooks/use-date-controls";
import { useCurrency } from "@/hooks/use-currency";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AppHeader } from '@/components/layout/app-header';
import { Main } from '@/components/layout/main';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { CountrySelect, LocationSelect, type LocationOption } from "@/components/location-select";

export const Route = createFileRoute('/_authenticated/dashboard/admission/new-admission/')({
    component: IndoorNewAdmission,
})

const admissionSchema = z.object({
    patientName: z.string().min(1, "Patient name is required"),
    fatherName: z.string().min(1, "Father name is required"),
    ageYears: z.string().optional(),
    ageMonths: z.string().optional(),
    gender: z.string().min(1, "Gender is required"),
    patientType: z.string().min(1, "Patient type is required"),
    mobile_number: z.string().min(11, "Phone number required"),
    idCardNumber: z.string().optional(),
    address: z.string().min(1, "Address required"),
    // Structured global address — denormalized names, all optional
    country: z.string().optional(),
    division: z.string().optional(),
    district: z.string().optional(),
    village: z.string().optional(),
    underConsultant: z.string().optional(),
    referredBy: z.string().optional(),
    admissionDate: z.string().min(1, "Admission date required"),
    admissionTime: z.string().min(1, "Admission time required"),
    ward: z.string().optional(),
    bedNumber: z.string().min(1, "Bed number required"),
    reason: z.string().min(1, "Reason required"),
}).refine((data) => {
    const hasYears = data.ageYears && data.ageYears.trim() !== "";
    const hasMonths = data.ageMonths && data.ageMonths.trim() !== "";
    return hasYears || hasMonths;
}, {
    message: "Either Age in Years or Months is required",
    path: ["ageYears"],
});

// Patient Type Select Component with Search
// Shared form-control styling — one height (h-10) and one look across every
// input, select, combobox and date field so the form reads clean and professional.
const FIELD_BASE =
    "h-10 rounded-md border border-input bg-transparent text-sm shadow-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring";
const FIELD_TEXTAREA =
    "rounded-md border border-input bg-transparent text-sm shadow-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring resize-none";

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
                            "w-full justify-between", FIELD_BASE,
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
                                        value={`${type.name} ${type.description || ''} ${type.id}`.toLowerCase()}
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

// Doctor Select Component with Search
interface DoctorSelectProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder: string;
    disabled?: boolean;
}

function DoctorSelect({
    value,
    onChange,
    label: _label,
    placeholder,
    disabled = false
}: DoctorSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchVal, setSearchVal] = useState("");
    const debouncedSearchVal = useDebounce(searchVal, 400);
    const token = getCookie('accessToken');

    // Fetch doctors based on the debounced search term from user input
    const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
        queryKey: ['doctors-select-list', debouncedSearchVal],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/doctor?limit=50&is_active=true&search=${encodeURIComponent(debouncedSearchVal)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch doctors");
            return res.json();
        },
        enabled: !!token,
        staleTime: 60 * 1000, // Cache for 1 minute
    });

    const doctors = doctorsData?.data?.items || [];

    // Fetch the specific selected doctor details if it's not present in the current query's doctors list
    const { data: selectedDoctorData, isLoading: selectedDoctorLoading } = useQuery({
        queryKey: ['doctor-detail', value],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/doctor/${value}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch doctor detail");
            const result = await res.json();
            return result.data;
        },
        enabled: !!value && !!token && !doctors.some((d: any) => String(d.id) === value),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const selectedDoctor = doctors.find((d: any) => String(d.id) === value) || selectedDoctorData;
    const loading = doctorsLoading || selectedDoctorLoading;

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            setSearchVal("");
        }
    };

    const filteredDoctors = doctors.filter((doctor: any) => {
        const term = searchVal.toLowerCase().trim();
        if (!term) return true;
        return (
            doctor.doctor_name?.toLowerCase().includes(term) ||
            doctor.qualification?.toLowerCase().includes(term) ||
            doctor.speciality?.toLowerCase().includes(term)
        );
    });

    const displayedDoctors = [...filteredDoctors.slice(0, 50)];
    if (selectedDoctor && !displayedDoctors.some((d: any) => String(d.id) === String(selectedDoctor.id))) {
        displayedDoctors.push(selectedDoctor);
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                            "w-full justify-between", FIELD_BASE,
                            !value && "text-muted-foreground"
                        )}
                        disabled={disabled || loading}
                    >
                        {selectedDoctor ? (
                            <div className="flex flex-col items-start text-left">
                                <span className="font-medium">
                                    Dr. {selectedDoctor.doctor_name}
                                    {(selectedDoctor.qualification || selectedDoctor.title) && ` (${selectedDoctor.qualification || selectedDoctor.title})`}
                                </span>
                                {selectedDoctor.speciality && (
                                    <span className="text-xs text-muted-foreground animate-none">
                                        {selectedDoctor.speciality}
                                    </span>
                                )}
                            </div>
                        ) : (
                            placeholder
                        )}
                        {loading ? (
                            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                        ) : value ? (
                            <div
                                role="button"
                                tabIndex={0}
                                className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange("");
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onChange("");
                                    }
                                }}
                            >
                                <X className="h-3.5 w-3.5" />
                            </div>
                        ) : (
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search doctor by name, qualification, or specialty..."
                        value={searchVal}
                        onValueChange={setSearchVal}
                    />
                    <CommandList>
                        {value && (
                            <CommandGroup heading="Actions">
                                <CommandItem
                                    value="clear-selection"
                                    onSelect={() => {
                                        onChange("");
                                        setOpen(false);
                                    }}
                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium cursor-pointer flex items-center"
                                >
                                    <X className="mr-2 h-4 w-4 text-red-500" />
                                    Clear Selection
                                </CommandItem>
                            </CommandGroup>
                        )}
                        {displayedDoctors.length === 0 && (
                            <CommandEmpty>
                                {loading ? "Loading doctors..." : "No doctor found."}
                            </CommandEmpty>
                        )}
                        <CommandGroup heading={value ? "Doctors" : undefined}>
                            {displayedDoctors.map((doctor: any) => {
                                const displayName = `Dr. ${doctor.doctor_name}`;
                                const subtitle = [
                                    doctor.qualification || doctor.title,
                                    doctor.speciality
                                ].filter(Boolean).join(" - ");

                                return (
                                    <CommandItem
                                        key={doctor.id}
                                        value={`${doctor.doctor_name} ${doctor.qualification || ''} ${doctor.speciality || ''} ${doctor.id}`.toLowerCase()}
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
    const { currencySymbol, format } = useCurrency();
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
                            "w-full justify-between", FIELD_BASE,
                            !value && "text-muted-foreground"
                        )}
                        disabled={disabled || loading}
                    >
                        {selectedBed ? (
                            <div className="flex flex-col items-start text-left">
                                <span className="font-medium">{selectedBed.code}</span>
                                <span className="text-xs text-muted-foreground">
                                    {selectedBed.type} - {selectedBed.ward} ({format(selectedBed.price)})
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
                                const subtitle = `${bed.type} - ${bed.ward} - ${format(bed.price)}`;

                                return (
                                    <CommandItem
                                        key={bed.id}
                                        value={`${bed.code} ${bed.type} ${bed.ward} ${bed.price} ${bed.id}`.toLowerCase()}
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
                                                <span className="text-sm font-semibold text-blue-600">{format(bed.price)}</span>
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

function IndoorNewAdmission() {
    const navigate = useNavigate();
    const token = getCookie('accessToken');
    const queryClient = useQueryClient();
    const { format } = useCurrency();

    // Tenant date format from settings
    const { dateFormat, formatHint, formatDate, parseDate, toISODate } = useDateFormat();
    const dateTouchedRef = useRef(false);

    // Admission date/time editability from Settings → Date Controls.
    const { isChangeable } = useDateControls();
    const admissionDateChangeable = isChangeable('indoor_admission_date_changeable');

    const [isBoardOpen, setIsBoardOpen] = useState(false);
    const [boardFilter, setBoardFilter] = useState<'all' | 'free' | 'booked' | 'maintenance'>('all');
    const [boardSearch, setBoardSearch] = useState('');
    const [boardPage, setBoardPage] = useState(1);
    const boardLimit = 10;

    useEffect(() => {
        setBoardPage(1);
    }, [boardFilter, boardSearch]);

    // Fetch ALL beds/cabins (including occupied and maintenance ones) for the Bed Status Board modal
    const { data: allBedsData, isLoading: allBedsLoading } = useQuery({
        queryKey: ['all-beds-cabins-board'],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bed-cabin?limit=200`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) return { data: { items: [] } };
            return res.json();
        },
        enabled: !!token && isBoardOpen, // Fetch only when modal is open to save API requests
        staleTime: 10 * 1000, // Cache for 10 seconds
    });

    const allBeds = allBedsData?.data?.items || [];

    const filteredBoardBeds = useMemo(() => {
        return allBeds.filter((bed: any) => {
            // 1. Filter by status tab
            const statusKey = String(bed.status || 'Available').toLowerCase().trim();
            const isFree = statusKey === 'available' || statusKey === 'free';
            const isBooked = statusKey === 'occupied' || statusKey === 'booked';
            if (boardFilter === 'free' && !isFree) return false;
            if (boardFilter === 'booked' && !isBooked) return false;
            if (boardFilter === 'maintenance' && statusKey !== 'maintenance') return false;

            // 2. Filter by search (code, ward, or type)
            if (boardSearch.trim() !== '') {
                const searchLower = boardSearch.toLowerCase().trim();
                const codeMatch = bed.code?.toLowerCase().includes(searchLower);
                const wardMatch = bed.ward?.toLowerCase().includes(searchLower);
                const typeMatch = bed.type?.toLowerCase().includes(searchLower);
                return codeMatch || wardMatch || typeMatch;
            }

            return true;
        });
    }, [allBeds, boardFilter, boardSearch]);

    const paginatedBoardBeds = useMemo(() => {
        const startIndex = (boardPage - 1) * boardLimit;
        return filteredBoardBeds.slice(startIndex, startIndex + boardLimit);
    }, [filteredBoardBeds, boardPage]);

    const totalBoardPages = Math.ceil(filteredBoardBeds.length / boardLimit);

    // Fetch patient types
    const { data: patientTypesData, isLoading: patientTypesLoading } = useQuery({
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
        staleTime: 10 * 60 * 1000,
    });

    const patientTypes = patientTypesData?.data?.items || [];

    // Fetch beds/cabins - only available ones for new admission
    const { data: bedsData, isLoading: bedsLoading } = useQuery({
        queryKey: ['beds-cabins-available-for-admission'],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bed-cabin?limit=500&status=Active&available_only=true`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) return { data: { items: [] } };
            return res.json();
        },
        enabled: !!token,
        staleTime: 30 * 1000, // Cache for 30 seconds
    });

    const beds = bedsData?.data?.items || [];

    const form = useForm({
        resolver: zodResolver(admissionSchema),
        defaultValues: {
            patientName: "",
            fatherName: "",
            ageYears: "",
            ageMonths: "",
            gender: "",
            patientType: "",
            mobile_number: "",
            idCardNumber: "",
            address: "",
            country: "Bangladesh",
            division: "",
            district: "",
            village: "",
            underConsultant: "",
            referredBy: "",
            admissionDate: formatDate(new Date()),
            admissionTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            ward: "",
            bedNumber: "",
            reason: "",
        },
    });

    // ── Structured address cascade ──────────────────────────────────────
    // The form stores denormalized NAME strings; these ids only drive the
    // child LocationSelect queries. Country defaults to Bangladesh once the
    // master list loads (shares the CountrySelect cache — no extra fetch).
    const [countryId, setCountryId] = useState<string | null>(null);
    const [divisionId, setDivisionId] = useState<string | null>(null);

    const { data: countriesData } = useQuery({
        queryKey: ['address-countries'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/address-location/countries?limit=500`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch countries');
            return res.json();
        },
        enabled: !!token,
        staleTime: 24 * 60 * 60 * 1000,
    });

    useEffect(() => {
        const items = countriesData?.data?.items || [];
        if (!items.length || countryId) return;
        const current = form.getValues('country');
        const row = current
            ? items.find((c: any) => c.name === current)
            : items.find((c: any) => c.iso2 === 'BD');
        if (row) {
            setCountryId(String(row.id));
            if (!current) form.setValue('country', row.name);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countriesData]);

    const handleCountryChange = (row: LocationOption | null) => {
        setCountryId(row ? String(row.id) : null);
        form.setValue('country', row?.name || '');
        setDivisionId(null);
        form.setValue('division', '');
        form.setValue('district', '');
    };

    const handleDivisionChange = (row: LocationOption | null) => {
        setDivisionId(row ? String(row.id) : null);
        form.setValue('division', row?.name || '');
        form.setValue('district', '');
    };

    const handleDistrictChange = (row: LocationOption | null) => {
        form.setValue('district', row?.name || '');
    };

    // Re-format admissionDate once settings are loaded
    useEffect(() => {
        if (dateTouchedRef.current) return;
        form.setValue("admissionDate", formatDate(new Date()), { shouldValidate: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFormat]);

    // When admission date/time is not changeable, lock both to now.
    useEffect(() => {
        if (!admissionDateChangeable) {
            const now = new Date();
            form.setValue("admissionDate", formatDate(now), { shouldValidate: true });
            form.setValue("admissionTime", now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), { shouldValidate: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [admissionDateChangeable, dateFormat]);

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
                    patient_type: patientTypes.find((t: any) => String(t.id) === values.patientType)?.name || null,
                    father_name: values.fatherName || null,
                    address: values.address || null,
                    country: values.country || null,
                    division: values.division || null,
                    district: values.district || null,
                    village: values.village || null,
                    age: Number(values.ageYears) || 0,
                    age_unit: 'Y',
                    age_text: `${values.ageYears || 0}Y ${values.ageMonths || 0}M`,
                    sex: values.gender,
                    phone: values.mobile_number,
                    admission_date: toISODate(parseDate(values.admissionDate) || new Date()),
                    admission_time: values.admissionTime,
                    bed_cabin_id: parseInt(values.bedNumber),
                    doctor_id: values.underConsultant ? parseInt(values.underConsultant) : null,
                    referred_by_doctor_id: values.referredBy ? parseInt(values.referredBy) : null,
                    diagnosis: values.reason,
                    status: 'active',
                    id_card_number: values.idCardNumber || null,
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
            // refetchType: 'all' is required because the patients list isn't mounted
            // yet at this point (we're about to navigate to it), and the global
            // refetchOnMount: false setting means a plain invalidate would leave it
            // showing stale cached data once it mounts.
            queryClient.invalidateQueries({ queryKey: ['admissions'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['admission-statistics'], refetchType: 'all' });
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
        <div className="flex flex-col min-h-screen">
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
                                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 border-b py-1.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-white">Patient Identity</CardTitle>
                                            <p className="text-xs text-blue-100">Personal details and identification</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6 py-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                                        <FormField
                                            control={form.control}
                                            name="patientName"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Patient Name <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Full name" className={FIELD_BASE} {...field} />
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
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Father / Husband Name <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Guardian name" className={FIELD_BASE} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ageYears"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Age <span className="text-destructive">*</span></FormLabel>
                                                    <div className="flex gap-2 items-center">
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                placeholder="0"
                                                                className={cn(FIELD_BASE, "w-24")}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <span className="text-xs text-muted-foreground">Yr</span>
                                                        <FormField
                                                            control={form.control}
                                                            name="ageMonths"
                                                            render={({ field }) => (
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max="11"
                                                                        placeholder="0"
                                                                        className={cn(FIELD_BASE, "w-24")}
                                                                        {...field}
                                                                    />
                                                                </FormControl>
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
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="gender"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Gender <span className="text-destructive">*</span></FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className={cn("w-full", FIELD_BASE)}>
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
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Patient Type <span className="text-destructive">*</span></FormLabel>
                                                    <PatientTypeSelect
                                                        patientTypes={patientTypes}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        label="Patient Type"
                                                        placeholder="Select patient type"
                                                        disabled={false}
                                                        loading={patientTypesLoading}
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
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mobile Number <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input placeholder="017XXX..." className={cn(FIELD_BASE, "pl-10")} {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="idCardNumber"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">ID Card Number (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="NID, Passport or Birth Cert" className={FIELD_BASE} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Structured address (global master) */}
                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <FormField
                                            control={form.control}
                                            name="country"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Countries</FormLabel>
                                                    <FormControl>
                                                        <CountrySelect
                                                            value={field.value || ""}
                                                            onChange={handleCountryChange}
                                                            placeholder="Select country"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="division"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Division / State / Regions</FormLabel>
                                                    <FormControl>
                                                        <LocationSelect
                                                            level="division"
                                                            countryId={countryId}
                                                            value={field.value || ""}
                                                            onChange={handleDivisionChange}
                                                            placeholder="Select division / state / region"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="district"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">District / Cities / Area</FormLabel>
                                                    <FormControl>
                                                        <LocationSelect
                                                            level="district"
                                                            parentId={divisionId}
                                                            value={field.value || ""}
                                                            onChange={handleDistrictChange}
                                                            placeholder="Select district / city / area"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="village"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Village / House</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Village, house no, street..." className={FIELD_BASE} {...field} />
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
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detailed Address <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter complete residential address"
                                                            className={cn(FIELD_TEXTAREA, "min-h-[80px]")}
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
                                <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 border-b py-1.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <Stethoscope className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-white">Clinical Assignment</CardTitle>
                                            <p className="text-xs text-purple-100">Medical supervisors and referrals</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6 py-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                        {[
                                            { name: "underConsultant", label: "Under Consultant", placeholder: "Select consultant" },
                                            { name: "referredBy", label: "Referred By", placeholder: "Select referrer" },
                                        ].map((fieldInfo) => (
                                            <FormField
                                                key={fieldInfo.name}
                                                control={form.control}
                                                name={fieldInfo.name as any}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col gap-2">
                                                        <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">{fieldInfo.label}</FormLabel>
                                                        <DoctorSelect
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            label={fieldInfo.label}
                                                            placeholder={fieldInfo.placeholder}
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
                                <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 border-b py-1.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <Bed className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-white">Admission Logistics</CardTitle>
                                            <p className="text-xs text-teal-100">Stay details and room allocation</p>
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
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        Admission Date <span className="text-destructive">*</span> <span className="text-xs font-normal text-muted-foreground">({formatHint})</span>
                                                    </FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild disabled={!admissionDateChangeable}>
                                                            <FormControl>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    disabled={!admissionDateChangeable}
                                                                    className={cn(
                                                                        FIELD_BASE, "justify-start text-left font-normal",
                                                                        !field.value && "text-muted-foreground",
                                                                        !admissionDateChangeable && "disabled:opacity-100 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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
                                            name="admissionTime"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Admission Time <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="time"
                                                            disabled={!admissionDateChangeable}
                                                            className={cn(
                                                                FIELD_BASE,
                                                                !admissionDateChangeable && "disabled:opacity-100 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                                            )}
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
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bed / Cabin Allocation <span className="text-destructive">*</span></FormLabel>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <BedSelect
                                                                beds={beds}
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                label="Bed / Cabin Allocation"
                                                                placeholder="Select bed or cabin"
                                                                disabled={false}
                                                                loading={bedsLoading}
                                                            />
                                                        </div>
                                                        <Dialog open={isBoardOpen} onOpenChange={setIsBoardOpen}>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="h-11 w-11 p-0 rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center shrink-0"
                                                                    title="Quick view of beds & cabins"
                                                                >
                                                                    <LayoutGrid className="h-4 w-4 text-blue-500" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[850px] max-w-[850px] w-[95vw] sm:w-full max-h-[85vh] overflow-y-auto p-6 rounded-2xl">
                                                                <DialogHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                                                        <Bed className="h-5 w-5 text-blue-500" />
                                                                        <span>Bed & Cabin Quick View</span>
                                                                    </DialogTitle>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        Real-time occupancy status. Select an available bed to assign it to the patient.
                                                                    </p>
                                                                </DialogHeader>

                                                                {/* Search & Filters */}
                                                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between my-5">
                                                                    <div className="relative w-full sm:flex-1">
                                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                        <Input
                                                                            placeholder="Search by code, ward, or type..."
                                                                            value={boardSearch}
                                                                            onChange={(e) => setBoardSearch(e.target.value)}
                                                                            className="pl-9 h-10 w-full rounded-xl"
                                                                        />
                                                                    </div>
                                                                    <div className="w-full sm:w-56">
                                                                        <Select
                                                                            value={boardFilter}
                                                                            onValueChange={(val: any) => setBoardFilter(val)}
                                                                        >
                                                                            <SelectTrigger className="w-full h-10 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 font-medium text-sm">
                                                                                <SelectValue placeholder="Filter by status" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="all">All Beds</SelectItem>
                                                                                <SelectItem value="free">Available (Free)</SelectItem>
                                                                                <SelectItem value="booked">Occupied (Booked)</SelectItem>
                                                                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>

                                                                {/* Grid Layout of Beds */}
                                                                {allBedsLoading ? (
                                                                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                                                                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                                                        <span className="text-sm font-medium text-muted-foreground">Loading quick view...</span>
                                                                    </div>
                                                                ) : filteredBoardBeds.length === 0 ? (
                                                                    <div className="text-center py-16 border-2 border-dashed rounded-2xl border-gray-200 dark:border-gray-800 w-full">
                                                                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                                        <p className="text-sm font-semibold text-muted-foreground">No beds match your filter/search criteria.</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-4">
                                                                        <div className="overflow-x-auto rounded-xl border border-gray-150 dark:border-gray-800 w-full">
                                                                            <table className="w-full text-sm text-left border-collapse">
                                                                                <thead className="bg-gray-50/70 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold border-b border-gray-150 dark:border-gray-800">
                                                                                    <tr>
                                                                                        <th className="px-4 py-3">Bed / Cabin Code</th>
                                                                                        <th className="px-4 py-3">Type</th>
                                                                                        <th className="px-4 py-3">Ward / Department</th>
                                                                                        <th className="px-4 py-3">Price / Day</th>
                                                                                        <th className="px-4 py-3">Status</th>
                                                                                        <th className="px-4 py-3 text-right">Action</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                                                                    {paginatedBoardBeds.map((bed: any) => {
                                                                                        const statusKey = String(bed.status || 'Available').toLowerCase().trim();
                                                                                        const isAvailable = statusKey === 'available' || statusKey === 'free';
                                                                                        const isOccupied = statusKey === 'occupied' || statusKey === 'booked';
                                                                                        const isMaintenance = statusKey === 'maintenance';

                                                                                        return (
                                                                                            <tr
                                                                                                key={bed.id}
                                                                                                className={cn(
                                                                                                    "hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors",
                                                                                                    isAvailable && "bg-green-50/5 dark:bg-green-950/2",
                                                                                                    isOccupied && "bg-red-50/5 dark:bg-red-950/2",
                                                                                                    isMaintenance && "bg-amber-50/5 dark:bg-amber-950/2"
                                                                                                )}
                                                                                            >
                                                                                                <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white">{bed.code}</td>
                                                                                                <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 font-medium">{bed.type}</td>
                                                                                                <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 font-medium">{bed.ward}</td>
                                                                                                <td className="px-4 py-3.5 font-semibold text-blue-600 dark:text-blue-400">{format(bed.price)}</td>
                                                                                                <td className="px-4 py-3.5">
                                                                                                    <span className={cn(
                                                                                                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                                                                                        isAvailable && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800",
                                                                                                        isOccupied && "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
                                                                                                        isMaintenance && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                                                                                                    )}>
                                                                                                        {isAvailable ? 'Free' : isOccupied ? 'Booked' : 'Maintenance'}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className="px-4 py-3.5 text-right">
                                                                                                    <Button
                                                                                                        type="button"
                                                                                                        size="sm"
                                                                                                        variant={isAvailable ? "default" : "outline"}
                                                                                                        className={cn(
                                                                                                            "h-8 rounded-lg text-xs font-bold px-3 transition-all",
                                                                                                            isAvailable
                                                                                                                ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-600"
                                                                                                                : "opacity-60 pointer-events-none"
                                                                                                        )}
                                                                                                        disabled={!isAvailable}
                                                                                                        onClick={() => {
                                                                                                            field.onChange(String(bed.id));
                                                                                                            setIsBoardOpen(false);
                                                                                                        }}
                                                                                                    >
                                                                                                        {isAvailable ? 'Select' : isOccupied ? 'Booked' : 'Maintenance'}
                                                                                                    </Button>
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>

                                                                        {/* Pagination Controls */}
                                                                        <div className="flex items-center justify-between border-t border-gray-150 dark:border-gray-800 pt-4 px-1">
                                                                            <div className="text-xs text-muted-foreground font-semibold">
                                                                                Showing {filteredBoardBeds.length === 0 ? 0 : (boardPage - 1) * boardLimit + 1} to {Math.min(filteredBoardBeds.length, boardPage * boardLimit)} of {filteredBoardBeds.length} beds
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="h-8 rounded-lg text-xs font-bold"
                                                                                    onClick={() => setBoardPage(p => Math.max(1, p - 1))}
                                                                                    disabled={boardPage === 1}
                                                                                >
                                                                                    Previous
                                                                                </Button>
                                                                                <span className="text-xs font-semibold px-2 text-gray-700 dark:text-gray-300">
                                                                                    Page {boardPage} of {totalBoardPages || 1}
                                                                                </span>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="h-8 rounded-lg text-xs font-bold"
                                                                                    onClick={() => setBoardPage(p => Math.min(totalBoardPages, p + 1))}
                                                                                    disabled={boardPage === totalBoardPages || totalBoardPages === 0}
                                                                                >
                                                                                    Next
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 4: Admission Reason */}
                            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                                <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 border-b py-1.5 px-4 gap-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <ClipboardList className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-white">Admission Reason</CardTitle>
                                            <p className="text-xs text-amber-100">Clinical notes and reason for admission</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6 py-6">
                                    <FormField
                                        control={form.control}
                                        name="reason"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col gap-2">
                                                <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chief Complaint / Reason <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe the clinical reason for patient admission..."
                                                        className={cn(FIELD_TEXTAREA, "min-h-[110px]")}
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

                            {/* Action Buttons at Bottom */}
                            <div className="flex items-center justify-end gap-3 pt-4 pb-10">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl border-gray-200"
                                    onClick={() => navigate({ to: '/dashboard/admission/patients' })}
                                    disabled={createMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="min-w-[150px]"
                                >
                                    {createMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <CircleCheck className="h-4 w-4 mr-2" />
                                    )}
                                    {createMutation.isPending ? "Submitting..." : "Admit Patient"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </Main>
        </div>
    );
}
