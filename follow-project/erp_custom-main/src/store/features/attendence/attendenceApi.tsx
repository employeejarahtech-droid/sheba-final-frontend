/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseApi } from "@/store/baseApi";
import type { Attendance } from "@/types/Attendence";


type AttendanceResponse = {
  status: boolean;
  message: string;
  data: Attendance | Attendance[];
};

export const attendanceApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // CHECK-IN
    checkIn: builder.mutation<AttendanceResponse, any>({
      query: (body) => ({
        url: "/attendance/check-in",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),

    // CHECK-OUT
    checkOut: builder.mutation<AttendanceResponse, any>({
      query: (body) => ({
        url: "/attendance/check-out",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),

    // GET ALL ATTENDANCE
    getAllAttendance: builder.query<AttendanceResponse, void>({
      query: () => ({
        url: "/attendance",
        method: "GET",
      }),
      providesTags: ["Attendance"],
    }),

    // GET SINGLE ATTENDANCE BY ID
    getAttendanceById: builder.query<AttendanceResponse, number>({
      query: (id) => ({
        url: `/attendance/${id}`,
        method: "GET",
      }),
      providesTags: ["Attendance"],
    }),

    // UPDATE ATTENDANCE
    updateAttendance: builder.mutation<AttendanceResponse, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/attendance/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),

    // DELETE ATTENDANCE
    deleteAttendance: builder.mutation<AttendanceResponse, number>({
      query: (id) => ({
        url: `/attendance/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Attendance"],
    }),

  }),
});

export const {
  useCheckInMutation,
  useCheckOutMutation,
  useGetAllAttendanceQuery,
  useGetAttendanceByIdQuery,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
} = attendanceApiService;
