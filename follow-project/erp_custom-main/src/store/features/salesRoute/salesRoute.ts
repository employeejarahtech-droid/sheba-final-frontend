import { baseApi } from "@/store/baseApi";
import type { SalesRoute } from "@/types/salesRoute.types";

// ----------------------
// Types
// ----------------------

export interface SalesRoutePagination {
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}

export interface SalesRouteResponse<T> {
  status: boolean;
  message: string;
  pagination?: SalesRoutePagination;
  data: T;
}


interface AssignStaffRequestBody {
  staff_ids: number[];
}

// ----------------------
// RTK Query Service
// ----------------------

export const salesRouteApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET ALL SALES ROUTES
    getAllSalesRoute: builder.query<
      SalesRouteResponse<SalesRoute[]>,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({
        url: "/sales/routes",
        method: "GET",
        params,
      }),
      providesTags: ["SalesRoute"],
    }),

    // CREATE SALES ROUTE
    addSalesRoute: builder.mutation<
      SalesRouteResponse<SalesRoute>,
      Partial<SalesRoute>
    >({
      query: (body) => ({
        url: "/sales/sales-route",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SalesRoute"],
    }),

    // GET SINGLE SALES ROUTE
    getSalesRouteById: builder.query<
      SalesRouteResponse<SalesRoute>,
      string | number
    >({
      query: (id) => ({
        url: `/sales/sales-route/${id}`,
        method: "GET",
      }),
      providesTags: ["SalesRoute"],
    }),

    // UPDATE SALES ROUTE
    updateSalesRoute: builder.mutation<
      SalesRouteResponse<SalesRoute>,
      { id: string | number; body: Partial<SalesRoute> }
    >({
      query: ({ id, body }) => ({
        url: `/sales/sales-route/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["SalesRoute"],
    }),

    // UPDATE SALES ROUTE
    assignStaff: builder.mutation<
      SalesRouteResponse<void>,
      { routeId: string | number; body: AssignStaffRequestBody }
    >({
      query: ({ routeId, body }) => ({
        url: `/sales/sales-route/${routeId}/assign`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["SalesRoute", "staffRoutes"],
    }),

    // DELETE SALES ROUTE
    deleteSalesRoute: builder.mutation<
      SalesRouteResponse<SalesRoute>,
      string | number
    >({
      query: (id) => ({
        url: `/sales/sales-route/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SalesRoute"],
    }),

  }),
});

// ----------------------
// Hooks
// ----------------------

export const {
  useGetAllSalesRouteQuery,
  useAddSalesRouteMutation,
  useGetSalesRouteByIdQuery,
  useUpdateSalesRouteMutation,
  useDeleteSalesRouteMutation,
  useAssignStaffMutation
} = salesRouteApiService;
