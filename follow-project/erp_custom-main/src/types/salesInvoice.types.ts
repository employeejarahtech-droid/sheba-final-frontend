import type { SalesOrder } from "./salesOrder.types";
import type { Payment } from "./types";



export interface SalesInvoice {
  paid_amount: number;
  remaining_balance: number;
  id: number;
  invoice_number: string;
  order_id: number;
  invoice_date: string; // ISO date string
  due_date: string; // ISO date string
  total_amount: string; // numeric string
  total_payable: string; // numeric string
  status: string;
  created_by: number;
  creator: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  order: SalesOrder;
  payments: Payment[]
}


// -------------------- Invoice Create Payload --------------------
export interface InvoiceCreatePayload {
  order_id: number;
  due_date: string; // "YYYY-MM-DD" format
}