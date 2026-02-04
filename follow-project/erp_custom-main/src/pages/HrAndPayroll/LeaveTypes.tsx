import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/components/DataTable";

export default function LeaveTypes() {
    const types = [
        { name: "Annual Leave", days: 14, paid: "Yes" },
        { name: "Sick Leave", days: 14, paid: "Yes" },
        { name: "Unpaid Leave", days: 30, paid: "No" },
    ];

    const columns = [
        { accessorKey: "name", header: "Leave Type" },
        { accessorKey: "days", header: "Days Allowed" },
        { accessorKey: "paid", header: "Is Paid?" },
    ];

    return (
        <div className="max-w-6xl mx-auto py-6">
            <Card>
                <CardHeader>
                    <CardTitle>Leave Types Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={types} pageSize={10} />
                </CardContent>
            </Card>
        </div>
    );
}
