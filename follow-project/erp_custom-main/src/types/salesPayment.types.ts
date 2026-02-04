
import type { SalesInvoice } from "./salesInvoice.types";
import type { SalesOrder } from "./salesOrder.types";
import type { Payment } from "./types";




export interface SalesPayment {
  notes: string;
  id: number;
  invoice_id: number | null;
  order_id: number;
  amount: string;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  status: string;
  created_by: number;
  creator:{
    id: number;
    name: string;
    email: string
  };
  created_at: string;
  updated_at: string;
  order: SalesOrder;
  invoice: SalesInvoice | null;
  payments: Payment[];
}