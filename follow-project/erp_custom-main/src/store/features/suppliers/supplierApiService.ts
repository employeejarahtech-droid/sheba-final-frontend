import { baseApi } from "@/store/baseApi";
import type { Supplier } from "@/types/supplier.types";



export type SupplierSingleResponse = {
  status: boolean;
  message: string;
  data: Supplier;            // ALWAYS SINGLE OBJECT
};




export type SupplierListResponse = {
  status: boolean;
  message: string;
  data: Supplier[];          // ALWAYS ARRAY FOR LIST
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};






export const supplierApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET ALL SUPPLIERS
    getAllSuppliers: builder.query<SupplierListResponse, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: "/suppliers",
        method: "GET",
        params
      }),
      providesTags: ["Suppliers"],
    }),

    // ADD SUPPLIER
    addSupplier: builder.mutation<SupplierSingleResponse, Partial<Supplier>>({
      query: (body) => ({
        url: "/suppliers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Suppliers"],
    }),

    // GET SINGLE SUPPLIER BY ID
    getSupplierById: builder.query<SupplierSingleResponse, string | number>({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: "GET",
      }),
      providesTags: ["Suppliers"],
    }),

    // UPDATE SUPPLIER
    updateSupplier: builder.mutation<
      SupplierSingleResponse,
      { id: string | number; body: Partial<Supplier> }
    >({
      query: ({ id, body }) => ({
        url: `/suppliers/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Suppliers"],
    }),

    // DELETE SUPPLIER
    deleteSupplier: builder.mutation<SupplierSingleResponse, string | number>({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Suppliers"],
    }),

  }),
});

export const {
  useGetAllSuppliersQuery,
  useAddSupplierMutation,
  useGetSupplierByIdQuery,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = supplierApiService;
