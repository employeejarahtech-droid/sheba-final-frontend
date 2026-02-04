import { baseApi } from "@/store/baseApi";
import type { Leave } from "@/types/leave.types";


export type LeaveResponse = {
  status: boolean;
  message: string;
  data: Leave | Leave[];
};

export const leaveApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET ALL LEAVES
    getAllLeaves: builder.query<LeaveResponse, void>({
      query: () => ({
        url: "/leaves",
        method: "GET",
      }),
      providesTags: ["Leaves"],
    }),

    // CREATE LEAVE
    addLeave: builder.mutation<LeaveResponse, Partial<Leave>>({
      query: (body) => ({
        url: "/leaves",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Leaves"],
    }),

    // GET SINGLE LEAVE BY ID
    getLeaveById: builder.query<LeaveResponse, number>({
      query: (id) => ({
        url: `/leaves/${id}`,
        method: "GET",
      }),
      providesTags: ["Leaves"],
    }),

    // UPDATE LEAVE (PUT /:id)
    updateLeave: builder.mutation<
      LeaveResponse,
      { id: number; body: Partial<Leave> }
    >({
      query: ({ id, body }) => ({
        url: `/leaves/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Leaves"],
    }),

    // UPDATE LEAVE STATUS (PUT /:id/status)
    updateLeaveStatus: builder.mutation<
      LeaveResponse,
      { id: number; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/leaves/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Leaves"],
    }),

    // DELETE LEAVE
    deleteLeave: builder.mutation<LeaveResponse, number>({
      query: (id) => ({
        url: `/leaves/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Leaves"],
    }),

  }),
});

export const {
  useGetAllLeavesQuery,
  useAddLeaveMutation,
  useGetLeaveByIdQuery,
  useUpdateLeaveMutation,
  useUpdateLeaveStatusMutation,
  useDeleteLeaveMutation,
} = leaveApiService;
