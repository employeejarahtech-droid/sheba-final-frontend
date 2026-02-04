import { baseApi } from "@/store/baseApi";

export type DashboardStats = {
    totalOrders: number;
    pendingOrders: number;
    activeCustomers: number;
    lowStock: number;
    revenue: number;
    activeStaff: number;
}

type DashboardStatsResponse = {
  status: boolean;
  message: string;
  data: DashboardStats;
};

export const dashboardApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStatsResponse, void>({
      query: () => ({
        url: `/dashboard`,
        method: "GET",
      }),
      providesTags: ["Stats"],
    }),
    getDashboardCharts: builder.query({
      query: () => ({
        url: `/dashboard/charts`,
        method: "GET",
      }),
      providesTags: ["Stats"],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetDashboardChartsQuery

} = dashboardApiService;
