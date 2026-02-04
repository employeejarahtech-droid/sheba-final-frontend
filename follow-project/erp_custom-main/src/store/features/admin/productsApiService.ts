import { baseApi } from "@/store/baseApi";
import type {
  Category,
  Product,
  Stock,
  StockMovement,
  Unit,
} from "@/types/types";

type CategoryResponse = {
  status: boolean;
  message: string;
  data: Category[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

type CategoryByIdResponse = {
  status: boolean;
  message: string;
  data: Category;
};

type UnitResponse = {
  status: boolean;
  message: string;
  data: Unit[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

type UnitByIdResponse = {
  status: boolean;
  message: string;
  data: Unit;
};

type ProductResponse = {
  status: boolean;
  message: string;
  data: Product[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

type ProductByIdResponse = {
  status: boolean;
  message: string;
  data: Product;
};

type StockResponse = {
  status: boolean;
  message: string;
  data: Stock[];
};

type StockMovementResponse = {
  status: boolean;
  message: string;
  data: StockMovement[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

// type StockMovementByIdResponse = {
//   status: boolean;
//   message: string;
//   data: StockMovement;
// };

export const productsApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    //product stats
    getProductStats: builder.query({
      query: () => ({
        url: "/products/stats",
        method: "GET",
      }),
      providesTags: ["Product", "Stats"],
    }),
    //products apis

    addProduct: builder.mutation<ProductResponse, Partial<Product>>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Product"],
    }),
    getAllProducts: builder.query<
      ProductResponse,
      { page: number; limit: number; search?: string }
    >({
      query: (params) => ({
        url: "/products",
        method: "GET",
        params,
      }),
      providesTags: ["Product"],
    }),
    getProductById: builder.query<ProductByIdResponse, number>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "GET",
      }),
      providesTags: ["Product"],
    }),
    updateProduct: builder.mutation<
      ProductResponse,
      { id: number; body: Partial<Product> }
    >({
      query: (body) => ({
        url: `/products/${body.id}`,
        method: "PUT",
        body: body.body,
      }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation<ProductResponse, number>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),
    //Product Category APIs
    addProductCategory: builder.mutation({
      query: (body) => ({
        url: "/products/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Category"],
    }),
    getAllCategories: builder.query<
      CategoryResponse,
      void | { page?: number; limit?: number; search?: string }
    >({
      query: (params) => {
        const safeParams = params ?? {}; // ensure params is always an object

        return {
          url: "/products/categories",
          method: "GET",
          params: safeParams,
        };
      },
      providesTags: ["Category"],
    }),

    getCategoryById: builder.query<CategoryByIdResponse, number>({
      query: (id) => ({
        url: `/products/categories/${id}`,
        method: "GET",
      }),
      providesTags: ["Category"],
    }),
    updateCategory: builder.mutation<
      CategoryResponse,
      { id: number; body: Partial<Category> }
    >({
      query: (body) => ({
        url: `/products/categories/${body.id}`,
        method: "PUT",
        body: body.body,
      }),
      invalidatesTags: ["Category"],
    }),
    deleteCategory: builder.mutation<CategoryResponse, number>({
      query: (id) => ({
        url: `/products/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),

    //units APIs can be added here in future
    addUnit: builder.mutation<UnitResponse, Partial<Unit>>({
      query: (body) => ({
        url: "/products/units",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Unit"],
    }),
    getAllUnits: builder.query<
      UnitResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({
        url: "/products/units",
        method: "GET",
        params,
      }),
      providesTags: ["Unit"],
    }),
    getUnitById: builder.query<UnitByIdResponse, number>({
      query: (id) => ({
        url: `/products/units/${id}`,
        method: "GET",
      }),
      providesTags: ["Unit"],
    }),
    updateUnit: builder.mutation<
      UnitResponse,
      { id: number; body: Partial<Unit> }
    >({
      query: (body) => ({
        url: `/products/units/${body.id}`,
        method: "PUT",
        body: body.body,
      }),
      invalidatesTags: ["Unit"],
    }),
    deleteUnit: builder.mutation<UnitResponse, number>({
      query: (id) => ({
        url: `/products/units/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Unit"],
    }),
    //stock apis
    getAllStocks: builder.query<StockResponse, void>({
      query: () => ({
        url: "/products/stock",
        method: "GET",
      }),
      providesTags: ["Stock"],
    }),
    updateStock: builder.mutation<
      StockResponse,
      { id: number; body: Partial<Stock> }
    >({
      query: (body) => ({
        url: `/products/${body.id}/stock`,
        method: "PUT",
        body: body.body,
      }),
      invalidatesTags: ["Stock"],
    }),
    getAllStockMovements: builder.query<
      StockMovementResponse,
      {
        id: number;
        page?: number;
        limit?: number;
        search?: string;
      }
    >({
      query: ({ id, page, limit, search }) => ({
        url: `/products/${id}/stock/movements`,
        method: "GET",
        params: { page, limit, search },
      }),
    }),
  }),
});

export const {
  useGetProductStatsQuery,
  useAddProductMutation,
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAddProductCategoryMutation,
  useGetAllCategoriesQuery,
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useAddUnitMutation,
  useGetAllUnitsQuery,
  useGetUnitByIdQuery,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
  useGetAllStocksQuery,
  useUpdateStockMutation,
  useGetAllStockMovementsQuery,
} = productsApiService;
