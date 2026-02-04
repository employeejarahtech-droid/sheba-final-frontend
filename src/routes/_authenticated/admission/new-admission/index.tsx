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
    CalendarIcon
} from "lucide-react";

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
import { Header } from '@/components/layout/header';
import { TopNav } from '@/components/layout/top-nav';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layout/main';
import { patientTypes, topNav } from '@/data/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export const Route = createFileRoute('/_authenticated/admission/new-admission/')({
    component: IndoorNewAdmission,
})

const admissionSchema = z.object({
    patientName: z.string().min(1, "Patient name is required"),
    fatherName: z.string().min(1, "Father name is required"),
    age: z.string().min(1, "Age is required"),
    gender: z.string().min(1, "Gender is required"),
    patientType: z.string().min(1, "Patient type is required"),
    mobile_number: z.string().min(11, "Phone number required"),
    address: z.string().min(1, "Address required"),
    underConsultant: z.string().min(1, "Doctor name required"),
    referredBy: z.string(),
    attendingDoctor: z.string(),
    admittedBy: z.string(),
    admissionDate: z.string().min(1, "Admission date required"),
    ward: z.string().optional(),
    bedNumber: z.string().min(1, "Bed number required"),
    reason: z.string().min(1, "Reason required"),
});



function IndoorNewAdmission() {
    const navigate = useNavigate();
    const form = useForm({
        resolver: zodResolver(admissionSchema),
        defaultValues: {
            patientName: "",
            fatherName: "",
            age: "",
            gender: "",
            patientType: "",
            mobile_number: "",
            address: "",
            underConsultant: "",
            referredBy: "",
            attendingDoctor: "",
            admittedBy: "",
            admissionDate: new Date().toISOString().split('T')[0],
            ward: "",
            bedNumber: "",
            reason: "",
        },
    });

    function onSubmit(values: z.infer<typeof admissionSchema>) {
        console.log("Admission Data:", values);
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-background">
            <Header>
                <TopNav links={topNav} />
                <div className='ms-auto flex items-center space-x-4'>
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="p-6 lg:p-10 w-full flex-1">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent uppercase">
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
                                onClick={() => navigate({ to: '..' })}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to List
                            </Button>
                            <Button
                                type="submit"
                                form="hospital-admission-form"
                                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 border-none px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] font-bold"
                            >
                                <CircleCheck className="h-4 w-4 mr-2" />
                                Admit Patient
                            </Button>
                        </div>
                    </div>

                    <Form {...form}>
                        <form id="hospital-admission-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Card 1: Patient Identity */}
                            <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl shadow-sm overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
                                <CardHeader className="p-0 border-b border-blue-100 dark:border-blue-900">
                                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 px-6 py-4 flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <User className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                Patient Identity
                                            </CardTitle>
                                            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                                Personal details and identification
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                                        <FormField
                                            control={form.control}
                                            name="patientName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Patient Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Full name" className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" {...field} />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="fatherName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Father / Husband Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Guardian name" className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" {...field} />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="age"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Age</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Years" className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" {...field} />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="gender"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Gender</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                                                    <SelectValue placeholder="Gender" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                                <SelectItem value="male">Male</SelectItem>
                                                                <SelectItem value="female">Female</SelectItem>
                                                                <SelectItem value="other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="patientType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Patient Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                            {patientTypes.map((type) => (
                                                                <SelectItem key={type.value} value={type.value}>
                                                                    {type.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="mobile_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Mobile Number</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                                                            <Input placeholder="017XXX..." className="h-10 pl-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="lg:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Detailed Address</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Enter complete residential address"
                                                                className="min-h-[80px] rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-none"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Clinical Assignment */}
                            <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl shadow-sm overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
                                <CardHeader className="p-0 border-b border-blue-100 dark:border-blue-900">
                                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 px-6 py-4 flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30">
                                            <Stethoscope className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                Clinical Assignment
                                            </CardTitle>
                                            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                                Assigning medical supervisors and referrals
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{fieldInfo.label}</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm">
                                                                    <SelectValue placeholder={fieldInfo.placeholder} />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                                <SelectItem value="dr-maksud">Dr. Maksudul Haque</SelectItem>
                                                                <SelectItem value="dr-mahmud">Dr. Mahmudul Haque</SelectItem>
                                                                <SelectItem value="dr-ahmed">Dr. Ahmed Shaikh</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 3: Admission Logistics */}
                            <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl shadow-sm overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
                                <CardHeader className="p-0 border-b border-blue-100 dark:border-blue-900">
                                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 px-6 py-4 flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-cyan-600 to-cyan-500 rounded-xl shadow-lg shadow-cyan-500/30">
                                            <Bed className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                Admission Logistics
                                            </CardTitle>
                                            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                                Stay details and room allocation
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <FormField
                                            control={form.control}
                                            name="admissionDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Admission Date</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                                                            <Input
                                                                type="date"
                                                                className="h-10 pl-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="bedNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Bed / Cabin Allocation</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                                                <SelectValue placeholder="Select bed number" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                            <SelectItem value="bed-100">Bed 100 (General Ward)</SelectItem>
                                                            <SelectItem value="bed-101">Bed 101 (General Ward)</SelectItem>
                                                            <SelectItem value="cabin-201">Cabin 201 (VIP)</SelectItem>
                                                            <SelectItem value="cabin-202">Cabin 202 (Executive)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 4: Admission Notes */}
                            <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl shadow-sm overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
                                <CardHeader className="p-0 border-b border-blue-100 dark:border-blue-900">
                                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 px-6 py-4 flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30">
                                            <ClipboardList className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                Admission Reason
                                            </CardTitle>
                                            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                                Clinical notes and reason for admission
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <FormField
                                        control={form.control}
                                        name="reason"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Chief Complaint / Reason</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe the clinical reason for patient admission..."
                                                        className="min-h-[120px] rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-[10px] mt-2 italic text-muted-foreground">
                                                    Ensure all critical symptoms and diagnosed conditions are mentioned here.
                                                </FormDescription>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Final Footer Actions */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10 border-t border-gray-100 dark:border-gray-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto px-10 h-14 text-lg rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all font-semibold"
                                    onClick={() => form.reset()}
                                >
                                    Reset Form
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto px-10 h-14 text-lg rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all font-semibold"
                                >
                                    Print Application
                                </Button>
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto px-12 h-14 text-lg rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 font-bold text-white shadow-xl shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/40 active:translate-y-0"
                                >
                                    <CircleCheck className="mr-2 h-6 w-6" />
                                    Confirm Admission
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </Main>
        </div>
    );
}
