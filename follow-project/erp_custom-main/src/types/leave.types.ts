export type Leave = {
  id?: number;            // optional for creation
  staff_id: number;
  leave_type: "sick" | "casual" | "annual" | "unpaid" | string; // can extend as needed
  start_date: string;     // "YYYY-MM-DD"
  end_date: string;       // "YYYY-MM-DD"
  reason: string;
  status?: "pending" | "approved" | "rejected" | string; // optional, backend may set
  created_at?: string;
  updated_at?: string;
};
