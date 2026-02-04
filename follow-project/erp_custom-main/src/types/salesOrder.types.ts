/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Customer } from "@/store/features/customers/types";
import type { Product } from "./types";



export interface SalesOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: string;      // decimal return as string
  total_price: string;     // decimal return as string
  line_total: number;     // decimal
  discount: number;
  sales_tax: number;
  created_at: string;      // ISO date
  updated_at: string;      // ISO date
}

export interface SalesOrder {
  assignedStaff: never[];
  delivery_status: any;
  delivery: any;
  delivery_date: string | number | Date;
  invoice: any;
  due_date: string | Date;
  id: number;
  order_number: string;
  customer_id: number;
  customer: Customer;
  order_date: string;          // ISO date
  status: "pending" | "confirmed" | "shipped" | "completed" | "cancelled" | string;
  total_amount: string;        // decimal
  tax_amount: string;          // decimal
  discount_amount: string;     // decimal
  net_amount: string;          // decimal
  shipping_address: string;
  billing_address: string | null;
  payment_status: "unpaid" | "partial" | "paid" | string;
  notes: string | null;
  total_invoice_amount: number;
  total_discount: number,
  total_payable_amount: number,
  total_paid_amount: 0
  created_by: number;
  created_at: string;
  updated_at: string;
  items: SalesOrderItem[];
}






export interface SalesOrderFormValues {
  order_date: string;       // e.g., "2025-12-08T04:52:37.000Z"
  due_date: string;         // e.g., "2025-12-15T00:00:00.000Z"
  customer_id: number;
  shipping_address: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
    discount: number;
    sales_tax: number;
    stock_quantity?: number;
  }[];
}


// TypeScript type for update payload
export type UpdateDeliveryPayload = {
  status: "pending" | "in_transit" | "delivered" | "failed" | "returned" | "confirmed" | "cancelled";
  delivery_date: string | undefined;// ISO date string
  notes: string | undefined;
};



