import type { AuthUserResponse, LoginRequest, LoginResponse } from "./types";
import { baseApi } from "@/store/baseApi";
import type { User } from "@/types/users.types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    authLogin: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    authUser: builder.query<AuthUserResponse, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),
    updateProfile: builder.mutation<AuthUserResponse, Partial<User>>({
      query: (body) => ({
        url: "/auth/profile",
        method: "PUT", // Assuming PUT for updates
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    authLogout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
});

export const { useAuthLoginMutation, useAuthLogoutMutation, useAuthUserQuery, useUpdateProfileMutation } = authApi;
