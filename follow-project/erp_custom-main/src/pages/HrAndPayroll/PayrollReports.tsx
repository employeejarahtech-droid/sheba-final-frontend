import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAllStaffsQuery } from "@/store/features/staffs/staffApiService";
import type { Staff } from "@/types/staff.types";
import {
    Loader2,
    Download,
    TrendingUp,
    DollarSign,
    Users,
    Building2,
    PieChart as PieIcon,
    Calendar
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/dashboard/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { toast } from "sonner";

export default function PayrollReports() {
    const [month, setMonth] = useState("January");
    const [year, setYear] = useState("2026");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [search, setSearch] = useState("");

    // Fetch all active staff for reporting
    // In a real app, this might come from a dedicated /reports endpoint
    // But calculating from current staff structure provides real-time projection
    const { data: staffsData, isLoading } = useGetAllStaffsQuery({
        limit: 1000, // Fetch all for accurate report
        status: "active"
    });

    const staffs = (staffsData?.data as Staff[]) || [];

    // -------------------------
    //  AGGREGATION LOGIC
    // -------------------------
    const reportData = useMemo(() => {
        let totalBasic = 0;
        let totalAllowances = 0;
        let totalDeductions = 0;
        let totalNet = 0;

        const deptWise: Record<string, number> = {};

        // Filter Data
        const filteredStaff = staffs.filter(s => {
            const matchesDept = departmentFilter === "all" || s.department?.name === departmentFilter;
            const searchTerm = search.toLowerCase();
            const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
            const matchesSearch = !search ||
                fullName.includes(searchTerm) ||
                (s.email && s.email.toLowerCase().includes(searchTerm)) ||
                (s.position && s.position.toLowerCase().includes(searchTerm));

            return matchesDept && matchesSearch;
        });

        // Compute Stats
        filteredStaff.forEach(staff => {
            const basic = Number(staff.basic_salary) || Number(staff.salary) || 0;
            const allow = staff.allowances?.reduce((sum, a) => sum + Number(a.amount), 0) || 0;
            const deduc = staff.deductions?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

            totalBasic += basic;
            totalAllowances += allow;
            totalDeductions += deduc;
            totalNet += (basic + allow - deduc);

            const deptName = staff.department?.name || "Unassigned";
            deptWise[deptName] = (deptWise[deptName] || 0) + (basic + allow - deduc);
        });

        return {
            totalBasic,
            totalAllowances,
            totalDeductions,
            totalNet,
            count: filteredStaff.length,
            deptWise: Object.entries(deptWise).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
            filteredData: filteredStaff
        };
    }, [staffs, departmentFilter, search]);

    // Chart Data Config
    const compositionData = [
        { name: 'Basic Salary', value: reportData.totalBasic },
        { name: 'Allowances', value: reportData.totalAllowances },
        { name: 'Deductions', value: reportData.totalDeductions }, // Deductions technically reduce cost, but for visualization of components
    ];

    const COLORS = ['#3b82f6', '#10b981', '#ef4444'];

    // Export CSV
    const handleExport = () => {
        const headers = ["Employee ID", "Name", "Department", "Basic Salary", "Allowances", "Deductions", "Net Pay"];
        const rows = reportData.filteredData.map(s => {
            const basic = Number(s.basic_salary) || Number(s.salary) || 0;
            const allow = s.allowances?.reduce((sum, a) => sum + Number(a.amount), 0) || 0;
            const deduc = s.deductions?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
            return [
                s.id,
                `"${s.first_name} ${s.last_name}"`,
                s.department?.name || "N/A",
                basic,
                allow,
                deduc,
                (basic + allow - deduc)
            ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `payroll_report_${month}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Report downloaded successfully");
    };

    // Table Columns
    const columns: ColumnDef<Staff>[] = [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({ row }) => <span className="font-mono text-xs text-gray-500">#{row.getValue("id")}</span>
        },
        {
            accessorKey: "first_name",
            header: "Employee",
            cell: ({ row }) => (
                <div>
                    <div className="font-medium text-gray-900">{row.original.first_name} {row.original.last_name}</div>
                    <div className="text-xs text-gray-500">{row.original.position}</div>
                </div>
            )
        },
        {
            accessorKey: "department.name",
            header: "Department",
            cell: ({ row }) => <Badge variant="outline">{row.original.department?.name || "N/A"}</Badge>
        },
        {
            id: "breakdown",
            header: "Salary Breakdown",
            cell: ({ row }) => {
                const basic = Number(row.original.basic_salary) || Number(row.original.salary) || 0;
                const allow = row.original.allowances?.reduce((sum, a) => sum + Number(a.amount), 0) || 0;
                const deduc = row.original.deductions?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
                return (
                    <div className="text-xs space-y-1">
                        <div className="flex justify-between w-[160px]">
                            <span className="text-gray-500">Basic:</span>
                            <span>{basic.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-[160px] text-green-600">
                            <span>Allowances:</span>
                            <span>+{allow.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-[160px] text-red-600">
                            <span>Deductions:</span>
                            <span>-{deduc.toLocaleString()}</span>
                        </div>
                    </div>
                )
            }
        },
        {
            id: "net",
            header: "Net Payable",
            cell: ({ row }) => {
                const basic = Number(row.original.basic_salary) || Number(row.original.salary) || 0;
                const allow = row.original.allowances?.reduce((sum, a) => sum + Number(a.amount), 0) || 0;
                const deduc = row.original.deductions?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
                return <Badge className="bg-emerald-600 text-base px-3 py-1">{(basic + allow - deduc).toLocaleString()}</Badge>
            }
        }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-8">
            {/* Heading & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payroll Analytics</h1>
                    <p className="text-gray-500 mt-1">Projected financial insights for {month} {year}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-[150px] bg-white">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Depts</SelectItem>
                            <SelectItem value="Management">Management</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Technical">Technical</SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[130px] bg-white">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[100px] bg-white">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={handleExport} className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <DollarSign className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-blue-100 font-medium">Total Payroll Cost</span>
                        </div>
                        <h3 className="text-3xl font-bold">{reportData.totalNet.toLocaleString()}</h3>
                        <p className="text-sm text-blue-100 mt-2 opacity-80">Estimated Net Payable</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="text-gray-500 font-medium">Active Employees</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{reportData.count}</h3>
                        <p className="text-sm text-gray-400 mt-2">Processed in this report</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-gray-500 font-medium">Avg. Salary</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">
                            {(reportData.totalNet / (reportData.count || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h3>
                        <p className="text-sm text-gray-400 mt-2">Per active employee</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Building2 className="w-5 h-5 text-orange-600" />
                            </div>
                            <span className="text-gray-500 font-medium">Departments</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{Object.keys(reportData.deptWise).length}</h3>
                        <p className="text-sm text-gray-400 mt-2">With active payroll</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Department Distribution */}
                <Card className="shadow-md border-gray-100 py-6">
                    <CardHeader >
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Department Distribution
                        </CardTitle>
                        <CardDescription>Cost allocation by department</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.deptWise} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: number) => value.toLocaleString()}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Payroll Composition */}
                <Card className="shadow-md border-gray-100 py-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieIcon className="w-5 h-5 text-emerald-600" />
                            Payroll Composition
                        </CardTitle>
                        <CardDescription>Breakdown of total cost components</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={compositionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {compositionData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card className="shadow-md border-gray-100 pt-6 pb-2">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Detailed Payroll Register</CardTitle>
                        <CardDescription>Employee-wise breakdown of current structure</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={reportData.filteredData}
                        isFetching={isLoading}
                        totalCount={reportData.filteredData.length}
                        pageSize={reportData.filteredData.length > 0 ? reportData.filteredData.length : 10}
                        pageIndex={0}
                        onSearch={setSearch}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
