import { Analytics } from "@/components/dashboard/components/Analytics";
import { Overview } from "@/components/dashboard/components/Overview";
import RecentCustomers from "@/components/dashboard/components/RecentCustomers";
import RecentOrders from "@/components/dashboard/components/RecentOrders";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DashboardPermission, SuperAdminPermission } from "@/config/permissions";
import {
  useGetDashboardStatsQuery,
  type DashboardStats,
} from "@/store/features/admin/dashboardApiService";
import { useAppSelector } from "@/store/store";
import { ShoppingCart, Users, DollarSign, Clock, AlertTriangle, UserCheck } from "lucide-react";
import { Link } from "react-router";

export default function Dashboard() {

  const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);

  // Units permissions
  const canGraphShow = userPermissions.includes(DashboardPermission.GRAPH) || userPermissions.includes(SuperAdminPermission.ACCESS_ALL);
  const canRecentCustomersListShow = userPermissions.includes(DashboardPermission.RECENT_CUSTOMERS_LIST) || userPermissions.includes(SuperAdminPermission.ACCESS_ALL);
  const canRecentSalesListShow = userPermissions.includes(DashboardPermission.RECENT_SALES_LIST) || userPermissions.includes(SuperAdminPermission.ACCESS_ALL);
  const canStatsShow = userPermissions.includes(DashboardPermission.STATS) || userPermissions.includes(SuperAdminPermission.ACCESS_ALL);





  const { data: dashboardStatsData } = useGetDashboardStatsQuery();

  const dashboardStats: DashboardStats | undefined = dashboardStatsData?.data;
  // console.log('dashboardStats', dashboardStats);
  const currency = useAppSelector((state) => state.currency.value);
  // Stats configuration
  const stats = [
    {
      label: "Total Revenue",
      value: `${currency} ${dashboardStats?.revenue || 0}`,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <DollarSign className="w-6 h-6 text-white" />,
    },
    {
      label: "Total Orders",
      value: dashboardStats?.totalOrders || 0,
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <ShoppingCart className="w-6 h-6 text-white" />,
    },
    {
      label: "Pending Orders",
      value: dashboardStats?.pendingOrders || 0,
      gradient: "from-amber-600 to-amber-400",
      shadow: "shadow-amber-500/30",
      icon: <Clock className="w-6 h-6 text-white" />,
    },
    {
      label: "Active Customers",
      value: dashboardStats?.activeCustomers || 0,
      gradient: "from-violet-600 to-violet-400",
      shadow: "shadow-violet-500/30",
      icon: <Users className="w-6 h-6 text-white" />,
    },
    {
      label: "Low Stock",
      value: dashboardStats?.lowStock || 0,
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <AlertTriangle className="w-6 h-6 text-white" />,
    },
    {
      label: "Active Staff",
      value: dashboardStats?.activeStaff || 0,
      gradient: "from-cyan-600 to-cyan-400",
      shadow: "shadow-cyan-500/30",
      icon: <UserCheck className="w-6 h-6 text-white" />,
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <Tabs
        orientation="vertical"
        defaultValue="overview"
        className="space-y-4"
      >
        <TabsContent value="overview" className="space-y-8">
          {/* Stats Cards */}
          {canStatsShow && <div className="flex flex-wrap gap-4">
            {stats.map((item, idx) => (
              <div
                key={idx}
                className={`relative flex-1 min-w-[200px] overflow-hidden rounded-2xl bg-linear-to-r ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.05] hover:-translate-y-1`}
              >
                {/* Background Pattern */}
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-black/10 blur-2xl" />

                <div className="relative flex flex-col justify-between h-full space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {item.value}
                    </h3>
                    <p className="text-xs font-medium text-white/80 uppercase tracking-wider mt-1">{item.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>}

          {
            canGraphShow && <div className="col-span-1 lg:col-span-4"><Card className="py-6">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>January - December {new Date().getFullYear()}</CardDescription>
              </CardHeader>
              <CardContent className="ps-2">
                <Overview />
              </CardContent>
            </Card>
            </div>
          }


          {canRecentCustomersListShow && <Card className="col-span-1 lg:col-span-3 py-6">
            <CardHeader className="flex justify-between gap-4">
              <div>
                <CardTitle>Recent Customers</CardTitle>
                <CardDescription>Latest signups</CardDescription>
              </div>
              <Link to="/dashboard/customers">
                <button className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
                  View All
                </button>
              </Link>
            </CardHeader>
            <CardContent>
              <RecentCustomers />
            </CardContent>
          </Card>}
          {
            canRecentSalesListShow && <Card className="pt-6 pb-2">
              <CardHeader className="flex justify-between gap-4 items-center">
                <div>
                  <CardTitle>Recent Sales Orders</CardTitle>
                  <CardDescription>Manage your orders</CardDescription>
                </div>
                <Link to="/dashboard/sales/orders">
                  <button className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
                    View All Orders
                  </button>
                </Link>
              </CardHeader>
              <CardContent>
                <RecentOrders />
              </CardContent>
            </Card>
          }
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Analytics />
        </TabsContent>
      </Tabs>
    </>
  );
}
