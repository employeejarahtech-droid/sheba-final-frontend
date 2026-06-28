"use client";

import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Wallet, Clock, Calendar, Check, Users, ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppHeader } from '@/components/layout/app-header';
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { cn } from '@/lib/utils';

type Allowance = { name: string; amount: number };
type Deduction = { name: string; amount: number };
type Role = { id: string; display_name: string };
type Department = { id: string; name: string };

type Staff = {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    thumb_url?: string;
    avatar?: string;
    image?: string;
    basic_salary?: number;
    salary?: number;
    department?: Department | string;
    position?: string;
    role?: Role;
    status?: string;
    is_active?: boolean;
    created_at: string;
    allowances?: Allowance[];
    deductions?: Deduction[];
};

type AttendanceRecord = {
    id?: number;
    date: string;
    status: string;
    checkIn: string;
    checkOut: string;
    breakTime: string;
    workHours: string;
    saved_status?: boolean;
};

const mapBackendStatusToFrontend = (status: string) => {
    switch (status) {
        case 'present': return 'Present';
        case 'absent': return 'Absent';
        case 'late': return 'Late';
        case 'on_leave': return 'Leave';
        case 'half_day': return 'Present';
        case 'not_set': return 'notyet set';
        default: return 'Present';
    }
};

const mapFrontendStatusToBackend = (status: string) => {
    switch (status) {
        case 'Present': return 'present';
        case 'Absent': return 'absent';
        case 'Late': return 'late';
        case 'Leave': return 'on_leave';
        case 'notyet set': return 'not_set';
        default: return 'present';
    }
};

const formatTimeTo24h = (timeStr: string) => {
    if (!timeStr) return '';
    const match = timeStr.match(/^(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : '';
};

// Helper to calculate hours from check-in and check-out times, subtracting break duration
const calculateHours = (inTime: string, outTime: string, breakTime: string = '0h 0m'): string => {
    if (!inTime || !outTime || inTime === '-' || outTime === '' || inTime === '' || breakTime === '-') return '0h 0m';
    try {
        const parseTime = (tStr: string) => {
            tStr = tStr.trim();
            // check 12-hour AM/PM format
            const match12 = tStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
            if (match12) {
                let hrs = parseInt(match12[1]);
                const mins = parseInt(match12[2]);
                const ampm = match12[3].toUpperCase();
                if (ampm === 'PM' && hrs < 12) hrs += 12;
                if (ampm === 'AM' && hrs === 12) hrs = 0;
                return hrs * 60 + mins;
            }
            // check 24-hour format (like "18:30" or "09:00")
            const match24 = tStr.match(/^(\d+):(\d+)$/);
            if (match24) {
                const hrs = parseInt(match24[1]);
                const mins = parseInt(match24[2]);
                return hrs * 60 + mins;
            }
            return null;
        };

        const parseDurationMins = (dStr: string): number => {
            if (!dStr || dStr === '-') return 0;
            dStr = dStr.toLowerCase().trim();
            const hmMatch = dStr.match(/^(\d+(?:\.\d+)?)h\s*(\d+)m$/);
            if (hmMatch) {
                return Math.round(parseFloat(hmMatch[1]) * 60) + parseInt(hmMatch[2]);
            }
            const hMatch = dStr.match(/^(\d+(?:\.\d+)?)h$/);
            if (hMatch) {
                return Math.round(parseFloat(hMatch[1]) * 60);
            }
            const mMatch = dStr.match(/^(\d+)\s*(?:m|min|mins)?$/);
            if (mMatch) {
                return parseInt(mMatch[1]);
            }
            return 0;
        };

        const inMins = parseTime(inTime);
        const outMins = parseTime(outTime);
        if (inMins === null || outMins === null) return '0h 0m';
        let diff = outMins - inMins;
        if (diff < 0) diff += 24 * 60; // crossover midnight
        
        const breakMins = parseDurationMins(breakTime);
        let netMins = diff - breakMins;
        if (netMins < 0) netMins = 0;
        
        const h = Math.floor(netMins / 60);
        const m = netMins % 60;
        return `${h}h ${m}m`;
    } catch (_) {
        return '0h 0m';
    }
};

// Helper to parse time string (HH:mm or hh:mm AM/PM) into 12-hour components
const parseTimeTo12h = (timeStr: string) => {
    if (!timeStr) return { hour: '09', minute: '00', period: 'AM' };
    timeStr = timeStr.trim();
    
    // check if 12-hour AM/PM format
    const match12 = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (match12) {
        return {
            hour: String(parseInt(match12[1])).padStart(2, '0'),
            minute: match12[2],
            period: match12[3].toUpperCase()
        };
    }
    
    // check 24-hour format
    const match24 = timeStr.match(/^(\d+):(\d+)$/);
    if (match24) {
        let hrs = parseInt(match24[1]);
        const mins = match24[2];
        let p = 'AM';
        if (hrs >= 12) {
            p = 'PM';
            if (hrs > 12) hrs -= 12;
        }
        if (hrs === 0) hrs = 12;
        return {
            hour: String(hrs).padStart(2, '0'),
            minute: mins,
            period: p
        };
    }
    return { hour: '09', minute: '00', period: 'AM' };
};

// Helper to convert 12-hour parts to 24-hour format (HH:mm)
const formatTo24h = (hour: string, minute: string, period: string): string => {
    let hrs = parseInt(hour);
    if (period === 'PM' && hrs < 12) hrs += 12;
    if (period === 'AM' && hrs === 12) hrs = 0;
    return `${String(hrs).padStart(2, '0')}:${minute}`;
};

type TimeSelectorProps = {
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
};

function TimeSelector({ value, onChange, disabled }: TimeSelectorProps) {
    const { hour, minute, period } = parseTimeTo12h(value);
    const displayValue = value ? `${hour}:${minute} ${period}` : '--:--';

    const updateTime = (h: string, m: string, p: string) => {
        const time24 = formatTo24h(h, m, p);
        onChange(time24);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "h-8 text-xs w-[120px] justify-between font-normal bg-white/50 border-slate-200 hover:bg-white hover:text-slate-900 transition-colors shadow-none px-2.5",
                        disabled && "opacity-50 cursor-not-allowed bg-slate-100"
                    )}
                >
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{displayValue}</span>
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[210px] p-3 rounded-xl border border-slate-200 shadow-lg bg-white z-50" align="start">
                <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Set Time</div>
                    <div className="flex items-center gap-1.5">
                        {/* Hour Selector */}
                        <select
                            value={hour}
                            onChange={(e) => updateTime(e.target.value, minute, period)}
                            className="w-14 h-8 text-xs font-medium rounded-lg border border-slate-200 bg-white text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        >
                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                        
                        <span className="text-slate-400 font-bold">:</span>
                        
                        {/* Minute Selector */}
                        <select
                            value={minute}
                            onChange={(e) => updateTime(hour, e.target.value, period)}
                            className="w-14 h-8 text-xs font-medium rounded-lg border border-slate-200 bg-white text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        >
                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        
                        {/* Period Selector */}
                        <select
                            value={period}
                            onChange={(e) => updateTime(hour, minute, e.target.value)}
                            className="w-16 h-8 text-xs font-medium rounded-lg border border-slate-200 bg-white text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-6 text-[10px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 font-medium"
                            onClick={() => onChange("")}
                        >
                            Clear Time
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function AttendancePage() {
    const { staffId } = useParams({ from: '/_authenticated/dashboard/payroll/attendance/$staffId/' });
    const navigate = useNavigate();
    const token = getCookie('accessToken');

    const [attendanceMonth, setAttendanceMonth] = useState(() => new Date().toLocaleString('en-US', { month: 'long' }));
    const [attendanceYear, setAttendanceYear] = useState(() => String(new Date().getFullYear()));
    const [customPayrollAmount, setCustomPayrollAmount] = useState("");
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [processedPayrollId, setProcessedPayrollId] = useState<number | null>(null);
    const [existingPayroll, setExistingPayroll] = useState<any>(null);

    // Fetch staff (user) details from the backend
    const { data: userResponse, isLoading, error } = useQuery({
        queryKey: ["user-details", staffId],
        queryFn: async () => {
            const url = `${import.meta.env.VITE_API_URL}/api/users/get/${staffId}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch user details");
            return res.json();
        },
        enabled: !!token && !!staffId,
    });

    const staffData = userResponse?.data;

    // Fetch staff attendance records for the selected month/year
    const { data: attendanceResponse, isLoading: isAttendanceLoading, refetch: refetchAttendance } = useQuery({
        queryKey: ["staff-attendance", staffId, attendanceMonth, attendanceYear],
        queryFn: async () => {
            const monthsMap: Record<string, number> = {
                January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
                July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
            };
            const mNum = monthsMap[attendanceMonth] || 1;
            const yearNum = parseInt(attendanceYear);
            const startDate = `${yearNum}-${String(mNum).padStart(2, '0')}-01`;
            const lastDay = new Date(yearNum, mNum, 0).getDate();
            const endDate = `${yearNum}-${String(mNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            
            const url = `${import.meta.env.VITE_API_URL}/api/attendance?staff_id=${staffId}&from_date=${startDate}&to_date=${endDate}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch attendance records");
            return res.json();
        },
        enabled: !!token && !!staffId && !!attendanceMonth && !!attendanceYear,
    });

    useEffect(() => {
        const monthsMap: Record<string, number> = {
            January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
            July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
        };
        const mNum = monthsMap[attendanceMonth] || 1;
        const yearNum = parseInt(attendanceYear);
        const lastDay = new Date(yearNum, mNum, 0).getDate();
        
        const allDays = Array.from({ length: lastDay }, (_, i) => {
            const d = i + 1;
            return `${yearNum}-${String(mNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        });

        const fetchedData = attendanceResponse?.data || [];
        const dataMap = new Map(fetchedData.map((item: any) => [item.date, item]));

        const mapped = allDays.map(dateStr => {
            const item = dataMap.get(dateStr);
            if (item) {
                return {
                    id: item.id,
                    date: item.date,
                    status: mapBackendStatusToFrontend(item.status),
                    checkIn: formatTimeTo24h(item.check_in),
                    checkOut: formatTimeTo24h(item.check_out),
                    breakTime: item.notes && /^\d+h\s*\d+m$/.test(item.notes) ? item.notes : '1h 0m',
                    workHours: calculateHours(
                        formatTimeTo24h(item.check_in),
                        formatTimeTo24h(item.check_out),
                        item.notes && /^\d+h\s*\d+m$/.test(item.notes) ? item.notes : '1h 0m'
                    ),
                    saved_status: item.saved_status || false
                };
            } else {
                return {
                    id: undefined,
                    date: dateStr,
                    status: 'notyet set',
                    checkIn: '',
                    checkOut: '',
                    breakTime: '-',
                    workHours: '0h 0m',
                    saved_status: false
                };
            }
        });

        // Sort by date descending
        mapped.sort((a: any, b: any) => b.date.localeCompare(a.date));
        setAttendanceRecords(mapped);
    }, [attendanceResponse, attendanceMonth, attendanceYear]);

    // Check for existing payroll when month/year changes
    useEffect(() => {
        const checkExistingPayroll = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/payroll?staff_id=${staffId}&month=${attendanceMonth}&year=${attendanceYear}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.ok) {
                    const result = await res.json();
                    if (result.data && result.data.length > 0) {
                        const payroll = result.data[0];
                        setExistingPayroll(payroll);
                        setProcessedPayrollId(payroll.id);
                        // Optionally set custom amount to net_salary
                        if (payroll.net_salary) {
                            setCustomPayrollAmount(String(payroll.net_salary));
                        }
                    } else {
                        // No existing payroll, reset state
                        setExistingPayroll(null);
                        setProcessedPayrollId(null);
                    }
                }
            } catch (err) {
                console.error('Error checking existing payroll:', err);
            }
        };

        if (token && staffId && attendanceMonth && attendanceYear) {
            checkExistingPayroll();
        }
    }, [staffId, attendanceMonth, attendanceYear, token]);

    const handleBack = () => {
        navigate({ to: '/dashboard/payroll/overview' });
    };

    // Check if payroll can be processed
    const canProcessPayroll = () => {
        // No validation needed - some companies don't use attendance
        // Payroll can be processed directly with basic salary, allowances, and deductions
        return { allowed: true, reason: null };
    };

    const handleProcessPayroll = async () => {
        // Validate
        const validation = canProcessPayroll();
        if (!validation.allowed) {
            toast.error(validation.reason || 'Cannot process payroll');
            return;
        }

        try {
            // Calculate attendance summary
            const presentDays = attendanceRecords.filter(r => r.status === 'Present').length;
            const lateDays = attendanceRecords.filter(r => r.status === 'Late').length;
            const absentDays = attendanceRecords.filter(r => r.status === 'Absent').length;
            const leaveDays = attendanceRecords.filter(r => r.status === 'Leave').length;
            const notSetDays = attendanceRecords.filter(r => r.status === 'notyet set').length;

            const workingDays = presentDays + lateDays; // Days that count for salary

            // Use custom amount if provided, otherwise calculate
            let finalAmount = customPayrollAmount
                ? parseFloat(customPayrollAmount)
                : netSalary;

            // Build allowances and deductions objects
            const allowancesObj = allowancesList.reduce((acc: Record<string, number>, item: any) => {
                acc[item.name || 'allowance'] = Number(item.amount);
                return acc;
            }, {});

            const deductionsObj = deductionsList.reduce((acc: Record<string, number>, item: any) => {
                acc[item.name || 'deduction'] = Number(item.amount);
                return acc;
            }, {});

            // Build notes
            const notes = `Attendance Summary: Present: ${presentDays}, Late: ${lateDays}, Absent: ${absentDays}, Leave: ${leaveDays}, Not Set: ${notSetDays}. Total Working Days: ${workingDays}`;

            const body = {
                staff_id: Number(staffId),
                month: attendanceMonth,
                year: parseInt(attendanceYear),
                basic_salary: basicSalary,
                allowances: allowancesObj,
                deductions: deductionsObj,
                net_salary: finalAmount,
                status: 'pending',
                notes: notes
            };

            console.log('Processing payroll:', body);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || 'Failed to process payroll');
            }

            // Update state
            setProcessedPayrollId(result.data?.id);
            setExistingPayroll(result.data);

            toast.success(`Payroll processed for ${attendanceMonth} ${attendanceYear}! Amount: ৳${finalAmount.toLocaleString()}`);

        } catch (err: any) {
            console.error('Payroll processing error:', err);
            toast.error(err.message || 'Error processing payroll');
        }
    };

    const handleViewSlip = async () => {
        if (!processedPayrollId) {
            toast.error('Please process payroll first');
            return;
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${processedPayrollId}/payslip`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to generate payslip');
            const html = await res.text();
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (!win) {
                toast.error('Popup blocked — please allow popups to view the payslip');
            }
            // Revoke shortly after to free memory
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err: any) {
            toast.error(err.message || 'Error generating payslip');
        }
    };

    // Safe JSON parsing helper
    const parseJSONArray = (val: any) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                return Array.isArray(parsed) ? parsed : [];
            } catch (_) {
                return [];
            }
        }
        return [];
    };

    // Calculate salary summary
    const basicSalary = Number(staffData?.basic_salary) || Number(staffData?.salary) || 0;
    const allowancesList = parseJSONArray(staffData?.allowances);
    const deductionsList = parseJSONArray(staffData?.deductions);

    const totalAllowances = allowancesList.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
    const totalDeductions = deductionsList.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
    const grossSalary = basicSalary + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    // Calculate stats from attendance
    const presentDays = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'Absent').length;
    const lateDays = attendanceRecords.filter(r => r.status === 'Late').length;
    const leaveDays = attendanceRecords.filter(r => r.status === 'Leave').length;

    if (isLoading || isAttendanceLoading) {
        return (
            <>
                <AppHeader fixed />
                <main className="p-6 lg:p-10 flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-sm text-gray-500">Loading attendance data...</p>
                    </div>
                </main>
            </>
        );
    }

    if (error) {
        return (
            <>
                <AppHeader fixed />
                <main className="p-6 lg:p-10 flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-4">
                        <p className="text-red-500 font-semibold">Error loading user details</p>
                        <p className="text-sm text-gray-500">{(error as any)?.message || "Something went wrong"}</p>
                        <Button onClick={handleBack}>Go Back</Button>
                    </div>
                </main>
            </>
        );
    }

    const staffDisplayName = staffData?.name || `${staffData?.first_name || ''} ${staffData?.last_name || ''}`.trim() || 'Unnamed';
    const staffAvatarUrl = staffData?.avatar || staffData?.image || staffData?.thumb_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staffDisplayName)}`;
    const staffStatus = staffData?.status || (staffData?.is_active ? 'active' : 'inactive');

    return (
        <>
            <AppHeader fixed />
            <main className="">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBack}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Staff Attendance Record
                                </h1>
                                <p className="text-muted-foreground text-sm">View monthly attendance history and process payroll</p>
                            </div>
                        </div>
                    </div>

                    {/* Staff Summary Card */}
                    {staffData && (
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <Users className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Staff Profile</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Employee identity and contact info</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-6">
                                        <Avatar className="w-16 h-16 border-2 border-indigo-100">
                                            <AvatarImage src={staffAvatarUrl} alt={staffDisplayName} />
                                        </Avatar>
                                        <div>
                                            <h2 className="text-xl font-bold">{staffDisplayName}</h2>
                                            <p className="text-gray-600 text-sm">
                                                {staffData.position || 'Staff'} • {typeof staffData.department === 'object' ? staffData.department?.name : (staffData.department || 'General')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">{staffData.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Employee ID</p>
                                            <p className="font-semibold text-slate-700">#{staffData.id}</p>
                                        </div>
                                        <div>
                                            <Badge className={cn("capitalize shadow-none border px-2.5 py-0.5 text-xs font-semibold",
                                                staffStatus === 'active'
                                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                            )}>
                                                {staffStatus}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Attendance Period Card */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <Calendar className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Attendance Period</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Choose the monthly time frame and view records</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Period Selectors Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 dark:border-slate-800">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                        Summary for {attendanceMonth} {attendanceYear}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">View and manage attendance records</p>
                                </div>
                                <div className="flex gap-2">
                                    <Select value={attendanceMonth} onValueChange={setAttendanceMonth}>
                                        <SelectTrigger className="w-[140px] h-9">
                                            <SelectValue placeholder="Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="January">January</SelectItem>
                                            <SelectItem value="February">February</SelectItem>
                                            <SelectItem value="March">March</SelectItem>
                                            <SelectItem value="April">April</SelectItem>
                                            <SelectItem value="May">May</SelectItem>
                                            <SelectItem value="June">June</SelectItem>
                                            <SelectItem value="July">July</SelectItem>
                                            <SelectItem value="August">August</SelectItem>
                                            <SelectItem value="September">September</SelectItem>
                                            <SelectItem value="October">October</SelectItem>
                                            <SelectItem value="November">November</SelectItem>
                                            <SelectItem value="December">December</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={attendanceYear} onValueChange={setAttendanceYear}>
                                        <SelectTrigger className="w-[100px] h-9">
                                            <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from(
                                                { length: new Date().getFullYear() - 2024 + 1 },
                                                (_, i) => String(2024 + i)
                                            ).map(year => (
                                                <SelectItem key={year} value={year}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Summary Stats Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="bg-gradient-to-br from-emerald-50/50 to-teal-50/20 dark:from-emerald-950/10 dark:to-teal-950/5 border-emerald-100 dark:border-emerald-900/30 shadow-none hover:shadow-md hover:bg-emerald-50/80 transition-all duration-300">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{presentDays}</span>
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mt-1">Present</span>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-rose-50/50 to-red-50/20 dark:from-rose-950/10 dark:to-red-950/5 border-rose-100 dark:border-rose-900/30 shadow-none hover:shadow-md hover:bg-rose-50/80 transition-all duration-300">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{absentDays}</span>
                                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide mt-1">Absent</span>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-amber-50/50 to-orange-50/20 dark:from-amber-950/10 dark:to-orange-950/5 border-amber-100 dark:border-amber-900/30 shadow-none hover:shadow-md hover:bg-amber-50/80 transition-all duration-300">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{lateDays}</span>
                                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mt-1">Late</span>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-sky-50/50 to-blue-50/20 dark:from-sky-950/10 dark:to-blue-950/5 border-sky-100 dark:border-sky-900/30 shadow-none hover:shadow-md hover:bg-sky-50/80 transition-all duration-300">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">{leaveDays}</span>
                                        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide mt-1">Leaves</span>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Attendance Records Table */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-indigo-500" /> Monthly Attendance Log
                                    </h4>
                                </div>
                                {/* Monthly Attendance Table - Same as Daily Structure */}
                                <div className="border rounded-lg overflow-hidden shadow-sm mt-4">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 dark:from-slate-900/20 dark:to-slate-900/10 font-semibold border-b">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                                                <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                                                <th className="px-4 py-3 font-semibold text-slate-700">Check In</th>
                                                <th className="px-4 py-3 font-semibold text-slate-700">Check Out</th>
                                                <th className="px-4 py-3 font-semibold text-slate-700">Rest/Break</th>
                                                <th className="px-4 py-3 font-semibold text-slate-700">Work Hours</th>
                                                <th className="px-4 py-3 font-semibold text-slate-700 w-24 text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {attendanceRecords.map((record, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                                                            <td className="px-4 py-2 font-medium text-slate-800">
                                                                <Input
                                                                    type="text"
                                                                    value={record.date}
                                                                    readOnly
                                                                    disabled
                                                                    className="h-8 text-xs w-28 bg-slate-50 dark:bg-slate-900 border-slate-200 focus-visible:ring-0 cursor-not-allowed text-slate-700 dark:text-slate-300 font-semibold"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <Select
                                                                    value={record.status}
                                                                    disabled={record.saved_status}
                                                                    onValueChange={(val) => {
                                                                        const updated = [...attendanceRecords];
                                                                        const isOff = val === 'Absent' || val === 'Leave';
                                                                        const isNotSet = val === 'notyet set';
                                                                        const nextBreak = isOff || isNotSet ? '-' : (record.breakTime === '-' ? '1h 0m' : record.breakTime);
                                                                        updated[idx] = {
                                                                            ...record,
                                                                            status: val,
                                                                            checkIn: isOff || isNotSet ? '00:00' : (record.checkIn === '' || record.checkIn === '00:00' ? '09:00' : record.checkIn),
                                                                            checkOut: isOff || isNotSet ? '00:00' : (record.checkOut === '' || record.checkOut === '00:00' ? '18:00' : record.checkOut),
                                                                            breakTime: nextBreak,
                                                                            workHours: isOff || isNotSet ? '0h 0m' : calculateHours(
                                                                                (record.checkIn === '' || record.checkIn === '00:00') ? '09:00' : record.checkIn,
                                                                                (record.checkOut === '' || record.checkOut === '00:00') ? '18:00' : record.checkOut,
                                                                                nextBreak
                                                                            )
                                                                        };
                                                                        setAttendanceRecords(updated);
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="w-[110px] h-8 text-xs font-semibold">
                                                                        <SelectValue placeholder="Status" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="notyet set">notyet set</SelectItem>
                                                                        <SelectItem value="Present">Present</SelectItem>
                                                                        <SelectItem value="Absent">Absent</SelectItem>
                                                                        <SelectItem value="Late">Late</SelectItem>
                                                                        <SelectItem value="Leave">Leave</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <TimeSelector
                                                                    value={record.checkIn}
                                                                    disabled={record.saved_status || record.status === 'Absent' || record.status === 'Leave' || record.status === 'notyet set'}
                                                                    onChange={(val) => {
                                                                        const updated = [...attendanceRecords];
                                                                        const calculated = calculateHours(val, record.checkOut, record.breakTime);
                                                                        updated[idx] = {
                                                                            ...record,
                                                                            checkIn: val,
                                                                            workHours: calculated
                                                                        };
                                                                        setAttendanceRecords(updated);
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <TimeSelector
                                                                    value={record.checkOut}
                                                                    disabled={record.saved_status || record.status === 'Absent' || record.status === 'Leave' || record.status === 'notyet set'}
                                                                    onChange={(val) => {
                                                                        const updated = [...attendanceRecords];
                                                                        const calculated = calculateHours(record.checkIn, val, record.breakTime);
                                                                        updated[idx] = {
                                                                            ...record,
                                                                            checkOut: val,
                                                                            workHours: calculated
                                                                        };
                                                                        setAttendanceRecords(updated);
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <Select
                                                                    value={record.breakTime || '-'}
                                                                    disabled={record.saved_status || record.status === 'Absent' || record.status === 'Leave' || record.status === 'notyet set'}
                                                                    onValueChange={(val) => {
                                                                        const updated = [...attendanceRecords];
                                                                        const calculated = calculateHours(record.checkIn, record.checkOut, val);
                                                                        updated[idx] = {
                                                                            ...record,
                                                                            breakTime: val,
                                                                            workHours: calculated
                                                                        };
                                                                        setAttendanceRecords(updated);
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="w-[140px] h-8 text-xs bg-white/50 border-slate-200">
                                                                        <SelectValue placeholder="Break" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="-">-</SelectItem>
                                                                        <SelectItem value="0h 0m">0 Minutes</SelectItem>
                                                                        <SelectItem value="0h 30m">30 Minutes</SelectItem>
                                                                        <SelectItem value="1h 0m">1 Hour</SelectItem>
                                                                        <SelectItem value="1h 30m">1 and Half Hour</SelectItem>
                                                                        <SelectItem value="2h 0m">2 Hour</SelectItem>
                                                                        <SelectItem value="2h 30m">2 and Half Hour</SelectItem>
                                                                        <SelectItem value="3h 0m">3 Hour</SelectItem>
                                                                        <SelectItem value="3h 30m">3 and Half Hour</SelectItem>
                                                                        <SelectItem value="4h 0m">4 Hour</SelectItem>
                                                                        <SelectItem value="4h 30m">4 and Half Hour</SelectItem>
                                                                        <SelectItem value="5h 0m">5 Hour</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <Input
                                                                    type="text"
                                                                    value={record.workHours}
                                                                    readOnly
                                                                    disabled={record.status === 'Absent' || record.status === 'Leave'}
                                                                    className="h-8 text-xs w-20 bg-slate-50 dark:bg-slate-900 border-slate-200 focus-visible:ring-0 cursor-not-allowed font-semibold text-slate-500 shadow-none select-none"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                 <div className="flex items-center justify-center">
                                                                     {record.saved_status ? (
                                                                         <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                                             <Check className="w-3.5 h-3.5" /> Saved
                                                                         </span>
                                                                     ) : (
                                                                         <Button
                                                                             size="icon"
                                                                             variant="ghost"
                                                                             className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                                                             onClick={async () => {
                                                                                  try {
                                                                                      const body: Record<string, any> = {
                                                                                          status: mapFrontendStatusToBackend(record.status),
                                                                                          check_in: record.checkIn ? `${record.checkIn}:00` : null,
                                                                                          check_out: record.checkOut ? `${record.checkOut}:00` : null,
                                                                                          notes: record.breakTime || null,
                                                                                          saved_status: true
                                                                                      };

                                                                                      // Determine if this is an update or create
                                                                                      const isUpdate = !!record.id;

                                                                                      // For create, we need staff_id and date
                                                                                      if (!isUpdate) {
                                                                                          body.staff_id = Number(staffId);
                                                                                          body.date = record.date;
                                                                                      }

                                                                                      const url = isUpdate
                                                                                          ? `${import.meta.env.VITE_API_URL}/api/attendance/${record.id}`
                                                                                          : `${import.meta.env.VITE_API_URL}/api/attendance/check-in`;

                                                                                      console.log('Saving attendance:', { method: isUpdate ? 'PUT' : 'POST', url, body, isUpdate });

                                                                                      const res = await fetch(url, {
                                                                                          method: isUpdate ? 'PUT' : 'POST',
                                                                                          headers: {
                                                                                              'Content-Type': 'application/json',
                                                                                              Authorization: `Bearer ${token}`
                                                                                          },
                                                                                          body: JSON.stringify(body)
                                                                                      });

                                                                                      const result = await res.json();
                                                                                      console.log('Save response:', result);

                                                                                      if (!res.ok) {
                                                                                          console.error('Save failed:', result);
                                                                                          throw new Error(result.message || 'Failed to save attendance record');
                                                                                      }

                                                                                      toast.success(`Saved log for ${record.date || 'entry'}`);
                                                                                      refetchAttendance();
                                                                                  } catch (err: any) {
                                                                                      console.error('Save error:', err);
                                                                                      toast.error(err.message || 'Error saving attendance record');
                                                                                  }
                                                                              }}
                                                                             title={record.id ? "Update Attendance Record" : "Save Log Entry"}
                                                                         >
                                                                             <Save className="w-4 h-4" />
                                                                         </Button>
                                                                     )}
                                                                 </div>
                                                             </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Salary Structure Reference */}
                    {staffData && (
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <Wallet className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Salary Structure Reference</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Base salary, active allowances, and deductions</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                                    {/* Allowances */}
                                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                        <h5 className="font-semibold text-emerald-700 mb-3 border-b border-emerald-100 pb-1.5 flex justify-between items-center">
                                            <span>Allowances (Additions)</span>
                                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Credits</span>
                                        </h5>
                                        <ul className="space-y-2">
                                            <li className="flex justify-between items-center py-0.5 border-b border-dashed border-slate-100">
                                                <span className="text-slate-500">Basic Salary</span>
                                                <span className="font-semibold text-slate-800">৳ {basicSalary.toLocaleString()}</span>
                                            </li>
                                            {allowancesList.map((item: any, idx: number) => (
                                                <li key={idx} className="flex justify-between items-center py-0.5 border-b border-dashed border-slate-100">
                                                    <span className="text-slate-500">{item.name || "Allowance"}</span>
                                                    <span className="font-semibold text-slate-800">৳ {Number(item.amount).toLocaleString()}</span>
                                                </li>
                                            ))}
                                            {(allowancesList.length === 0) && (
                                                <li className="text-xs text-slate-400 italic py-1">No additional allowances</li>
                                            )}
                                        </ul>
                                    </div>
                                    {/* Deductions */}
                                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                        <h5 className="font-semibold text-rose-700 mb-3 border-b border-rose-100 pb-1.5 flex justify-between items-center">
                                            <span>Deductions (Subtractions)</span>
                                            <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-medium">Debits</span>
                                        </h5>
                                        <ul className="space-y-2">
                                            {deductionsList.map((item: any, idx: number) => (
                                                <li key={idx} className="flex justify-between items-center py-0.5 border-b border-dashed border-slate-100">
                                                    <span className="text-slate-500">{item.name || "Deduction"}</span>
                                                    <span className="font-semibold text-slate-800">৳ {Number(item.amount).toLocaleString()}</span>
                                                </li>
                                            ))}
                                            {(deductionsList.length === 0) && (
                                                <li className="text-xs text-slate-400 italic py-1">No deductions defined</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                                {/* Net Summary */}
                                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap justify-end gap-6 text-sm font-semibold">
                                    <div className="text-slate-500">Gross Salary: <span className="text-slate-800 font-bold">৳ {grossSalary.toLocaleString()}</span></div>
                                    <div className="text-slate-500">Net Payable: <span className="text-emerald-600 font-bold">৳ {netSalary.toLocaleString()}</span></div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payable for Selected Month Card */}
                    <Card className="overflow-hidden shadow-lg border-none bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <p className="text-emerald-100 font-medium mb-1 text-sm tracking-wide uppercase">
                                            {existingPayroll ? 'Final Payable' : 'Estimated Payable'} for {attendanceMonth} {attendanceYear}
                                        </p>
                                        <h3 className="text-4xl font-extrabold flex items-baseline">
                                            <span className="text-2xl mr-1 font-normal opacity-80">৳</span>
                                            {customPayrollAmount || netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge className={cn(
                                            "bg-white/20 hover:bg-white/30 text-white border-none shadow-none font-medium py-1 px-3",
                                            existingPayroll ? "bg-green-500/40" : ""
                                        )}>
                                            Status: {existingPayroll ? 'Processed' : 'Pending'}
                                        </Badge>
                                        <span className="text-xs text-emerald-100 opacity-80">
                                            {existingPayroll
                                                ? `Processed on ${new Date(existingPayroll.created_at).toLocaleDateString()}`
                                                : '(Based on standard month working days)'
                                            }
                                        </span>
                                    </div>
                                    <div className="max-w-xs">
                                        <Label className="text-xs text-emerald-50 font-semibold uppercase tracking-wider mb-1.5 block">
                                            {existingPayroll ? 'Final Amount' : 'Override Amount'}
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-emerald-700 font-bold text-sm">৳</span>
                                            <Input
                                                type="number"
                                                placeholder={existingPayroll ? "Amount locked" : "Enter custom amount..."}
                                                className={cn(
                                                    "pl-8 h-10 border-none font-medium focus-visible:ring-2",
                                                    existingPayroll
                                                        ? "bg-white/80 text-emerald-900 cursor-not-allowed opacity-75"
                                                        : "bg-white/95 text-emerald-900 placeholder:text-emerald-900/40 focus-visible:ring-emerald-300"
                                                )}
                                                value={customPayrollAmount}
                                                onChange={(e) => setCustomPayrollAmount(e.target.value)}
                                                disabled={!!existingPayroll}
                                            />
                                        </div>
                                        {existingPayroll && (
                                            <p className="text-xs text-emerald-200 mt-1 flex items-center gap-1">
                                                <Check className="w-3 h-3" />
                                                Amount finalized - cannot be modified
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[200px] justify-center">
                                    <Button
                                        className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold h-11 shadow-md hover:shadow-lg transition-all duration-300 border-none"
                                        onClick={handleProcessPayroll}
                                        disabled={!!existingPayroll}
                                    >
                                        <Wallet className="w-4 h-4 mr-2" />
                                        {existingPayroll ? 'Payroll Processed' : 'Process Payroll'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-emerald-400/60 text-emerald-100 hover:bg-emerald-700/60 hover:text-white bg-transparent h-11"
                                        onClick={handleViewSlip}
                                        disabled={!processedPayrollId}
                                    >
                                        View Slip
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );

}

export const Route = createFileRoute('/_authenticated/dashboard/payroll/attendance/$staffId/')({
    component: AttendancePage,
});
