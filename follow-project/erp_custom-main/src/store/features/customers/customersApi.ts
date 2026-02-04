import { baseApi } from "../../baseApi";
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  GetCustomersParams,
  GetCustomersResponse,
  CustomerResponse,
  DeleteCustomerResponse,
  GetCustomerMapsResponse,
} from "./types";

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerStats: builder.query({
      query: () => ({
        url: "/customers/stats",
        method: "GET",
      }),

      providesTags: [{ type: "Customers", id: "STATS" }],
    }),
    // -----------------------------------------
    // GET ALL CUSTOMERS (direct params)
    // ------------------------------------------
    getCustomers: builder.query<
      GetCustomersResponse,
      GetCustomersParams | void
    >({
      query: (params) => ({
        url: "/customers",
        method: "GET",
        params: params || {}, // 👈 FIX: always object, never undefined
      }),

      providesTags: (result) =>
        result
          ? [
            ...result.data.map(({ id }) => ({
              type: "Customers" as const,
              id,
            })),
            { type: "Customers", id: "LIST" },
          ]
          : [{ type: "Customers", id: "LIST" }],
    }),

    // ------------------------------------------
    // GET SINGLE CUSTOMER
    // ------------------------------------------
    getCustomerById: builder.query<CustomerResponse, number | string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [{ type: "Customers", id }],
    }),

    // ------------------------------------------
    // CREATE CUSTOMER
    // ------------------------------------------
    createCustomer: builder.mutation<CustomerResponse, CreateCustomerRequest>({
      query: (data) => ({
        url: "/customers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Customers", id: "LIST" }, { type: "Customers", id: "STATS" }],
    }),

    // ------------------------------------------
    // UPDATE CUSTOMER
    // ------------------------------------------
    updateCustomer: builder.mutation<
      CustomerResponse,
      { id: number | string; data: UpdateCustomerRequest }
    >({
      query: ({ id, data }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Customers", id },
        { type: "Customers", id: "LIST" },
        { type: "Customers", id: "STATS" },
      ],
    }),

    // ------------------------------------------
    // DELETE CUSTOMER
    // ------------------------------------------
    deleteCustomer: builder.mutation<DeleteCustomerResponse, number | string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Customers", id: "LIST" }, { type: "Customers", id: "STATS" }],
    }),

    // ------------------------------------------
    // GET MAP DATA
    // ------------------------------------------
    getCustomerMaps: builder.query<GetCustomerMapsResponse, void>({
      query: () => ({
        url: "/customers/maps",
        method: "GET",
      }),
      providesTags: [{ type: "Customers", id: "MAP" }],
    }),

    // ------------------------------------------
    // inactive customer 
    // ------------------------------------------
    getInactiveCustomers: builder.query<
      GetCustomersResponse,
      GetCustomersParams | void
    >({
      query: (params) => ({
        url: "/customers/inactive",
        method: "GET",
        params: params || {},
      }),

      providesTags: (result) =>
        result
          ? [
            ...result.data.map(({ id }) => ({
              type: "Customers" as const,
              id,
            })),
            { type: "Customers", id: "LIST" },
          ]
          : [{ type: "Customers", id: "LIST" }],
    }),
    // ------------------------------------------
    // inactive customer 
    // ------------------------------------------
    getActiveCustomers: builder.query<
      GetCustomersResponse,
      GetCustomersParams | void
    >({
      query: (params) => ({
        url: "/customers/active",
        method: "GET",
        params: params || {},
      }),

      providesTags: (result) =>
        result
          ? [
            ...result.data.map(({ id }) => ({
              type: "Customers" as const,
              id,
            })),
            { type: "Customers", id: "LIST" },
          ]
          : [{ type: "Customers", id: "LIST" }],
    }),


  }),
});

export const {
  useGetCustomerStatsQuery,
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerMapsQuery,
  useGetInactiveCustomersQuery,
  useGetActiveCustomersQuery
} = customersApi;
