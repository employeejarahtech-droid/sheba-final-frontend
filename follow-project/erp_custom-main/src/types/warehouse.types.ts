export interface Warehouse {
  _id?: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}
