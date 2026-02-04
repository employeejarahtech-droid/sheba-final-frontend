import { baseApi } from "@/store/baseApi";
import type { Staff } from "@/types/staff.types";


export type StaffResponse<T> = {
  status: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};



export type StaffQueryParams = {
  page?: number;         // Page number, default 1
  limit?: number;        // Items per page, default 10
  status?: "active" | "inactive" | "terminated" | "on_leave"; // Status filter
  department?: string;   // Department filter
  search?: string;       // Search by name, email, or position
};






export type RouteStatus = "Active" | "Pending";

export interface Route {
  id: number;
  name: string;
  status: RouteStatus;
  orders: number;
}

export interface StaffStats {
  completedOrders: number;
  rating: number;
}

export interface StaffWiseRoutes {
  id: number;
  name: string;
  role: "Sales Representative" | "Delivery Driver" | "Area Manager";
  email: string;
  phone: string;
  active: boolean;
  routes: Route[];
  stats: StaffStats;
}














export const staffApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET ALL STAFFS
    getAllStaffs: builder.query<StaffResponse<Staff[]>, StaffQueryParams>({
      query: (params) => ({
        url: "/staffs",
        method: "GET",
        params
      }),
      providesTags: ["Staffs"],
    }),

    // ADD STAFF
    addStaff: builder.mutation<StaffResponse<Staff>, Partial<Staff>>({
      query: (body) => ({
        url: "/staffs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Staffs"],
    }),

    // GET SINGLE STAFF BY ID
    getStaffById: builder.query<StaffResponse<Staff>, string | number>({
      query: (id) => ({
        url: `/staffs/${id}`,
        method: "GET",
      }),
      providesTags: ["Staffs"],
    }),

    // UPDATE STAFF
    updateStaff: builder.mutation<StaffResponse<Staff>, { id: string | number; body: Partial<Staff> }>({
      query: ({ id, body }) => ({
        url: `/staffs/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Staffs"],
    }),

    // DELETE STAFF
    deleteStaff: builder.mutation<StaffResponse<Staff>, string | number>({
      query: (id) => ({
        url: `/staffs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staffs"],
    }),

    // Staff wise routes
    getAllStaffWiseRoutes: builder.query<StaffResponse<StaffWiseRoutes[]>, StaffQueryParams>({
      query: (params) => ({
        url: "/staffs/routes",
        method: "GET",
        params
      }),
      providesTags: ["staffRoutes"],
    }),

    // UPDATE PAYROLL STRUCTURE
    updatePayrollStructure: builder.mutation<StaffResponse<Staff>, { id: string | number; body: any }>({
      query: ({ id, body }) => ({
        url: `/payroll/structure/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Staffs", "PayrollStructure"],
    }),

    // GET PAYROLL STRUCTURE
    getPayrollStructure: builder.query<StaffResponse<any>, string | number>({
      query: (id) => ({
        url: `/payroll/structure/${id}`,
        method: "GET",
      }),
      providesTags: ["PayrollStructure"],
    }),

  }),
});

export const {
  useGetAllStaffsQuery,
  useAddStaffMutation,
  useGetStaffByIdQuery,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetAllStaffWiseRoutesQuery,
  useUpdatePayrollStructureMutation,
  useGetPayrollStructureQuery,
} = staffApiService;
