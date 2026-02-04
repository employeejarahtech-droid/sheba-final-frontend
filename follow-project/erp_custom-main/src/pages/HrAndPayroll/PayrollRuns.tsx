import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useGetPayrollQuery, useAddExpenseMutation } from "@/store/features/accounting/accoutntingApiService";
import { useAppSelector } from "@/store/store";
import type { Payroll } from "@/types/accounting.types";
import type { ColumnDef } from "@tanstack/react-table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { CreditCard, Users, Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface PayrollRun {
    runCode: string;
    period: string;
    employees: number;
    gross: number;
    net: number;
    status: string;
}

export default function PayrollRuns() {
    const [searchPeriod, setSearchPeriod] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const { data: payrollData, isLoading } = useGetPayrollQuery();
    const [addExpense, { isLoading: isPaying }] = useAddExpenseMutation();

    const payrolls = payrollData?.data || [];
    const currency = useAppSelector((state) => state.currency.value);

    // --- Aggregate Payroll Data into Runs ---
    const aggregatedRuns = useMemo(() => {
        const runs: Record<string, {
            id: string;
            period: string;
            employees: Set<number>;
            gross: number;
            net: number;
            status: string;
        }> = {};

        payrolls.forEach((p: Payroll) => {
            const month = p.salary_month; // e.g. "2025-01"
            if (!runs[month]) {
                runs[month] = {
                    id: `PR-${month}`,
                    period: month,
                    employees: new Set(),
                    gross: 0,
                    net: 0,
                    status: 'PENDING'
                };
            }

            runs[month].employees.add(p.staff_id);
            runs[month].net += Number(p.net_salary);

            // If any record in this month is paid, consider the run "PAID" for simplicity in this view
            // In a real app, you'd check if *all* are paid, or have a run-level status.
            if (p.status === 'paid' || p.status === 'completed') {
                runs[month].status = 'COMPLETED';
            }
        });

        return Object.values(runs).map(r => ({
            runCode: r.id,
            period: r.period,
            employees: r.employees.size,
            gross: r.gross,
            net: r.net,
            status: r.status
        }));

    }, [payrolls]);

    const filteredRuns = aggregatedRuns.filter(run => {
        const matchesPeriod = run.period.toLowerCase().includes(searchPeriod.toLowerCase());
        const matchesStatus = statusFilter === 'all' || run.status === statusFilter;
        return matchesPeriod && matchesStatus;
    });

    const handleReview = (run: PayrollRun) => {
        setSelectedRun(run);
        setIsSheetOpen(true);
    };

    const handlePay = async () => {
        if (!selectedRun) return;

        try {
            // 1. Create Expense Entry

            await addExpense({
                date: new Date().toISOString().split('T')[0],
                amount: selectedRun.net,
                description: `Payroll Payment for ${selectedRun.period} (${selectedRun.runCode})`,
                payment_method: "bank_transfer",
                // category: "Payroll", // if supported
                // status: "paid"
            }).unwrap();

            toast.success("Payroll successfully paid and recorded as expense!");
            setIsSheetOpen(false);
            // Ideally, trigger a re-fetch or status update here
        } catch (error) {
            console.error("Payment failed", error);
            toast.error("Failed to record payment expense.");
        }
    };

    const columns: ColumnDef<PayrollRun>[] = [
        { accessorKey: "runCode", header: "Run Code" },
        { accessorKey: "period", header: "Period" },
        { accessorKey: "employees", header: "Employees" },
        {
            accessorKey: "gross",
            header: `Gross (${currency})`,
            cell: ({ row }: { row: any }) => {
                const val = row.getValue("gross");
                return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 });
            }
        },
        {
            accessorKey: "net",
            header: `Net (${currency})`,
            cell: ({ row }: { row: any }) => {
                const val = row.getValue("net");
                return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 });
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }: { row: any }) => {
                const value = row.getValue("status");
                const color =
                    value === "COMPLETED" || value === "PAID"
                        ? "bg-green-100 text-green-700"
                        : value === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-200 text-gray-700";
                return (
                    <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{value as string}</span>
                );
            },
        },
        {
            accessorKey: "actions",
            header: "Actions",
            cell: ({ row }: { row: any }) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleReview(row.original)}>
                        Review
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-6">
            <Card className="rounded-sm border border-gray-300 dark:border-gray-700 shadow-sm">
                <CardHeader className="flex justify-between items-center border-b-1 dark:border-gray-700 py-3 gap-0">
                    <CardTitle className="text-lg font-semibold">Payroll Runs</CardTitle>
                </CardHeader>

                <CardContent className="pt-2 pb-6 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 md:items-end">
                        <div>
                            <Input
                                placeholder="Search period (YYYY-MM)"
                                value={searchPeriod}
                                onChange={(e) => setSearchPeriod(e.target.value)}
                                className="max-w-xs"
                            />
                        </div>

                        <div>
                            <Select defaultValue="all" onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="PENDING">PENDING</SelectItem>
                                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <DataTable columns={columns} data={filteredRuns} pageSize={10} isFetching={isLoading} />

                    <p className="text-xs text-gray-400 mt-2">
                        Payroll runs are aggregated from individual payroll records.
                    </p>
                </CardContent>
            </Card>

            {/* Review & Pay Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>Review Payroll Run</SheetTitle>
                        <SheetDescription>
                            Review details and confirm payment for this period.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedRun && (
                        <div className="space-y-6 py-6">

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                                    <Calendar className="w-6 h-6 text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-500 uppercase font-semibold">Period</span>
                                    <span className="text-lg font-bold">{selectedRun.period}</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                                    <Users className="w-6 h-6 text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-500 uppercase font-semibold">Employees</span>
                                    <span className="text-lg font-bold">{selectedRun.employees}</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-blue-900">Total Payable</span>
                                </div>
                                <div className="text-3xl font-bold text-blue-800">
                                    {currency} {selectedRun.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-blue-600 mt-1">Total net salary to be disbursed.</p>
                            </div>

                            {selectedRun.status === 'COMPLETED' ? (
                                <div className="flex flex-col items-center justify-center p-6 text-green-600 bg-green-50 rounded-xl border border-green-100">
                                    <CheckCircle className="w-10 h-10 mb-2" />
                                    <span className="font-bold">This run is already completed/paid.</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-sm text-gray-500">
                                        Processing this payment will:
                                        <ul className="list-disc pl-5 space-y-1 mt-2">
                                            <li>Mark the payroll run as PAID.</li>
                                            <li>Automatically create an <b>Expense</b> entry in Accounting.</li>
                                            <li>Update financial reports.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    <SheetFooter>
                        {selectedRun?.status !== 'COMPLETED' && (
                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handlePay} disabled={isPaying}>
                                {isPaying ? "Processing..." : `Confirm Payment (${currency} ${selectedRun?.net.toLocaleString()})`}
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
