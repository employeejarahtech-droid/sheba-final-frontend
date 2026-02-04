import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pencil, Wallet, Building2, TrendingUp, TrendingDown,
  Mail, Phone, MapPin, CalendarDays, Briefcase,
  Clock, CheckCircle2, XCircle, AlertCircle,
  Building
} from "lucide-react";
import { Link, useParams } from "react-router";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useGetStaffByIdQuery } from "@/store/features/staffs/staffApiService";
import { BackButton } from "@/components/BackButton";
import { useGetStaffAttendanceByIdQuery } from "@/store/features/attendence/attendenceApiService";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// =========================
//        TYPES
// =========================

interface AttendanceRecord {
  date: string;
  check_in: string | null;
  check_out: string | null;
  notes: string;
  status: "present" | "absent" | "late" | "leave" | string;
}

export type LeaveRequest = {
  date: string;
  type: string;
  status: "approved" | "pending" | "rejected";
};

export default function StaffDetails() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const { staffId } = useParams();
  const { data } = useGetStaffByIdQuery(staffId as string);

  const staff = data?.data;

  const { data: attendanceByStaff, isFetching: isFetchingAttendance } =
    useGetStaffAttendanceByIdQuery({
      staffId: Number(staffId),
      page,
      limit,
      search,
    });

  const attendanceData: AttendanceRecord[] = attendanceByStaff?.data || [];

  // Calculate Stats
  const presentCount = attendanceData.filter(a => a.status === 'present').length;
  const lateCount = attendanceData.filter(a => a.status === 'late').length;
  const absentCount = attendanceData.filter(a => a.status === 'absent').length;
  // const leaveCount = attendanceData.filter(a => a.status === 'on_leave').length;

  const leaveRequests: LeaveRequest[] = attendanceData
    .filter((item) => item.status === "on_leave")
    .map((item) => ({
      date: item.date,
      type: item.notes || "N/A",
      status: "approved",
    }));

  const formatStatusLabel = (status: string) =>
    status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());


  const attendanceColumns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue("date")}</span>
        </div>
      ),
    },
    {
      accessorKey: "check_in",
      header: "Check In",
      cell: ({ row }) => (
        <div className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">
          {row.getValue("check_in") || "--:--"}
        </div>
      ),
    },
    {
      accessorKey: "check_out",
      header: "Check Out",
      cell: ({ row }) => (
        <div className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">
          {row.getValue("check_out") || "--:--"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const rawStatus = row.getValue("status") as string;
        const status = rawStatus.toLowerCase();

        let colorClass = "bg-gray-500";
        let Icon = AlertCircle;

        if (status === "present") {
          colorClass = "bg-green-600 hover:bg-green-700";
          Icon = CheckCircle2;
        } else if (status === "late") {
          colorClass = "bg-yellow-600 hover:bg-yellow-700";
          Icon = Clock;
        } else if (status === "absent") {
          colorClass = "bg-red-600 hover:bg-red-700";
          Icon = XCircle;
        }

        return (
          <Badge className={`${colorClass} text-white gap-1 pl-1.5 pr-2.5`}>
            <Icon className="w-3.5 h-3.5" />
            {formatStatusLabel(rawStatus)}
          </Badge>
        );
      },
    },
  ];

  const leaveRequestsColumns: ColumnDef<LeaveRequest>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="font-medium">{row.getValue("date")}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("type")}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const color =
          status.toLowerCase() === "approved"
            ? "bg-green-100 text-green-700 border-green-200"
            : "bg-gray-100 text-gray-700 border-gray-200";
        return <Badge variant="outline" className={`${color}`}>{status}</Badge>;
      },
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/dashboard/staffs" className="hover:text-primary transition-colors">Staffs</Link>
            <span>/</span>
            <span>Details</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Profile</h1>
        </div>

        <div className="flex gap-3">
          <BackButton />
          <Link to={`/dashboard/staffs/${staffId}/edit`}>
            <Button className="gap-2 shadow-sm">
              <Pencil className="w-4 h-4" /> Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN — PROFILE CARD */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <Card className="overflow-hidden border-border/50 shadow-md">
            {/* Cover Background */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 w-full"></div>

            <CardContent className="pt-0 -mt-12 px-6 pb-6 text-center">
              <div className="inline-block p-1 bg-background rounded-full mb-3">
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                  <AvatarImage src={staff?.thumb_url} className="object-cover" />
                  <AvatarFallback className="text-xl font-bold bg-muted">
                    {staff?.first_name?.[0]}{staff?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h2 className="text-xl font-bold text-foreground">
                {staff?.first_name} {staff?.last_name}
              </h2>
              <p className="text-sm text-muted-foreground font-medium mb-4">
                {staff?.position || "No Designation"}
              </p>

              <div className="flex justify-center gap-2 mb-6">
                <Badge variant={staff?.status === 'active' ? 'default' : 'secondary'} className="capitalize px-3">
                  {staff?.status || 'Unknown'}
                </Badge>
              </div>

              <div className="space-y-4 text-left">
                <Separator />

                <div className="grid gap-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="font-medium">{staff?.department?.name || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="overflow-hidden">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a href={`mailto:${staff?.email}`} className="font-medium hover:text-primary truncate block" title={staff?.email}>
                        {staff?.email || "-"}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{staff?.phone || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium leading-tight">{staff?.address || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="font-medium">{staff?.hire_date || "-"}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full text-xs" asChild>
                    <a href={`mailto:${staff?.email}`}>Email</a>
                  </Button>
                  <Button variant="outline" className="w-full text-xs" asChild>
                    <a href={`tel:${staff?.phone}`}>Call</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — TABS & CONTENT */}
        <div className="lg:col-span-8 xl:col-span-9">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start h-12 p-1 bg-muted/50 rounded-lg mb-6 gap-2">
              <TabsTrigger value="overview" className="h-10 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
              <TabsTrigger value="payroll" className="h-10 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Payroll & Financials</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-500">

              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/10 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-primary">{attendanceByStaff?.pagination?.total || 0}</span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Days</span>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900/30 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-green-600">{presentCount}</span>
                    <span className="text-xs text-green-600/80 font-medium uppercase tracking-wider mt-1">Present</span>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-100 dark:bg-yellow-950/20 dark:border-yellow-900/30 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-yellow-600">{lateCount}</span>
                    <span className="text-xs text-yellow-600/80 font-medium uppercase tracking-wider mt-1">Late</span>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-red-600">{absentCount}</span>
                    <span className="text-xs text-red-600/80 font-medium uppercase tracking-wider mt-1">Absent</span>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Card */}
              <Card className="shadow-sm border-border/60 pt-4 pb-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Attendance History
                    </CardTitle>
                    <CardDescription>Recent check-in records</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={attendanceColumns}
                    data={attendanceData || []}
                    pageIndex={page - 1}
                    pageSize={limit}
                    onPageChange={(newPage) => setPage(newPage + 1)}
                    totalCount={attendanceByStaff?.pagination?.total}
                    onSearch={(val) => {
                      setSearch(val);
                      setPage(1);
                    }}
                    isFetching={isFetchingAttendance}
                  />
                </CardContent>
              </Card>

              {/* Leave Requests Card */}
              <Card className="shadow-sm border-border/60 pt-4 pb-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-orange-500" />
                      Details of Leave
                    </CardTitle>
                    <CardDescription>Approved leave records from attendance logs</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable columns={leaveRequestsColumns} data={leaveRequests} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* PAYROLL TAB */}
            <TabsContent value="payroll" className="space-y-6 animate-in fade-in-50 duration-500">

              {/* Salary Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white py-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Wallet className="w-4 h-4" /> Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-1 text-4xl font-bold">
                      RM {staff?.salary?.toLocaleString() || "0.00"}
                    </div>
                    <p className="text-sm text-slate-400">Total Monthly Gross Salary</p>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Basic</p>
                        <p className="font-semibold">RM {staff?.basic_salary?.toLocaleString() || (staff?.salary ? (staff.salary * 0.7).toLocaleString() : "0.00")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Date</p>
                        <p className="font-semibold">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Modern Bank Card UI */}
                <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-4">
                  <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <CardHeader className="pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-indigo-100 flex items-center justify-between">
                      <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Bank Account</span>
                      <Building className="w-5 h-5 opacity-50" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-6">
                    <div>
                      <p className="text-xs text-indigo-200 uppercase tracking-wider mb-1">Bank Name</p>
                      <p className="font-bold text-lg tracking-wide">{staff?.bank_details?.bank_name || "NOT CONFIGURED"}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-indigo-200 uppercase tracking-wider mb-1">Account Number</p>
                        <p className="font-mono text-xl tracking-widest">{staff?.bank_details?.account_number || "•••• •••• ••••"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-indigo-200 uppercase tracking-wider mb-1">Holder</p>
                        <p className="font-medium text-sm">{staff?.bank_details?.account_name || "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Allowances */}
                <Card className="shadow-sm py-4">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" /> Allowances
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {staff?.allowances && staff.allowances.length > 0 ? (
                      <div className="space-y-3">
                        {staff.allowances.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                            <span className="font-medium text-sm text-slate-700">{item.name}</span>
                            <span className="font-bold text-sm text-emerald-700">+ RM {item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">No allowances assigned</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Deductions */}
                <Card className="shadow-sm py-6">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-600" /> Deductions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {staff?.deductions && staff.deductions.length > 0 ? (
                      <div className="space-y-3">
                        {staff.deductions.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-rose-50/50 border border-rose-100 hover:bg-rose-50 transition-colors">
                            <span className="font-medium text-sm text-slate-700">{item.name}</span>
                            <span className="font-bold text-sm text-rose-700">- RM {item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">No deductions assigned</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
