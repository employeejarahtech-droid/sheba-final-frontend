

export interface PurchasePayment {
  id: number;
  amount: number;
  invoice_id: number;
  purchase_order_id: number;

  payment_date: string;
  payment_method: "cash" | "bank_transfer" | "card" | "cheque";
  reference_number: string;
  status: "pending" | "completed" | "failed";

  created_by: number;
  creator:{
    id: number;
    name: string;
    email: string;
  }
  created_at: string;
  updated_at: string;

  purchase_order: {
    id: number;
    po_number: string;
    supplier_id: number;
    total_amount: number;
    status: string;
    order_date: string;
    expected_delivery_date: string;
    supplier: {
      id: number;
      name: string;
      email: string;
      phone: string;
      contact_person: string;
    };
    net_amount: number;
    total_payable_amount: number;
  };

  invoice: {
    id: number;
    invoice_number: string;
    total_amount: number;
    purchase_order_id: number;
    status: string;
    due_date: string;
    net_amount: number;
    total_payable_amount: number;
  };
}
