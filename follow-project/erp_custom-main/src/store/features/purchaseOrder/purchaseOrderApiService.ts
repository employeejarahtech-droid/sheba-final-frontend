/* eslint-disable @typescript-eslint/no-explicit-any */

import { baseApi } from "@/store/baseApi";
import type {
  InvoiceStatus,
  PurchaseInvoice,
} from "@/types/PurchaseInvoice.types";
import type {
  PurchaseOrder,
  PurchaseOrderLocation,
} from "@/types/purchaseOrder.types";
import type { PurchasePayment } from "@/types/purchasePayment.types";

export type PurchaseResponse<T> = {
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

export interface PurchasePaymentResponse {
  success: boolean;
  message: string;
  data: PurchasePayment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
}


export interface PurchaseOrderLocationsData {
  total: number;
  locations: PurchaseOrderLocation[];
}

export interface PurchaseOrderLocationsResponse {
  status: boolean;
  message: string;
  data: PurchaseOrderLocationsData;
}

export const purchaseApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    //-------------------------------------
    //  PURCHASE ORDERS
    //-------------------------------------

    // GET ALL PURCHASE ORDERS
    getAllPurchases: builder.query<
      PurchaseResponse<PurchaseOrder>,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({
        url: "/purchase/orders",
        method: "GET",
        params,
      }),
      providesTags: ["Purchases"],
    }),

  getAllApprovedPurchaseOrders: builder.query<
      PurchaseResponse<PurchaseOrder>,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({
        url: "/purchase/orders/approved",
        method: "GET",
        params,
      }),
      providesTags: ["Purchases"],
    }),

    // ADD PURCHASE ORDER
    addPurchaseOrder: builder.mutation<
      PurchaseResponse<PurchaseOrder>,
      Partial<PurchaseOrder>
    >({
      query: (body) => ({
        url: "/purchase/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Purchases"],
    }),

    // GET SINGLE PURCHASE ORDER BY ID
    getPurchaseOrderById: builder.query<
      PurchaseResponse<PurchaseOrder>,
      string | number
    >({
      query: (id) => ({
        url: `/purchase/orders/${id}`,
        method: "GET",
      }),
      providesTags: ["Purchase"],
    }),

    // UPDATE PURCHASE ORDER
    updatePurchaseOrder: builder.mutation<
      PurchaseResponse<PurchaseOrder>,
      { id: string | number; body: Partial<PurchaseOrder> }
    >({
      query: ({ id, body }) => ({
        url: `/purchase/orders/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Purchases", "Purchase"],
    }),

    // DELETE PURCHASE ORDER
    deletePurchaseOrder: builder.mutation<
      PurchaseResponse<PurchaseOrder>,
      string | number
    >({
      query: (id) => ({
        url: `/purchase/orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Purchases"],
    }),

    // RECEIVE PURCHASE ORDER
    receivePurchaseOrder: builder.mutation<
      PurchaseResponse<PurchaseOrder>,
      string | number
    >({
      query: (id) => ({
        url: `/purchase/orders/${id}/receive`,
        method: "POST",
      }),
      invalidatesTags: ["Purchases"],
    }),

    //-------------------------------------
    //  PURCHASE ORDER INVOICES
    //-------------------------------------

    // GET ALL INVOICES
    getAllPurchaseInvoices: builder.query<
      PurchaseResponse<PurchaseInvoice>,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({
        url: "/purchase/orders/invoices",
        method: "GET",
        params,
      }),
      providesTags: ["PurchaseInvoices"],
    }),

    // CREATE INVOICE
    addPurchaseInvoice: builder.mutation<
      PurchaseResponse<PurchaseInvoice>,
      any
    >({
      query: (body) => ({
        url: "/purchase/orders/invoices",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchaseInvoices", "Purchase"],
    }),
    // Update INVOICE
    updatePurchaseInvoice: builder.mutation<
      PurchaseResponse<PurchaseInvoice>,
      { invoiceId: string | number; data: { status: InvoiceStatus } }
    >({
      query: ({ invoiceId, data }) => ({
        url: `/purchase/orders/invoices/${invoiceId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["PurchaseInvoices", "Purchase"],
    }),

    // GET SINGLE INVOICE
    getPurchaseInvoiceById: builder.query<
      PurchaseResponse<PurchaseInvoice>,
      string | number
    >({
      query: (id) => ({
        url: `/purchase/orders/invoices/${id}`,
        method: "GET",
      }),
      providesTags: ["PurchaseInvoices"],
    }),

    //-------------------------------------
    //  PURCHASE ORDER PAYMENTS
    //-------------------------------------

    // GET ALL PAYMENTS
    getAllPurchasePayments: builder.query<PurchasePaymentResponse, { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({
        url: "/purchase/orders/payments",
        method: "GET",
        params,
      }),
      providesTags: ["PurchasePayments"],
    }),

    // ADD PAYMENT
    addPurchasePayment: builder.mutation<
      PurchaseResponse<PurchasePayment>,
      any
    >({
      query: (body) => ({
        url: "/purchase/orders/payments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchasePayments"],
    }),

    // GET PAYMENT BY ID
    getPurchasePaymentById: builder.query<
      PurchaseResponse<PurchasePayment>,
      string | number
    >({
      query: (id) => ({
        url: `/purchase/orders/payments/${id}`,
        method: "GET",
      }),
      providesTags: ["PurchasePayments"],
    }),

    //-------------------------------------
    //  PURCHASE MAPS
    //-------------------------------------
    getPurchaseMaps: builder.query<PurchaseOrderLocationsResponse, void>({
      query: () => ({
        url: "/purchase/maps",
        method: "GET",
      }),
      providesTags: ["PurchaseMaps"],
    }),
  }),
});

export const {
  // ORDERS
  useGetAllPurchasesQuery,
  useGetAllApprovedPurchaseOrdersQuery,
  useAddPurchaseOrderMutation,
  useGetPurchaseOrderByIdQuery,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useReceivePurchaseOrderMutation,

  // INVOICES
  useGetAllPurchaseInvoicesQuery,
  useAddPurchaseInvoiceMutation,
  useGetPurchaseInvoiceByIdQuery,
  useUpdatePurchaseInvoiceMutation,

  // PAYMENTS
  useGetAllPurchasePaymentsQuery,
  useAddPurchasePaymentMutation,
  useGetPurchasePaymentByIdQuery,

  // MAPS
  useGetPurchaseMapsQuery,
} = purchaseApiService;

