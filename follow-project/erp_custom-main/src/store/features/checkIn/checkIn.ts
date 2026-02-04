// import { baseApi } from "@/store/baseApi";

// // Types for attendance API
// export type AttendanceItem = {
//   id: number;
//   staff_id: number;
//   customer_id?: number;
//   date: string;
//   check_in: string | null;
//   check_out?: string | null;
//   status?: string | null;
//   notes?: string | null;
//   latitude?: number;
//   longitude?: number;
//   created_by?: number;
//   created_at?: string;
//   updated_at?: string;
//   total_hours?: number;
//   staff?: {
//     id: number;
//     first_name: string;
//     last_name: string;
//     email?: string;
//   };
//   customer?: {
//     id: number;
//     name: string;
//     location: string;
//     phone?: string;
//     email?: string;
//   };
// };

// export type Pagination = {
//   total: number;
//   page: number;
//   limit: number;
//   totalPage: number;
// };

// export type CheckinListResponse = {
//   success: boolean;
//   message?: string;
//   pagination?: Pagination;
//   data: AttendanceItem[];
// };

// export const attendanceApi = baseApi.injectEndpoints({
//   endpoints: (builder) => ({
//     getCheckinList: builder.query<CheckinListResponse, { staff_id?: string | number; date?: string; page?: number; limit?: number } | void>({
//       query: (params) => {

//         return {
//           url: `/staff-attendance/checkin-list`,
//           method: 'GET',
//           params: params || undefined
//         };
//       },
//       providesTags: ['Attendance'],
//     }),
//   }),
// });

// export const { useGetCheckinListQuery } = attendanceApi;





import { baseApi } from "@/store/baseApi";
import type { Customer } from "../customers/types";
import type { Staff } from "@/types/types";

/* =======================
   Types
======================= */

export type StaffAttendance = {
  id: number;
  latitude: number;
  longitude: number;
  distance_meters: number;
  customer_id: number;
  staff_id: number;
  check_in_time: string;
  note?: string;
  created_at: string;
  updated_at: string;
  staff?: Staff | null; // null in example, but keeping it flexible
  customer: {
    id: number;
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
};

export type AttendanceResponse<T> = {
  status: boolean;
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

/* =======================
   API Service
======================= */

export const staffAttendanceApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    /* =======================
       GET ALL STAFF ATTENDANCE
       GET /api/staff-attendance
    ======================= */
    getAllStaffAttendance: builder.query<
      AttendanceResponse<StaffAttendance[]>,
      { page?: number; limit?: number; search?: string; date?: string }
    >({
      query: (params) => ({
        url: "/staff-attendance",
        method: "GET",
        params,
      }),
      providesTags: ["StaffCheckIn"],
    }),

    /* =======================
       CREATE STAFF ATTENDANCE
       POST /api/staff-attendance
    ======================= */
    addStaffAttendance: builder.mutation<
      AttendanceResponse<StaffAttendance>,
      Partial<StaffAttendance>
    >({
      query: (body) => ({
        url: "/staff-attendance",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StaffCheckIn"],
    }),

    /* =======================
       GET SINGLE ATTENDANCE
       GET /api/staff-attendance/:id
    ======================= */
    getStaffAttendanceById: builder.query<
      AttendanceResponse<StaffAttendance>,
      string | number
    >({
      query: (id) => ({
        url: `/staff-attendance/${id}`,
        method: "GET",
      }),
      providesTags: ["StaffCheckIn"],
    }),

    /* =======================
       UPDATE ATTENDANCE
       PUT /api/staff-attendance/:id
    ======================= */
    updateStaffAttendance: builder.mutation<
      AttendanceResponse<StaffAttendance>,
      { id: string | number; body: Partial<StaffAttendance> }
    >({
      query: ({ id, body }) => ({
        url: `/staff-attendance/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["StaffCheckIn"],
    }),

    /* =======================
       DELETE ATTENDANCE
       DELETE /api/staff-attendance/:id
    ======================= */
    deleteStaffAttendance: builder.mutation<
      AttendanceResponse<StaffAttendance>,
      string | number
    >({
      query: (id) => ({
        url: `/staff-attendance/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StaffCheckIn"],
    }),

    /* =======================
       CHECK-IN
       POST /api/staff-attendance/check-in
    ======================= */
    staffCheckIn: builder.mutation<
      AttendanceResponse<StaffAttendance>,
      {
        customer_id: number;
        staff_id: number;
        check_in_time: string;
        latitude: number;
        longitude: number;
        distance_meters: number;
        note?: string;
      }
    >({
      query: (body) => ({
        url: "/staff-attendance/check-in",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StaffCheckIn"],
    }),

    /* =======================
       GET CHECK-IN DETAILS
       GET /api/staff-attendance/check-in/:id
    ======================= */
    getCheckInById: builder.query<
      AttendanceResponse<StaffAttendance>,
      string | number
    >({
      query: (id) => ({
        url: `/staff-attendance/check-in/${id}`,
        method: "GET",
      }),
      providesTags: ["StaffCheckIn"],
    }),

    // GET CUSTOMER LIST WITH STAFF CHECK-INS BY DATE
    getCustomerCheckInListByDate: builder.query<
      AttendanceResponse<Customer[]>,
      {
        date: string;
        page?: number;
        limit?: number;
        search?: string;
      }
    >({
      query: ({ date, page = 1, limit = 10, search }) => ({
        url: `/staff-attendance/customer-list/${date}`,
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["StaffCheckIn"],
    }),


  }),
});

/* =======================
   Hooks Export
======================= */

export const {
  useGetAllStaffAttendanceQuery,
  useAddStaffAttendanceMutation,
  useGetStaffAttendanceByIdQuery,
  useUpdateStaffAttendanceMutation,
  useDeleteStaffAttendanceMutation,
  useStaffCheckInMutation,
  useGetCheckInByIdQuery,
  useGetCustomerCheckInListByDateQuery,
} = staffAttendanceApiService;
