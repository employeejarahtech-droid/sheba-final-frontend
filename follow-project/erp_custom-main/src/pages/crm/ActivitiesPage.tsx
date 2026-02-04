/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";

export default function ActivitiesPage() {
  // Mock activities data
  const activities = [
    {
      type: "CALL",
      subject: "Follow up Speedex Express proposal",
      relatedTo: "Opportunity OP-2025-003",
      owner: "Abdullah",
      due: "2025-01-18 10:30",
      status: "OPEN",
    },
    {
      type: "MEETING",
      subject: "Demo for Yazhi Manufacturing",
      relatedTo: "Lead L-2025-010",
      owner: "Abdullah",
      due: "2025-01-19 15:00",
      status: "OPEN",
    },
  ];

  // Table columns
  const columns = [
    { accessorKey: "type", header: "Type" },
    { accessorKey: "subject", header: "Subject" },
    { accessorKey: "relatedTo", header: "Related To" },
    { accessorKey: "owner", header: "Owner" },
    { accessorKey: "due", header: "Due / When" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const value = row.getValue("status");
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${
              value === "OPEN"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {value}
          </span>
        );
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6">
      <Card className="rounded-sm border border-gray-300 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Activities (Calls, Meetings, Emails, Tasks)
          </CardTitle>
          <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            + New Activity
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Owner</label>
              <select className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-2">
                <option value="all">All</option>
                <option value="Abdullah">Abdullah</option>
                <option value="Team A">Team A</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-2">
                <option value="all">All</option>
                <option value="CALL">CALL</option>
                <option value="MEETING">MEETING</option>
                <option value="EMAIL">EMAIL</option>
                <option value="TASK">TASK</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Due</label>
              <select className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-2">
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <DataTable columns={columns} data={activities} pageSize={10} />

          <p className="text-gray-400 text-xs mt-4">
            Activities are stored in <code>crm_activities</code> with type, owner,
            due date and completion status.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
