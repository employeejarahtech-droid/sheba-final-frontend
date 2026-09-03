import type { ApiResponse, ListResult } from './pharmacy.types'

export type { ApiResponse, ListResult }

export type PrescriptionStatus = 'active' | 'cancelled'

export interface PrescriptionVitals {
  bp?: string
  pulse?: string
  temperature?: string
  weight?: string
}

export interface PrescriptionItem {
  id?: number
  medicine_id?: number | null
  medicine_master_id?: number | null
  medicine_name: string
  generic_name?: string | null
  form?: string | null
  dosage?: string | null
  frequency?: string | null
  duration?: string | null
  route?: string | null
  instructions?: string | null
  instructions_local?: string | null
  sort_order?: number
}

export interface PrescriptionTest {
  id?: number
  test_id?: number | null
  test_name: string
  note?: string | null
  sort_order?: number
}

export interface InteractionWarning {
  generic_a?: string
  generic_b?: string
  generic?: string
  allergen?: string
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated'
  description?: string | null
}

export interface InteractionCheckResult {
  interactions: InteractionWarning[]
  allergies: InteractionWarning[]
}

export interface Prescription {
  id: number
  prescription_no?: string | null
  doctor_id: number
  referred_doctor_id?: number | null
  patient_id?: number | null
  patient_name: string
  patient_age?: number | null
  age_text?: string | null
  patient_sex?: string | null
  patient_phone?: string | null
  invoice_id?: number | null
  admission_id?: number | null
  chief_complaints?: string | null
  on_examination?: string | null
  history_notes?: string | null
  diagnosis?: string | null
  icd_code?: string | null
  icd_description?: string | null
  advice?: string | null
  vitals?: PrescriptionVitals | null
  follow_up_date?: string | null
  status: PrescriptionStatus
  cancel_reason?: string | null
  interaction_warnings?: InteractionCheckResult | null
  warnings_acknowledged?: boolean
  doctor?: { id: number; name: string } | null
  patient?: Patient | null
  items?: PrescriptionItem[]
  tests?: PrescriptionTest[]
  created_at?: string
}

export interface PrescriptionDashboard {
  active_prescriptions: number
  today_prescriptions: number
  patients_count?: number
  today_new_patients?: number
  rx_medicines_count?: number
  rx_medicine_groups_count?: number
}

/* ── Patient registry ────────────────────────────────────────────────── */

export interface Patient {
  id: number
  patient_no?: string | null
  name: string
  dob?: string | null
  age_years?: number | null
  age_text?: string | null
  sex?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  blood_group?: string | null
  allergies?: string[] | null
  chronic_conditions?: string[] | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  notes?: string | null
  status?: 'active' | 'inactive'
  created_at?: string
}

/* ── Rx medicine master ──────────────────────────────────────────────── */

export interface RxMedicineGroup {
  id: number
  name: string
  description?: string | null
  sort_order?: number
  status?: 'active' | 'inactive'
  created_at?: string
}

export interface RxMedicine {
  id: number
  name: string
  generic_name: string
  generic_name_norm?: string
  group_id?: number | null
  group?: { id: number; name: string } | null
  form?: string | null
  strength?: string | null
  default_dosage?: string | null
  default_frequency?: string | null
  default_duration?: string | null
  default_route?: string | null
  is_controlled?: boolean
  caution_note?: string | null
  pharmacy_medicine_id?: number | null
  status?: 'active' | 'inactive'
  created_at?: string
}

export interface PharmacyImportResult {
  created: number
  skipped: number
  groups_created: number
  total_pharmacy_medicines: number
}

export type QuickPhraseCategory =
  | 'chief_complaints' | 'on_examination' | 'history' | 'diagnosis' | 'advice'
  | 'dosage' | 'frequency' | 'duration' | 'route' | 'instructions' | 'instructions_local'

export interface RxQuickPhrase {
  id: number
  category: QuickPhraseCategory
  phrase: string
  sort_order: number
  status: 'active' | 'inactive'
  created_at?: string
}

export type QuickPhrasesGrouped = Record<QuickPhraseCategory, string[]>
