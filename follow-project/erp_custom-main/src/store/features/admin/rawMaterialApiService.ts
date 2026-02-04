import { baseApi } from "@/store/baseApi";

export interface RawMaterialCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface RawMaterial {
  id: number;
  name: string;
  sku?: string;
  category_id: number;
  category?: RawMaterialCategory;
  supplier?: string;
  unit_id: number;
  unit?: string;
  cost: number;
  initial_stock: number;
  min_stock: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RawMaterialSupplier {
  id?: string | number;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  payment_terms?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RawMaterialPurchaseOrderItem {
  id?: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
  },
  quantity: number;
  unit_cost: number;
  total?: number;
  total_price?: number;
  discount?: number;
  line_total?: number;
}

export interface RawMaterialPurchaseOrder {
  id?: number;
  po_number: string;
  supplier_id: number;
  supplier: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  order_date: string;
  expected_delivery_date: string;
  notes: string;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  net_amount?: number;
  total_payable_amount?: number;
  status?: string;
  items?: RawMaterialPurchaseOrderItem[];
  invoice?: RawMaterialInvoice;
  created_at?: string;
  updated_at?: string;
}

export interface RawMaterialPayment {
  id?: number;
  purchase_order_id: number;
  invoice_id: number;
  invoice?: RawMaterialInvoice;
  purchase_order?: RawMaterialPurchaseOrder;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RawMaterialInvoice {
  id?: number;
  invoice_number: string;
  purchase_order_id: number;
  purchase_order?: RawMaterialPurchaseOrder;
  invoice_date: string;
  due_date: string;
  total_payable_amount?: number;
  paid_amount?: number;
  due_amount?: number;
  status?: "pending" | "paid";
  creator?: {
    id?: number;
    name: string;
  };
  payments?: Array<{
    id?: number;
    amount: number;
    payment_date?: string;
    payment_method?: string;
    reference_number?: string;
    creator?: {
      name: string;
    };
  }>;
  created_at?: string;
  updated_at?: string;
}

type RawMaterialCategoryResponse = {
  status: boolean;
  message: string;
  data: RawMaterialCategory[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

type RawMaterialCategoryByIdResponse = {
  status: boolean;
  message: string;
  data: RawMaterialCategory;
};

type RawMaterialResponse = {
  status: boolean;
  message: string;
  data: RawMaterial[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

type RawMaterialByIdResponse = {
  status: boolean;
  message: string;
  data: RawMaterial;
};

type RawMaterialSupplierResponse = {
  status: boolean;
  message: string;
  data: RawMaterialSupplier[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

type RawMaterialSupplierByIdResponse = {
  status: boolean;
  message: string;
  data: RawMaterialSupplier;
};

type RawMaterialPurchaseOrderResponse = {
  status: boolean;
  message: string;
  data: RawMaterialPurchaseOrder[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

type RawMaterialPurchaseOrderByIdResponse = {
  status: boolean;
  message: string;
  data: RawMaterialPurchaseOrder;
};

type RawMaterialInvoiceResponse = {
  status: boolean;
  message: string;
  data: RawMaterialInvoice[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

type RawMaterialInvoiceByIdResponse = {
  status: boolean;
  message: string;
  data: RawMaterialInvoice;
};

type RawMaterialPaymentResponse = {
  status: boolean;
  message: string;
  data: RawMaterialPayment[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
};

type RawMaterialPaymentByIdResponse = {
  status: boolean;
  message: string;
  data: RawMaterialPayment;
};

export const rawMaterialApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
    Raw Material Category APIs
    ******************************************************/
    addRawMaterialCategory: builder.mutation<
      RawMaterialCategoryResponse,
      Partial<RawMaterialCategory>
    >({
      query: (body) => ({
        url: "/raw-materials/category",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RawMaterialCategory"],
    }),

    getAllRawMaterialCategories: builder.query<
      RawMaterialCategoryResponse,
      void | { page?: number; limit?: number; search?: string }
    >({
      query: (params) => {
        const safeParams = params ?? {};

        return {
          url: "/raw-materials/category",
          method: "GET",
          params: safeParams,
        };
      },
      providesTags: ["RawMaterialCategory"],
    }),

    getRawMaterialCategoryById: builder.query<
      RawMaterialCategoryByIdResponse,
      number
    >({
      query: (id) => ({
        url: `/raw-materials/category/${id}`,
        method: "GET",
      }),
      providesTags: ["RawMaterialCategory"],
    }),

    updateRawMaterialCategory: builder.mutation<
      RawMaterialCategoryResponse,
      { id: number; body: Partial<RawMaterialCategory> }
    >({
      query: (payload) => ({
        url: `/raw-materials/category/${payload.id}`,
        method: "PUT",
        body: payload.body,
      }),
      invalidatesTags: ["RawMaterialCategory"],
    }),

    deleteRawMaterialCategory: builder.mutation<
      RawMaterialCategoryResponse,
      number
    >({
      query: (id) => ({
        url: `/raw-materials/category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RawMaterialCategory"],
    }),

    /*******************************************************
    Raw Material APIs
    ******************************************************/
    addRawMaterial: builder.mutation<
      RawMaterialByIdResponse,
      Partial<RawMaterial>
    >({
      query: (body) => ({
        url: "/raw-materials",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RawMaterial"],
    }),

    getAllRawMaterials: builder.query<
      RawMaterialResponse,
      void | { page?: number; limit?: number; search?: string }
    >({
      query: (params) => {
        const safeParams = params ?? {};
        return {
          url: "/raw-materials",
          method: "GET",
          params: safeParams,
        };
      },
      providesTags: ["RawMaterial"],
    }),

    getRawMaterialById: builder.query<RawMaterialByIdResponse, number>({
      query: (id) => ({
        url: `/raw-materials/${id}`,
        method: "GET",
      }),
      providesTags: ["RawMaterial"],
    }),

    updateRawMaterial: builder.mutation<
      RawMaterialByIdResponse,
      { id: number; body: Partial<RawMaterial> }
    >({
      query: (payload) => ({
        url: `/raw-materials/${payload.id}`,
        method: "PUT",
        body: payload.body,
      }),
      invalidatesTags: ["RawMaterial"],
    }),

    deleteRawMaterial: builder.mutation<RawMaterialResponse, number>({
      query: (id) => ({
        url: `/raw-materials/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RawMaterial"],
    }),

    /*******************************************************
    Raw Material Supplier APIs
    ******************************************************/

    addRawMaterialSupplier: builder.mutation<
      RawMaterialSupplierByIdResponse,
      Partial<RawMaterialSupplier>
    >({
      query: (body) => ({
        url: "/raw-materials/supplier",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RawMaterialSupplier"],
    }),

    getAllRawMaterialSuppliers: builder.query<
      RawMaterialSupplierResponse,
      void | { page?: number; limit?: number; search?: string }
    >({
      query: (params) => {
        const safeParams = params ?? {};
        return {
          url: "/raw-materials/supplier",
          method: "GET",
          params: safeParams,
        };
      },
      providesTags: ["RawMaterialSupplier"],
    }),

    getRawMaterialSupplierById: builder.query<
      RawMaterialSupplierByIdResponse,
      string | number
    >({
      query: (id) => ({
        url: `/raw-materials/supplier/${id}`,
        method: "GET",
      }),
      providesTags: ["RawMaterialSupplier"],
    }),

    updateRawMaterialSupplier: builder.mutation<
      RawMaterialSupplierByIdResponse,
      { id: string | number; body: Partial<RawMaterialSupplier> }
    >({
      query: (payload) => ({
        url: `/raw-materials/supplier/${payload.id}`,
        method: "PUT",
        body: payload.body,
      }),
      invalidatesTags: ["RawMaterialSupplier"],
    }),

    deleteRawMaterialSupplier: builder.mutation<
      RawMaterialSupplierByIdResponse,
      string | number
    >({
      query: (id) => ({
        url: `/raw-materials/supplier/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RawMaterialSupplier"],
    }),

    /*******************************************************
    Raw Material Purchase Order APIs
    ******************************************************/
    addRawMaterialPurchaseOrder: builder.mutation<
      RawMaterialPurchaseOrderByIdResponse,
      Partial<RawMaterialPurchaseOrder>
    >({
      query: (body) => ({
        url: "/raw-materials/purchase-orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RawMaterialPurchaseOrder"],
    }),

    getAllRawMaterialPurchaseOrders: builder.query<
      RawMaterialPurchaseOrderResponse,
      void | { page?: number; limit?: number; search?: string }
    >({
      query: (params) => {
        const safeParams = params ?? {};
        return {
          url: "/raw-materials/purchase-orders",
          method: "GET",
          params: safeParams,
        };
      },
      providesTags: ["RawMaterialPurchaseOrder"],
    }),

    getRawMaterialPurchaseOrderById: builder.query<
      RawMaterialPurchaseOrderByIdResponse,
      string | number
    >({
      query: (id) => ({
        url: `/raw-materials/purchase-orders/${id}`,
        method: "GET",
      }),
      providesTags: ["RawMaterialPurchaseOrder"],
    }),

    updateRawMaterialPurchaseOrder: builder.mutation<
      RawMaterialPurchaseOrderByIdResponse,
      { id: string | number; body: Partial<RawMaterialPurchaseOrder> }
    >({
      query: (payload) => ({
        url: `/raw-materials/purchase-orders/${payload.id}`,
        method: "PUT",
        body: payload.body,
      }),
      invalidatesTags: ["RawMaterialPurchaseOrder"],
    }),

    deleteRawMaterialPurchaseOrder: builder.mutation<
      RawMaterialPurchaseOrderByIdResponse,
      string | number
    >({
      query: (id) => ({
        url: `/raw-materials/purchase-orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RawMaterialPurchaseOrder"],
    }),

    /*******************************************************
    Raw Material Purchase Invoice APIs
    ******************************************************/
    createRawMaterialPurchaseInvoice: builder.mutation<
      RawMaterialInvoiceByIdResponse,
      Partial<RawMaterialInvoice>
    >({
      query: (body) => ({
        url: "/raw-materials/purchase-orders/invoice",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RawMaterialPurchaseInvoice"],
    }),

    getAllRawMaterialPurchaseInvoices: builder.query<
      RawMaterialInvoiceResponse,
      void | { page?: number; limit?: number; search?: string }
    >({
      query: (params) => {
        const safeParams = params ?? {};

        return {
          url: "/raw-materials/purchase-orders/invoice",
          method: "GET",
          params: safeParams,
        };
      },
      providesTags: ["RawMaterialPurchaseInvoice"],
    }),

    getRawMaterialPurchaseInvoiceById: builder.query<
      RawMaterialInvoiceByIdResponse,
      string | number
    >({
      query: (id) => ({
        url: `/raw-materials/purchase-orders/invoice/${id}`,
        method: "GET",
      }),
      providesTags: ["RawMaterialPurchaseInvoice"],
    }),

    updateRawMaterialPurchaseInvoice: builder.mutation<
      RawMaterialInvoiceByIdResponse,
      { id: string | number; body: Partial<RawMaterialInvoice> }
    >({
      query: (payload) => ({
        url: `/raw-materials/purchase-orders/invoice/${payload.id}`,
        method: "PUT",
        body: payload.body,
      }),
      invalidatesTags: ["RawMaterialPurchaseInvoice"],
    }),

    deleteRawMaterialPurchaseInvoice: builder.mutation<
      RawMaterialInvoiceByIdResponse,
      string | number
    >({
      query: (id) => ({
        url: `/raw-materials/purchase-orders/invoice/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RawMaterialPurchaseInvoice"],
    }),

    /*******************************************************
    Raw Material Payment APIs
    ******************************************************/
    addRawMaterialPayment: builder.mutation<
      RawMaterialPaymentByIdResponse,
      Partial<RawMaterialPayment>
    >({
      query: (body) => ({
        url: "/raw-materials/purchase-orders/payments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RawMaterialPayment"],
    }),

    getAllRawMaterialPayments: builder.query<
      RawMaterialPaymentResponse,
      void | { page?: number; limit?: number; search?: string }
    >({
      query: (params) => {
        const safeParams = params ?? {};

        return {
          url: "/raw-materials/purchase-orders/payments",
          method: "GET",
          params: safeParams,
        };
      },
      providesTags: ["RawMaterialPayment"],
    }),

    getRawMaterialPaymentById: builder.query<
      RawMaterialPaymentByIdResponse,
      string | number
    >({
      query: (id) => ({
        url: `/raw-materials/purchase-orders/payments/${id}`,
        method: "GET",
      }),
      providesTags: ["RawMaterialPayment"],
    }),

    updateRawMaterialPayment: builder.mutation<
      RawMaterialPaymentByIdResponse,
      { id: string | number; body: Partial<RawMaterialPayment> }
    >({
      query: (payload) => ({
        url: `/raw-materials/purchase-orders/payments/${payload.id}`,
        method: "PUT",
        body: payload.body,
      }),
      invalidatesTags: ["RawMaterialPayment"],
    }),

    deleteRawMaterialPayment: builder.mutation<
      RawMaterialPaymentByIdResponse,
      string | number
    >({
      query: (id) => ({
        url: `/raw-materials/purchase-orders/payments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RawMaterialPayment"],
    }),

  }),
});

export const {
  // Raw Material Category
  useAddRawMaterialCategoryMutation,
  useGetAllRawMaterialCategoriesQuery,
  useGetRawMaterialCategoryByIdQuery,
  useUpdateRawMaterialCategoryMutation,
  useDeleteRawMaterialCategoryMutation,

  // Raw Material
  useAddRawMaterialMutation,
  useGetAllRawMaterialsQuery,
  useGetRawMaterialByIdQuery,
  useUpdateRawMaterialMutation,
  useDeleteRawMaterialMutation,

  // Raw Material Supplier
  useAddRawMaterialSupplierMutation,
  useGetAllRawMaterialSuppliersQuery,
  useGetRawMaterialSupplierByIdQuery,
  useUpdateRawMaterialSupplierMutation,
  useDeleteRawMaterialSupplierMutation,

  // Raw Material Purchase Order
  useAddRawMaterialPurchaseOrderMutation,
  useGetAllRawMaterialPurchaseOrdersQuery,
  useGetRawMaterialPurchaseOrderByIdQuery,
  useUpdateRawMaterialPurchaseOrderMutation,
  useDeleteRawMaterialPurchaseOrderMutation,

  // Raw Material Purchase Invoice
  useCreateRawMaterialPurchaseInvoiceMutation,
  useGetAllRawMaterialPurchaseInvoicesQuery,
  useGetRawMaterialPurchaseInvoiceByIdQuery,
  useUpdateRawMaterialPurchaseInvoiceMutation,
  useDeleteRawMaterialPurchaseInvoiceMutation,

  // Raw Material Payment
  useAddRawMaterialPaymentMutation,
  useGetAllRawMaterialPaymentsQuery,
  useGetRawMaterialPaymentByIdQuery,
  useUpdateRawMaterialPaymentMutation,
  useDeleteRawMaterialPaymentMutation,
} = rawMaterialApiService;
