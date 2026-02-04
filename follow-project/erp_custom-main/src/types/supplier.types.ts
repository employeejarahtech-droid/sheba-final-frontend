

export type Supplier = {
  postal_code: string | undefined;
  state: string | undefined;
  code: string | undefined;
  id: string | number; // optional for creation
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  payment_terms: string;
  is_active: boolean;
  created_at?: string; // optional, usually returned from API
  updated_at?: string; // optional
  longitude?: number; // optional
  latitude?: number; // optional
  total_purchase_amount?: string | number;
  total_paid_amount?: string | number;
  total_due_amount?: string | number;
  thumb_url?: string;
  gallery_items?: string | string[]; // Can be string (JSON) or array

};
