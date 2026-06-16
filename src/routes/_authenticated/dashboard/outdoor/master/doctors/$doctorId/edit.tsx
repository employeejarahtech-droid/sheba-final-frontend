"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CircleCheck, User, Building2, Stethoscope, Mail, Phone, MapPin, Award } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Main } from "@/components/layout/main";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { TagInput } from "@/components/ui/tag-input";

export const Route = createFileRoute('/_authenticated/dashboard/outdoor/master/doctors/$doctorId/edit')({
    component: EditDoctorPage,
});

const doctorSchema = z.object({
    doctor_name: z.string().min(1, { message: "Required" }),
    title: z.string().min(1, { message: "Required" }),
    doctor_type_ids: z.array(z.number()).min(1, { message: "Select at least one type" }),
    qualification: z.array(z.string()).min(1, { message: "At least one qualification required" }),
    speciality: z.array(z.string()).min(1, { message: "At least one speciality required" }),
    country: z.string().min(1, { message: "Required" }),
    city: z.string().min(1, { message: "Required" }),
    phone: z.string().min(1, { message: "Required" }),
    mobile: z.string().optional(),
    email: z.string().email({ message: "Invalid email" }).optional().or(z.literal("")),
    experience: z.number().min(0, { message: "Experience must be at least 0" }),
    score: z.number().min(0, { message: "Score must be at least 0" }),
});

type DoctorValues = z.infer<typeof doctorSchema>;

function EditDoctorPage() {
    const { doctorId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    const form = useForm<DoctorValues>({
        resolver: zodResolver(doctorSchema),
        defaultValues: {
            doctor_name: "",
            title: "",
            doctor_type_ids: [],
            qualification: [],
            speciality: [],
            country: "",
            city: "",
            phone: "",
            mobile: "",
            email: "",
            experience: 0,
            score: 0,
        },
    });

    // Fetch doctor types
    const { data: doctorTypes = [], isLoading: isLoadingDoctorTypes, error: doctorTypesError } = useQuery({
        queryKey: ["doctor-types"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/doctor-type?limit=100`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch doctor types");
            const result = await res.json();
            return result.data?.items || result.data || [];
        },
        enabled: !!token,
    });

    // Fetch existing doctor data
    const { data: doctorData, isLoading, error } = useQuery({
        queryKey: ["doctor", doctorId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/doctor/${doctorId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch doctor");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!doctorId,
    });

    // Populate form when data is loaded
    useEffect(() => {
        if (!doctorData) return;

        // Parse doctor_type_ids from comma-separated string or use doctor_type_id
        let doctorTypeIds: number[] = [];
        if (doctorData.doctor_type_ids) {
            doctorTypeIds = doctorData.doctor_type_ids.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
        } else if (doctorData.doctor_type_id) {
            doctorTypeIds = [doctorData.doctor_type_id];
        }

        form.reset({
            doctor_name: doctorData.doctor_name || "",
            title: doctorData.title || "",
            doctor_type_ids: doctorTypeIds,
            qualification: doctorData.qualification ? doctorData.qualification.split(',').map((s: string) => s.trim()) : [],
            speciality: doctorData.speciality ? doctorData.speciality.split(',').map((s: string) => s.trim()) : [],
            country: doctorData.country || "",
            city: doctorData.city || "",
            phone: doctorData.phone || "",
            mobile: doctorData.mobile || "",
            email: doctorData.email || "",
            experience: Number(doctorData.experience) || 0,
            score: Number(doctorData.score) || 0,
        });
    }, [doctorData, form]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (data: DoctorValues) => {
            // Convert arrays back to comma-separated strings for API
            const apiData = {
                ...data,
                qualification: data.qualification.join(', '),
                speciality: data.speciality.join(', '),
                doctor_type_ids: data.doctor_type_ids,
            };

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/doctor/${doctorId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(apiData),
                }
            );
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || "Failed to update doctor");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["doctor"] });
            queryClient.invalidateQueries({ queryKey: ["doctor", doctorId] });
            toast.success("Doctor updated successfully");
            // No redirect - stay on the edit page
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update doctor");
        },
    });

    const onSubmit = (data: DoctorValues) => {
        updateMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black/20">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span className="ml-3 text-lg font-medium text-blue-600">Loading doctor data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center px-4">
                <div className="rounded-full bg-red-100 p-6 mb-6 shadow-lg shadow-red-100/50">
                    <Stethoscope className="h-12 w-12 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Error loading data</h3>
                <Button
                    variant="outline"
                    className="mt-6 h-12 px-6 rounded-xl border-2 hover:bg-gray-50"
                    onClick={() => navigate({ to: '/dashboard/outdoor/master/doctors' })}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to List
                </Button>
            </div>
        );
    }

    return (
        <>
            <Header fixed>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="p-6 lg:p-10 w-full flex-1 bg-gray-50/50 dark:bg-black/20">
                <div className="space-y-6 max-w-5xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Edit Profile
                            </h1>
                            <p className="text-muted-foreground mt-2">Update information for {doctorData.doctor_name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="h-11 px-6 rounded-xl border-gray-200 dark:border-zinc-700 bg-white hover:bg-gray-50"
                                onClick={() => navigate({ to: '/dashboard/outdoor/master/doctors' })}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="edit-doctor-form"
                                disabled={updateMutation.isPending}
                                className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
                            >
                                {updateMutation.isPending ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                ) : (
                                    <CircleCheck className="h-4 w-4" />
                                )}
                                <span>{updateMutation.isPending ? "Saving changes..." : "Save Changes"}</span>
                            </Button>
                        </div>
                    </div>

                    <Form {...form}>
                        <form id="edit-doctor-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Personal Info Group */}
                            <Card className="rounded-2xl border shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden pt-0">
                                <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900 border-b-1 py-4 gap-0">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                            <User className="h-5 w-5" />
                                        </div>
                                        Personal Information
                                    </CardTitle>
                                    <CardDescription>Basic identification and professional title</CardDescription>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="doctor_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 dark:text-gray-300">Doctor's Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Dr. John Smith" {...field} className="h-11 rounded-lg" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 dark:text-gray-300">Professional Title</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Senior Consultant" {...field} className="h-11 rounded-lg" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="experience"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 dark:text-gray-300">Years of Experience</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="e.g. 10"
                                                            value={field.value}
                                                            onChange={e => field.onChange(Number(e.target.value))}
                                                            className="h-11 rounded-lg"
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Total years of medical practice</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="score"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 dark:text-gray-300">Performance Score</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="0-100"
                                                            value={field.value}
                                                            onChange={e => field.onChange(Number(e.target.value))}
                                                            className="h-11 rounded-lg"
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Internal ranking score (0-100)</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Doctor Type Card */}
                            <Card className="rounded-2xl border shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden pt-0">
                                <CardHeader className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-zinc-900 border-b-1 py-4 gap-0">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                                            <User className="h-5 w-5" />
                                        </div>
                                        Doctor Type
                                    </CardTitle>
                                    <CardDescription>Select all applicable categories for this doctor</CardDescription>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6">
                                    <FormField
                                        control={form.control}
                                        name="doctor_type_ids"
                                        render={({ field }) => (
                                            <FormItem>
                                                {isLoadingDoctorTypes ? (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                                                        Loading doctor types...
                                                    </div>
                                                ) : doctorTypesError ? (
                                                    <div className="flex items-center gap-2 text-sm text-red-500 py-4">
                                                        Failed to load doctor types
                                                    </div>
                                                ) : doctorTypes.length === 0 ? (
                                                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground py-8">
                                                        <p>No doctor types available.</p>
                                                        <a
                                                            href="/dashboard/master/doctor-types"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline font-medium"
                                                        >
                                                            Create doctor types first →
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <FormControl>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {doctorTypes.map((type: any) => {
                                                                const isSelected = field.value?.includes(type.id);
                                                                // Assign colors based on type.id for consistent styling
                                                                const colorVariants = [
                                                                    { color: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700", checked: "bg-red-100 dark:bg-red-950/50 border-red-400 dark:border-red-600" },
                                                                    { color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700", checked: "bg-blue-100 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600" },
                                                                    { color: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700", checked: "bg-green-100 dark:bg-green-950/50 border-green-400 dark:border-green-600" },
                                                                    { color: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700", checked: "bg-purple-100 dark:bg-purple-950/50 border-purple-400 dark:border-purple-600" },
                                                                    { color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700", checked: "bg-amber-100 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600" },
                                                                    { color: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800 hover:border-cyan-300 dark:hover:border-cyan-700", checked: "bg-cyan-100 dark:bg-cyan-950/50 border-cyan-400 dark:border-cyan-600" },
                                                                ];
                                                                const variant = colorVariants[type.id % colorVariants.length];
                                                                return (
                                                                    <label
                                                                        key={type.id}
                                                                        className={`
                                                                            relative flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 group
                                                                            ${isSelected
                                                                                ? variant.checked + " shadow-md scale-[1.02]"
                                                                                : variant.color + " shadow-sm hover:shadow-md hover:scale-[1.01]"
                                                                            }
                                                                        `}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={(e) => {
                                                                                const checked = e.target.checked;
                                                                                const currentValues = field.value || [];
                                                                                const newValue = checked
                                                                                    ? [...currentValues, type.id]
                                                                                    : currentValues.filter((v) => v !== type.id);
                                                                                field.onChange(newValue);
                                                                            }}
                                                                            className="sr-only"
                                                                        />
                                                                        <div className={`
                                                                            w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0
                                                                            ${isSelected
                                                                                ? "border-current bg-current shadow-sm"
                                                                                : "border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 group-hover:border-current"
                                                                            }
                                                                        `}>
                                                                            {isSelected && (
                                                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l4 4 8-8" />
                                                                                </svg>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-3 flex-1">
                                                                            <span className="text-2xl">👨‍⚕️</span>
                                                                            <div className="flex flex-col">
                                                                                <span className="font-semibold text-base">{type.name}</span>
                                                                                {isSelected && (
                                                                                    <span className="text-xs font-medium opacity-70">Selected</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </FormControl>
                                                )}
                                                {field.value && field.value.length > 0 && (
                                                    <FormDescription className="text-sm mt-4">
                                                        {field.value.length} doctor type(s) selected
                                                    </FormDescription>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Expertise Group */}
                            <Card className="rounded-2xl border shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden pt-0">
                                <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900 border-b-1 py-4 gap-0">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                                            <Award className="h-5 w-5" />
                                        </div>
                                        Expertise & Qualifications
                                    </CardTitle>
                                    <CardDescription>Educational background and medical specializations</CardDescription>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormField
                                            control={form.control}
                                            name="qualification"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 dark:text-gray-300">Qualifications</FormLabel>
                                                    <FormControl>
                                                        <TagInput
                                                            placeholder="Type qualification and press Enter..."
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            className="min-h-[44px]"
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Add degrees like MBBS, FCPS, MD, etc.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="speciality"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 dark:text-gray-300">Specialities</FormLabel>
                                                    <FormControl>
                                                        <TagInput
                                                            placeholder="Type speciality and press Enter..."
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            className="min-h-[44px]"
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Areas of expertise like Cardiology, Neurology, etc.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contact Group */}
                            <Card className="rounded-2xl border shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden pt-0">
                                <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900 border-b-1 py-4 gap-0">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        Contact & Location
                                    </CardTitle>
                                    <CardDescription>Communication details and clinic location</CardDescription>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 dark:text-gray-300 flex items-center gap-2"><Mail className="h-3 w-3" /> Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="doctor@example.com" {...field} className="h-11 rounded-lg" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 dark:text-gray-300 flex items-center gap-2"><Phone className="h-3 w-3" /> Phone</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+880..." {...field} className="h-11 rounded-lg" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="country"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-gray-700 dark:text-gray-300 flex items-center gap-2"><MapPin className="h-3 w-3" /> Country</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Bangladesh" {...field} className="h-11 rounded-lg" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-gray-700 dark:text-gray-300 flex items-center gap-2"><MapPin className="h-3 w-3" /> City</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Dhaka" {...field} className="h-11 rounded-lg" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                        </form>
                    </Form>
                </div>
            </Main>
        </>
    );
}

export default EditDoctorPage;
