import { baseApi } from "@/store/baseApi";
import type { User } from "@/types/users.types";


export type UserResponse = {
  success: boolean;
  status: boolean;
  message: string;
  data: User | User[];
  pagination?:{
        total: number,
        page: number,
        limit: number,
        totalPage: number
    },
};


type UserParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export const userApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET ALL USERS
    getAllUsers: builder.query<UserResponse, UserParams>({
      query: (params) => ({
        url: "/users",
        method: "GET",
        params,
      }),
      providesTags: ["Users"],
    }),

    // ADD USER (POST /add)
    addUser: builder.mutation<UserResponse, Partial<User>>({
      query: (body) => ({
        url: "/users/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    // GET SINGLE USER BY ID
    getUserById: builder.query<UserResponse, string | number>({
      query: (id) => ({
        url: `/users/get/${id}`,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),

    // UPDATE USER (PUT /update/:id)
    updateUser: builder.mutation<
      UserResponse,
      { id: string | number; body: Partial<User> }
    >({
      query: ({ id, body }) => ({
        url: `/users/update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    // DELETE USER (DELETE /delete/:id)
    deleteUser: builder.mutation<UserResponse, string | number>({
      query: (id) => ({
        url: `/users/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

  }),
});

export const {
  useGetAllUsersQuery,
  useAddUserMutation,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApiService;
