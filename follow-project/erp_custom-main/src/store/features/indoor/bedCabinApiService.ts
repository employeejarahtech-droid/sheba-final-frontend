import { baseApi } from "@/store/baseApi";

export interface BedCabin {
  id: number;
  code: string;
  type: 'Bed' | 'Cabin' | 'Special';
  ward: string;
  price: number;
  status: 'Available' | 'Occupied' | 'Maintenance';
  created_at?: string;
  updated_at?: string;
}

type BedCabinListResponse = {
  status: boolean;
  message: string;
  data: {
    items: BedCabin[];
    meta: {
      total: number;
      page: number;
      limit: number;
    };
  };
};

type BedCabinResponse = {
  status: boolean;
  message: string;
  data: BedCabin;
};

export const bedCabinApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createBedCabin: builder.mutation<BedCabinResponse, Partial<BedCabin>>({
      query: (body) => ({
        url: "/bed-cabin",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BedCabin"],
    }),
    getAllBedCabins: builder.query<
      BedCabinListResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page, limit, search }) => ({
        url: `/bed-cabin?page=${page}&limit=${limit}&search=${search}`,
        method: "GET",
      }),
      providesTags: ["BedCabin"],
    }),
    getBedCabinById: builder.query<BedCabinResponse, number>({
      query: (id) => ({
        url: `/bed-cabin/${id}`,
        method: "GET",
      }),
      providesTags: ["BedCabin"],
    }),
    updateBedCabin: builder.mutation<
      BedCabinResponse,
      { id: number; body: Partial<BedCabin> }
    >({
      query: ({ id, body }) => ({
        url: `/bed-cabin/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["BedCabin"],
    }),
    deleteBedCabin: builder.mutation<BedCabinResponse, number>({
      query: (id) => ({
        url: `/bed-cabin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BedCabin"],
    }),
  }),
});

export const {
  useCreateBedCabinMutation,
  useGetAllBedCabinsQuery,
  useGetBedCabinByIdQuery,
  useUpdateBedCabinMutation,
  useDeleteBedCabinMutation,
} = bedCabinApiService;
