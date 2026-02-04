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
import { ArrowLeft, CircleCheck, Building2, Mail, Phone, MapPin, Award, User } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Main } from "@/components/layout/main";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";

const doctorSchema = z.object({
    doctor_name: z.string().min(1, { message: "Required" }),
    title: z.string().min(1, { message: "Required" }),
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

export default function CreateDoctorPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const token = getCookie('accessToken');

    const form = useForm<DoctorValues>({
        resolver: zodResolver(doctorSchema),
        defaultValues: {
            doctor_name: "",
            title: "",
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

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: DoctorValues) => {
            // Convert arrays back to comma-separated strings for API
            const apiData = {
                ...data,
                qualification: data.qualification.join(', '),
                speciality: data.speciality.join(', '),
            };

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/doctor`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(apiData),
                }
            );
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || "Failed to create doctor");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Doctor created successfully");
            queryClient.invalidateQueries({ queryKey: ["doctor"] });
            navigate({ to: "/outdoor/master/doctors" });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create doctor");
        },
    });

    const onSubmit = (data: DoctorValues) => {
        createMutation.mutate(data);
    };

    return (
        <>
            <Header>
                <Search />
                <div className="ms-auto flex items-center space-x-4">
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
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic">
                                Registration
                            </h1>
                            <p className="text-muted-foreground mt-2">Create a new profile for a medical professional</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="h-11 px-6 rounded-xl border-gray-200 dark:border-zinc-700 bg-white hover:bg-gray-50 shadow-sm"
                                onClick={() => navigate({ to: "/outdoor/master/doctors" })}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Discard
                            </Button>
                            <Button
                                type="submit"
                                form="create-doctor-form"
                                disabled={createMutation.isPending}
                                className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
                            >
                                {createMutation.isPending ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                ) : (
                                    <CircleCheck className="h-4 w-4 mr-2" />
                                )}
                                <span>{createMutation.isPending ? "Registering..." : "Confirm Registration"}</span>
                            </Button>
                        </div>
                    </div>

                    <Form {...form}>
                        <form id="create-doctor-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Personal Info Group */}
                            <Card className="rounded-2xl border-none shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900 border-b pb-6">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-inner">
                                            <User className="h-5 w-5" />
                                        </div>
                                        Personal Information
                                    </CardTitle>
                                    <CardDescription>Basic identification and professional title</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="doctor_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 dark:text-gray-300 font-semibold">Doctor's Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Dr. John Smith" {...field} className="h-11 rounded-lg border-gray-200 focus-visible:ring-blue-500" />
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
                                                    <FormLabel className="text-gray-700 dark:text-gray-300 font-semibold">Professional Title</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Senior Consultant" {...field} className="h-11 rounded-lg border-gray-200 focus-visible:ring-blue-500" />
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
                                                    <FormLabel className="text-gray-700 dark:text-gray-300 font-semibold">Years of Experience</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="e.g. 10" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-11 rounded-lg border-gray-200 focus-visible:ring-blue-500" />
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
                                                    <FormLabel className="text-gray-700 dark:text-gray-300 font-semibold">Performance Score</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="0-100" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-11 rounded-lg border-gray-200 focus-visible:ring-blue-500" />
                                                    </FormControl>
                                                    <FormDescription>Internal ranking score (0-100)</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Expertise Group */}
                            <Card className="rounded-2xl border-none shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900 border-b pb-6">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 shadow-inner">
                                            <Award className="h-5 w-5" />
                                        </div>
                                        Expertise & Qualifications
                                    </CardTitle>
                                    <CardDescription>Educational background and medical specializations</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormField
                                            control={form.control}
                                            name="qualification"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 dark:text-gray-300 font-semibold">Qualifications</FormLabel>
                                                    <FormControl>
                                                        <TagInput
                                                            placeholder="Type qualification and press Enter..."
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            className="min-h-[44px] rounded-lg border-gray-200 focus-within:ring-teal-500/20 focus-within:border-teal-500"
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
                                                    <FormLabel className="text-gray-700 dark:text-gray-300 font-semibold">Specialities</FormLabel>
                                                    <FormControl>
                                                        <TagInput
                                                            placeholder="Type speciality and press Enter..."
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            className="min-h-[44px] rounded-lg border-gray-200 focus-within:ring-teal-500/20 focus-within:border-teal-500"
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
                            <Card className="rounded-2xl border-none shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900 border-b pb-6">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 shadow-inner">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        Contact & Location
                                    </CardTitle>
                                    <CardDescription>Communication details and clinic location</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2"><Mail className="h-3 w-3" /> Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="doctor@example.com" {...field} className="h-11 rounded-lg border-gray-200 focus-visible:ring-orange-500" />
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
                                                    <FormLabel className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2"><Phone className="h-3 w-3" /> Phone</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+880..." {...field} className="h-11 rounded-lg border-gray-200 focus-visible:ring-orange-500" />
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
                                                        <FormLabel className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2"><MapPin className="h-3 w-3" /> Country</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Bangladesh" {...field} className="h-11 rounded-lg border-gray-200 focus-visible:ring-orange-500" />
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
                                                        <FormLabel className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2"><MapPin className="h-3 w-3" /> City</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Dhaka" {...field} className="h-11 rounded-lg border-gray-200 focus-visible:ring-orange-500" />
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
