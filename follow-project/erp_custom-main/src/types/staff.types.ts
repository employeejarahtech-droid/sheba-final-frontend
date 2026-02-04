import type { Department } from "./types";
import type { Role } from "./users.types";

export type StaffStatus = "active" | "inactive" | "terminated" | "on_leave";

export interface Staff {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  salary: number;
  position: string;
  department_id: number;
  hire_date: string; // or Date if you transform it
  status: StaffStatus; // Restricted to known statuses
  thumb_url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gallery_items: string[] | any[] | null;
  created_at: string;
  updated_at: string;
  department: Department;

  // Nullable fields
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  notes: string | null;
  role_id: number | null;
  role?: Role | null;
  // Payroll info
  basic_salary?: number;
  bank_details?: {
    account_name: string;
    account_number: string;
    bank_name: string;
  };
  allowances?: { name: string; amount: number }[];
  deductions?: { name: string; amount: number }[];
}