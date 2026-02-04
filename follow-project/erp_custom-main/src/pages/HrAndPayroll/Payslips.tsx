import { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { DataTable } from "@/components/dashboard/components/DataTable";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useGetPayrollQuery } from "@/store/features/accounting/accoutntingApiService";
import { useGetAllStaffsQuery } from "@/store/features/staffs/staffApiService";
import { useAppSelector } from "@/store/store";

export default function Payslips() {
    const [selectedRun, setSelectedRun] = useState<string>("");

    const { data: payrollData, isLoading: isPayrollLoading } = useGetPayrollQuery();
    const { data: staffData } = useGetAllStaffsQuery({ limit: 1000 }); // Fetch all staff
    const currency = useAppSelector((state) => state.currency.value);

    const payrolls = payrollData?.data || [];
    const staffs = staffData?.data || [];

    // --- Compute Available Payroll Runs (Months) ---
    const payrollRuns = useMemo(() => {
        const months = new Set(payrolls.map((p) => p.salary_month));
        const sortedMonths = Array.from(months).sort().reverse();
        return sortedMonths.map((m) => ({
            value: m,
            label: `${new Date(m + "-01").toLocaleString("default", { month: "long", year: "numeric" })} (${m})`,
        }));
    }, [payrolls]);

    // Set default selected run
    useEffect(() => {
        if (!selectedRun && payrollRuns.length > 0) {
            setSelectedRun(payrollRuns[0].value);
        }
    }, [payrollRuns, selectedRun]);

    // --- Prepare Payslip Data ---
    const payslipData = useMemo(() => {
        if (!selectedRun) return [];

        return payrolls
            .filter((p) => p.salary_month === selectedRun)
            .map((p) => {
                const staff = staffs.find((s) => Number(s.id) === Number(p.staff_id));
                return {
                    id: p.id,
                    empCode: staff?.id ? `EMP-${staff.id}` : `ID-${p.staff_id}`,
                    employee: staff ? `${staff.first_name} ${staff.last_name}` : "Unknown Staff",
                    gross: 0, // Not available
                    net: p.net_salary,
                    status: p.status,
                    email: staff?.email,
                };
            });
    }, [payrolls, staffs, selectedRun]);


    const columns = [
        { accessorKey: "empCode", header: "Emp Code" },
        { accessorKey: "employee", header: "Employee" },
        {
            accessorKey: "net",
            header: `Net Salary (${currency})`,
            cell: ({ row }: any) => {
                const val = row.getValue("net");
                return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 });
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }: any) => { // Explicitly type row as any to avoid implicit any error
                const value = row.getValue("status");
                const color =
                    value === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700";
                return (
                    <span className={`px-2 py-1 text-xs rounded-full uppercase ${color}`}>{value}</span>
                );
            },
        },
        {
            accessorKey: "payslip",
            header: "Payslip",
            cell: () => (
                <Button size="sm" variant="outline">
                    PDF
                </Button>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }: any) => (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm" disabled={!row.original.email}>
                    Send
                </Button>
            ),
        },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-6">
            <Card className="rounded-sm border border-gray-300 dark:border-gray-700 shadow-sm">
                <CardHeader className="flex justify-between items-center border-b-1 dark:border-gray-700 py-3 gap-0">
                    <CardTitle className="text-lg font-semibold">Payslips</CardTitle>
                    <Button className="bg-gray-800 hover:bg-gray-900 text-white rounded-sm">
                        Bulk Download PDF
                    </Button>
                </CardHeader>

                <CardContent className="pt-4 pb-6 space-y-4">
                    {/* Payroll Run Selector */}
                    <div className="max-w-xs">
                        <Select value={selectedRun} onValueChange={setSelectedRun} disabled={payrollRuns.length === 0}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={payrollRuns.length === 0 ? "No Payroll Data" : "Select Payroll Run"} />
                            </SelectTrigger>
                            <SelectContent>
                                {payrollRuns.map((run) => (
                                    <SelectItem key={run.value} value={run.value}>
                                        {run.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payslip Table */}
                    <DataTable columns={columns} data={payslipData} pageSize={10} isFetching={isPayrollLoading} />

                    <p className="text-xs text-gray-400 mt-2">
                        Payslips are generated from payroll records.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
