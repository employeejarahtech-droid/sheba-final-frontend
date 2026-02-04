import { baseApi } from "@/store/baseApi";

// Interfaces
export interface ProductionBatch {
    id: number;
    product_id: number;
    product?: {
        id: number;
        name: string;
    };
    quantity: number;
    bom_id?: number;
    bom?: BillOfMaterial;
    start_date?: string;
    end_date?: string;
    notes?: string;
    status: "pending" | "in_progress" | "completed" | "cancelled";
    supervisor_id?: number;
    line_id?: string;
    created_at?: string;
    updated_at?: string;
}

export interface BillOfMaterialItem {
    id?: number;
    bom_id?: number;
    product_id: number;
    raw_material?: {
        id: number;
        name: string;
        unit?: string;
        cost: number;
    };
    quantity: number;
    wastage_percent?: number;
    cost?: number; // Calculated cost at the time
}

export interface BillOfMaterial {
    id: number;
    name: string;
    product_id: number;
    product?: {
        id: number;
        name: string;
    };
    items?: BillOfMaterialItem[];
    description?: string;
    is_active: boolean;
    total_cost?: number; // Calculated
    created_at?: string;
    updated_at?: string;
}

export interface FinishedGood {
    id: number;
    batch_id?: number;
    batch?: ProductionBatch;
    product_id: number;
    product?: {
        id: number;
        name: string;
    };
    quantity: number;
    produced_date: string;
    notes?: string;
    location?: string;
    created_at?: string;
    updated_at?: string;
}

// Response Types
type CommonResponse<T> = {
    status: boolean;
    message: string;
    data: T;
};

type ListResponse<T> = {
    status: boolean;
    message: string;
    data: T[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPage: number;
    };
};

export const productionApiService = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Batches
        addBatch: builder.mutation<CommonResponse<ProductionBatch>, Partial<ProductionBatch>>({
            query: (body) => ({ url: "/production/batches", method: "POST", body }),
            invalidatesTags: ["ProductionBatch"],
        }),
        getBatches: builder.query<ListResponse<ProductionBatch>, void | { page?: number; limit?: number; search?: string }>({
            query: (params) => ({ url: "/production/batches", method: "GET", params: params ?? {} }),
            providesTags: ["ProductionBatch"],
        }),
        getBatchById: builder.query<CommonResponse<ProductionBatch>, number>({
            query: (id) => ({ url: `/production/batches/${id}`, method: "GET" }),
            providesTags: ["ProductionBatch"],
        }),
        updateBatch: builder.mutation<CommonResponse<ProductionBatch>, { id: number; body: Partial<ProductionBatch> }>({
            query: ({ id, body }) => ({ url: `/production/batches/${id}`, method: "PUT", body }),
            invalidatesTags: ["ProductionBatch"],
        }),
        deleteBatch: builder.mutation<CommonResponse<void>, number>({
            query: (id) => ({ url: `/production/batches/${id}`, method: "DELETE" }),
            invalidatesTags: ["ProductionBatch"],
        }),

        // BOMs
        addBom: builder.mutation<CommonResponse<BillOfMaterial>, Partial<BillOfMaterial>>({
            query: (body) => ({ url: "/production/boms", method: "POST", body }),
            invalidatesTags: ["BillOfMaterial"],
        }),
        getBoms: builder.query<ListResponse<BillOfMaterial>, void | { page?: number; limit?: number; search?: string }>({
            query: (params) => ({ url: "/production/boms", method: "GET", params: params ?? {} }),
            providesTags: ["BillOfMaterial"],
        }),
        getBomById: builder.query<CommonResponse<BillOfMaterial>, number>({
            query: (id) => ({ url: `/production/boms/${id}`, method: "GET" }),
            providesTags: ["BillOfMaterial"],
        }),
        updateBom: builder.mutation<CommonResponse<BillOfMaterial>, { id: number; body: Partial<BillOfMaterial> }>({
            query: ({ id, body }) => ({ url: `/production/boms/${id}`, method: "PUT", body }),
            invalidatesTags: ["BillOfMaterial"],
        }),
        deleteBom: builder.mutation<CommonResponse<void>, number>({
            query: (id) => ({ url: `/production/boms/${id}`, method: "DELETE" }),
            invalidatesTags: ["BillOfMaterial"],
        }),

        // Finished Goods
        addFinishedGood: builder.mutation<CommonResponse<FinishedGood>, Partial<FinishedGood>>({
            query: (body) => ({ url: "/production/finished-goods", method: "POST", body }),
            invalidatesTags: ["FinishedGood"],
        }),
        getFinishedGoods: builder.query<ListResponse<FinishedGood>, void | { page?: number; limit?: number; search?: string }>({
            query: (params) => ({ url: "/production/finished-goods", method: "GET", params: params ?? {} }),
            providesTags: ["FinishedGood"],
        }),
        getFinishedGoodById: builder.query<CommonResponse<FinishedGood>, number>({
            query: (id) => ({ url: `/production/finished-goods/${id}`, method: "GET" }),
            providesTags: ["FinishedGood"],
        }),
        updateFinishedGood: builder.mutation<CommonResponse<FinishedGood>, { id: number; body: Partial<FinishedGood> }>({
            query: ({ id, body }) => ({ url: `/production/finished-goods/${id}`, method: "PUT", body }),
            invalidatesTags: ["FinishedGood"],
        }),
        deleteFinishedGood: builder.mutation<CommonResponse<void>, number>({
            query: (id) => ({ url: `/production/finished-goods/${id}`, method: "DELETE" }),
            invalidatesTags: ["FinishedGood"],
        }),
    }),
});

export const {
    // Batches
    useAddBatchMutation,
    useGetBatchesQuery,
    useGetBatchByIdQuery,
    useUpdateBatchMutation,
    useDeleteBatchMutation,

    // BOMs
    useAddBomMutation,
    useGetBomsQuery,
    useGetBomByIdQuery,
    useUpdateBomMutation,
    useDeleteBomMutation,

    // Finished Goods
    useAddFinishedGoodMutation,
    useGetFinishedGoodsQuery,
    useGetFinishedGoodByIdQuery,
    useUpdateFinishedGoodMutation,
    useDeleteFinishedGoodMutation,
} = productionApiService;
