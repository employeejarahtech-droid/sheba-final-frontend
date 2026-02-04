import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/components/DataTable";
import { Badge } from "@/components/ui/badge";

export default function LeaveRequests() {
    const requests = [
        { id: 101, staff: "John Doe", type: "Annual Leave", dates: "2025-01-20 to 2025-01-22", status: "Pending" },
        { id: 102, staff: "Jane Smith", type: "Sick Leave", dates: "2025-01-15", status: "Approved" },
    ];

    const columns = [
        { accessorKey: "staff", header: "Staff Member" },
        { accessorKey: "type", header: "Leave Type" },
        { accessorKey: "dates", header: "Dates" },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }: any) => {
                const status = row.getValue("status");
                const color = status === "Approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
                return <Badge className={color}>{status}</Badge>
            }
        },
    ];

    return (
        <div className="max-w-6xl mx-auto py-6">
            <Card>
                <CardHeader>
                    <CardTitle>Leave Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={requests} pageSize={10} />
                </CardContent>
            </Card>
        </div>
    );
}
