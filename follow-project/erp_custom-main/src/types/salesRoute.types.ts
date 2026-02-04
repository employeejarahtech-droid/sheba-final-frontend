/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Staff } from "./staff.types";

export interface SalesRoute {
  end_lng: number;
  end_lat: number;
  customers: any;
  assignedStaff: any;
  id: number;
  route_name: string;
  description: string | null;
  is_active: boolean;

  // Geographic Details
  country: string;
  state: string;
  city: string;
  postal_code: string;

  // Route Path
  start_location: string;
  end_location: string;

  // Map & Technical Parameters
  center_lat: number;
  center_lng: number;
  coverage_radius: number;
  zoom_level: number;

  // Assignments
  assigned_sales_rep_id: number | null;
  assignedStaffMembers: Staff[]

  // CamelCase alternatives for form compatibility
  endLat?: number;
  endLng?: number;
  endCity?: string;
  endState?: string;
  endCountry?: string;
  endPostalCode?: string;

  // Potential snake_case keys from API
  end_city?: string;
  end_state?: string;
  end_country?: string;
  end_postalCode?: string; // Matching the access pattern in EditRoutePage.tsx

  // Metadata
  created_at: string; // ISO 8601 Date String
  updated_at: string; // ISO 8601 Date String
}