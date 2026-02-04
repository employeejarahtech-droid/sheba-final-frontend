import { baseApi } from "@/store/baseApi";
import type { Department } from "@/types/types";

type DepartmentResponse = {
  status: boolean;
  message: string;
  data: Department[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

type DepartmentByIdResponse = {
  status: boolean;
  message: string;
  data: Department;
};

export const departmentApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    addDepartment: builder.mutation<DepartmentResponse, Partial<Department>>({
      query: (body) => ({
        url: "/departments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Departments"],
    }),
    getAllDepartments: builder.query<
      DepartmentResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page, limit, search }) => ({
        url: `/departments?page=${page}&limit=${limit}&search=${search}`,
        method: "GET",
      }),
      providesTags: ["Departments"],
    }),

    getDepartmentById: builder.query<DepartmentByIdResponse, number>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: "GET",
      }),
      providesTags: ["Departments"],
    }),
    updateDepartment: builder.mutation<
      DepartmentResponse,
      { id: number; body: Partial<Department> }
    >({
      query: (body) => ({
        url: `/departments/${body.id}`,
        method: "PUT",
        body: body.body,
      }),
      invalidatesTags: ["Departments"],
    }),
    deleteDepartment: builder.mutation<DepartmentResponse, number>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Departments"],
    }),
  }),
});

export const {
  useAddDepartmentMutation,
  useGetAllDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApiService;
