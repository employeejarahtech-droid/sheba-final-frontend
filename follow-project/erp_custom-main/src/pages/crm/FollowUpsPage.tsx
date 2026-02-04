/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/components/DataTable";

export default function FollowUpsPage() {
  // Mock follow-ups data
  const followUps = [
    {
      leadOrOpportunity: "Speedex Express – CRM",
      action: "Follow-up call after proposal sent",
      dueAt: "2025-01-18 10:30",
      owner: "Abdullah",
      status: "OPEN",
    },
    {
      leadOrOpportunity: "Yazhi Manufacturing – Demo",
      action: "Send updated pricing deck",
      dueAt: "2025-01-19 17:00",
      owner: "Abdullah",
      status: "OPEN",
    },
  ];

  // Table columns
  const columns = [
    { accessorKey: "leadOrOpportunity", header: "Lead / Opportunity" },
    { accessorKey: "action", header: "Action" },
    { accessorKey: "dueAt", header: "Due At" },
    { accessorKey: "owner", header: "Owner" },
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
    <div className="max-w-5xl mx-auto py-6">
      <Card className="rounded-sm border border-gray-300 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Follow-ups & Reminders
          </CardTitle>
          <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            + New Follow-up
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Filters */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">View</label>
              <select className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-2">
                <option value="my">My Follow-ups</option>
                <option value="team">Team Follow-ups</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Time Frame</label>
              <select className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-2">
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Owner</label>
              <select className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-2">
                <option value="all">All</option>
                <option value="Abdullah">Abdullah</option>
                <option value="Team A">Team A</option>
              </select>
            </div>
          </div>

          {/* Follow-ups Table */}
          <DataTable columns={columns} data={followUps} pageSize={10} />

          <p className="text-gray-400 text-xs mt-4">
            Follow-ups are implemented using <code>crm_activities</code> with <code>due_at</code> +
            <code>reminder_at</code> and <code>status="OPEN"</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
