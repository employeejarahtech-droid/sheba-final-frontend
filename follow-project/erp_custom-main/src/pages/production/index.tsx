import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Activity,
    CheckCircle2,
    Clock,
    Layers,
    ArrowUpRight,
} from "lucide-react";

export default function ProductionDashboard() {
    const stats = [
        {
            label: "Active Productions",
            value: 8,
            change: "+2 from yesterday",
            icon: <Activity className="w-5 h-5 text-blue-600" />,
            className: "border-l-4 border-blue-600",
        },
        {
            label: "Pending / Planned",
            value: 4,
            change: "On schedule",
            icon: <Clock className="w-5 h-5 text-orange-600" />,
            className: "border-l-4 border-orange-600",
        },
        {
            label: "Completed Today",
            value: 12,
            change: "+15% vs last week",
            icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
            className: "border-l-4 border-green-600",
        },
        {
            label: "Total Batches",
            value: 156,
            change: "This month",
            icon: <Layers className="w-5 h-5 text-purple-600" />,
            className: "border-l-4 border-purple-600",
        },
    ];

    const recentActivity = [
        { id: 1, action: "Batch #B-205 started", time: "10 mins ago", User: "John Doe" },
        { id: 2, action: "Batch #B-201 completed", time: "1 hour ago", User: "Jane Smith" },
        { id: 3, action: "Material Request #MR-55 approved", time: "2 hours ago", User: "Admin" },
        { id: 4, action: "Batch #B-206 scheduled", time: "4 hours ago", User: "Manager" },
    ];

    return (
        <div className="w-full space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Production Overview</h2>
                <p className="text-gray-500">Real-time insights into your manufacturing process.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} className={`shadow-sm ${stat.className}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                {stat.label}
                            </CardTitle>
                            {stat.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                                {stat.change && <ArrowUpRight className="w-3 h-3 mr-1" />} {stat.change}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates from the production floor.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <div>
                                            <p className="text-sm font-medium leading-none">{activity.action}</p>
                                            <p className="text-xs text-gray-500 mt-1">by {activity.User}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400">{activity.time}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Production Line Status</CardTitle>
                        <CardDescription>Current status of active lines.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Dummy Progress Bars */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Line A (T-Shirts)</span>
                                    <span className="text-gray-500">75%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[75%]"></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Line B (Denim)</span>
                                    <span className="text-gray-500">45%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[45%]"></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Line C (Jackets)</span>
                                    <span className="text-gray-500">10%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 w-[10%]"></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
