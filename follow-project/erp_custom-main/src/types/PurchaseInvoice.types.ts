// types/purchaseInvoice.types.ts

import type { PurchaseOrder } from "./purchaseOrder.types";
import type { PurchasePayment } from "./purchasePayment.types";

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "paid"
  | "cancelled"
  | "overdue";




export type PurchaseInvoice = {
  due_amount: number;
  paid_amount: number;
  id: number;
  invoice_number: string;
  purchase_order_id: number;
  purchase_order: PurchaseOrder;
  payments: PurchasePayment[];
  total_amount: number;
  total_payable_amount: number;
  status:InvoiceStatus;
  invoice_date: string; // ISO string
  due_date: string; // ISO string
  created_by: number;
  creator: {
    id: number;
    name: string;
    email: string;
  }
  created_at: string; // ISO string
  updated_at: string; // ISO string
};
