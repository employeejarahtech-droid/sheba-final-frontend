import { baseApi } from "@/store/baseApi";
import type { Role } from "@/types/users.types";



export type RoleResponse<T> = {
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




export const roleApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET ALL ROLES (GET /list)
    getAllRoles: builder.query<RoleResponse<Role[]>, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: "/roles/list",
        method: "GET",
        params
      }),
      providesTags: ["Roles"],
    }),

    // ADD ROLE (POST /add)
    addRole: builder.mutation<RoleResponse<Role>, Partial<Role>>({
      query: (body) => ({
        url: "/roles/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Roles","Role"],
    }),

    // GET SINGLE ROLE (GET /get/:id)
    getRoleById: builder.query<RoleResponse<Role>, string | number>({
      query: (id) => ({
        url: `/roles/get/${id}`,
        method: "GET",
      }),
      providesTags: ["Role"],
    }),

    // UPDATE ROLE (PUT /update/:id)
    updateRole: builder.mutation<
      RoleResponse<Role>,
      { roleId: string | number; body: Partial<Role> }
    >({
      query: ({ roleId, body }) => ({
        url: `/roles/update/${roleId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Roles","Role"],
    }),

    // DELETE ROLE (DELETE /delete/:id)
    deleteRole: builder.mutation<RoleResponse<Role>, string | number>({
      query: (id) => ({
        url: `/roles/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roles","Role"],
    }),

  }),
});

export const {
  useGetAllRolesQuery,
  useAddRoleMutation,
  useGetRoleByIdQuery,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApiService;
