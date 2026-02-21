"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Stethoscope, Award, MapPin, Phone, Mail, User, Star, Calendar, Clock } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Main } from "@/components/layout/main";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute('/_authenticated/outdoor/master/doctors/$doctorId/')({
    component: ViewDoctorPage,
});

function ViewDoctorPage() {
    const { doctorId } = Route.useParams();
    const navigate = useNavigate();
    const token = getCookie('accessToken');

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

    if (isLoading) {
        return (
            <>
                <Header>
                    <Search />
                    <div className='ms-auto flex items-center space-x-4'>
                        <ThemeSwitch />
                        <ConfigDrawer />
                        <ProfileDropdown />
                    </div>
                </Header>
                <Main>
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full border-4 border-blue-500/30 border-t-blue-600 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Stethoscope className="h-6 w-6 text-blue-600 animate-pulse" />
                            </div>
                        </div>
                        <p className="mt-4 text-lg font-medium text-gray-500 animate-pulse">Loading profile...</p>
                    </div>
                </Main>
            </>
        );
    }

    if (error) {
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
                <Main>
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center px-4">
                        <div className="rounded-full bg-red-100 p-6 mb-6 shadow-lg shadow-red-100/50">
                            <Stethoscope className="h-12 w-12 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile Not Found</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            We couldn't load the doctor's details. This might be due to a connection issue or the ID doesn't exist.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-8 h-12 px-6 rounded-xl border-2 hover:bg-gray-50"
                            onClick={() => navigate({ to: "/outdoor/master/doctors" })}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Doctors List
                        </Button>
                    </div>
                </Main>
            </>
        );
    }

    // Generate initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

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

            <Main className=" w-full flex-1 bg-gray-50/50 dark:bg-black/20 p-6 lg:p-10">

                {/* Hero / Banner Section */}
                <div className="relative w-full max-w-6xl mx-auto mb-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl opacity-10 blur-3xl transform translate-y-4" />
                    <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />

                        <div className="relative p-8 lg:p-12 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">

                            {/* Avatar Section */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                                <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-800 shadow-xl relative text-4xl font-bold bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600">
                                    <AvatarFallback>{getInitials(doctorData.doctor_name)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 p-2 bg-green-500 border-4 border-white dark:border-zinc-800 rounded-full shadow-lg" />
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 px-3 py-1">
                                            {doctorData.speciality}
                                        </Badge>
                                        <div className="flex items-center text-yellow-500 text-sm font-semibold">
                                            <Star className="h-4 w-4 fill-current mr-1" />
                                            {doctorData.score || "New"}
                                        </div>
                                        {/* Doctor Type Badges */}
                                        {(() => {
                                            const types = typeof doctorData.doctor_type === 'string'
                                                ? doctorData.doctor_type.split(',').map((t: string) => t.trim())
                                                : (doctorData.doctor_type || []);

                                                    const typeConfig = {
                                                        "Surgeon": { icon: "🔪", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
                                                        "Consultant": { icon: "👨‍⚕️", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" },
                                                        "Assistant": { icon: "🤝", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
                                                        "Normal": { icon: "👤", color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" },
                                                        "Quak": { icon: "🌙", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" },
                                                    };

                                                    return types.slice(0, 2).map((type: string, idx: number) => {
                                                        const config = typeConfig[type as keyof typeof typeConfig] || typeConfig["Normal"];
                                                        return (
                                                            <Badge
                                                                key={idx}
                                                                className={`${config.color} px-3 py-1 text-xs font-semibold border-2`}
                                                            >
                                                                <span className="mr-1">{config.icon}</span>
                                                                {type}
                                                            </Badge>
                                                        );
                                                    });
                                                })()}
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        {doctorData.doctor_name}
                                    </h1>
                                    <p className="text-xl text-muted-foreground font-medium mt-1">
                                        {doctorData.title} • {doctorData.qualification}
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                                    <Button
                                        onClick={() => navigate({ to: "/outdoor/master/doctors" })}
                                        variant="outline"
                                        className="h-11 px-6 rounded-xl border-gray-200 dark:border-zinc-700 bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to List
                                    </Button>
                                    <Link to={`/outdoor/master/doctors/$doctorId/edit`} params={{ doctorId }}>
                                        <Button
                                            className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Profile
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Quick Details Grid */}
                            <div className="hidden lg:grid grid-cols-2 gap-4 w-72">
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{doctorData.score}</div>
                                    <div className="text-xs font-semibold uppercase text-muted-foreground mt-1">Score</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">12+</div>
                                    <div className="text-xs font-semibold uppercase text-muted-foreground mt-1">Years Exp.</div>
                                </div>
                                <div className="col-span-2 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                                    </div>
                                    <div className="text-sm font-medium">Available Today</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Contact Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="rounded-2xl border-none shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden h-full">
                            <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900 border-b pb-6">
                                <CardTitle className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        <User className="h-5 w-5" />
                                    </div>
                                    Contact Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    <div className="p-5 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email Address</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{doctorData.email || "Not provided"}</p>
                                        </div>
                                    </div>

                                    <div className="p-5 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20">
                                            <Phone className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone Number</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{doctorData.phone}</p>
                                            {doctorData.mobile && (
                                                <p className="text-xs text-muted-foreground mt-0.5">Mobile: {doctorData.mobile}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{doctorData.city}, {doctorData.country}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Professional Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-2xl border-none shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
                            <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900 border-b pb-6">
                                <CardTitle className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                                        <Award className="h-5 w-5" />
                                    </div>
                                    Professional Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider border-b pb-2">Credentials</h3>
                                        <ul className="space-y-4">
                                            <li className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/20" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">Title</p>
                                                    <p className="text-sm text-muted-foreground">{doctorData.title}</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/20" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">Qualification</p>
                                                    <p className="text-sm text-muted-foreground">{doctorData.qualification}</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider border-b pb-2">Specialization</h3>
                                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/20">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Stethoscope className="h-6 w-6 text-blue-600" />
                                                <h4 className="font-bold text-gray-900 dark:text-white">{doctorData.speciality}</h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Specialized in {doctorData.speciality}, providing expert care and consultation. Dr. {doctorData.doctor_name} is dedicated to patient well-being and maintaining high medical standards.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Doctor Type Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider border-b pb-2">Doctor Type</h3>
                                        <div className="bg-violet-50 dark:bg-violet-950/20 rounded-2xl p-6 border border-violet-100 dark:border-violet-900/20">
                                            <div className="flex items-center gap-3 mb-4">
                                                <User className="h-6 w-6 text-violet-600" />
                                                <h4 className="font-bold text-gray-900 dark:text-white">Professional Categories</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    const types = typeof doctorData.doctor_type === 'string'
                                                        ? doctorData.doctor_type.split(',').map((t: string) => t.trim())
                                                        : (doctorData.doctor_type || []);

                                                    const typeConfig = {
                                                        "Surgeon": { icon: "🔪", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
                                                        "Consultant": { icon: "👨‍⚕️", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" },
                                                        "Assistant": { icon: "🤝", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
                                                        "Normal": { icon: "👤", color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" },
                                                        "Quak": { icon: "🌙", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" },
                                                    };

                                                    return types.map((type: string, idx: number) => {
                                                        const config = typeConfig[type as keyof typeof typeConfig] || typeConfig["Normal"];
                                                        return (
                                                            <Badge
                                                                key={idx}
                                                                className={`${config.color} px-4 py-2 text-sm font-semibold border-2 shadow-sm`}
                                                            >
                                                                <span className="mr-2">{config.icon}</span>
                                                                {type}
                                                            </Badge>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-zinc-800">
                                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-4">Availability & Schedule</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4 hover:border-blue-200 transition-colors cursor-default">
                                            <div className="p-2.5 rounded-full bg-green-50 text-green-600">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Monday - Friday</p>
                                                <p className="text-xs text-muted-foreground">Regular Consultations</p>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4 hover:border-blue-200 transition-colors cursor-default">
                                            <div className="p-2.5 rounded-full bg-amber-50 text-amber-600">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">09:00 AM - 05:00 PM</p>
                                                <p className="text-xs text-muted-foreground">Visiting Hours</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </Main>
        </>
    );
}

export default ViewDoctorPage;
