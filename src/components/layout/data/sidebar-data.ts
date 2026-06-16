import {
  LayoutDashboard,
  Bell,
  Settings,
  Users,
  MessagesSquare,
  Command,
  GalleryVerticalEnd,
  AudioWaveform,
  LineChart,
  HandCoins,
  FileText,
  List,
  Scale,
  PieChart,
  TrendingUp,
  TrendingDown,
  FlaskConical,
  Stethoscope,
  Recycle,
  UserPlus,
  Building2,
  Beaker,
  Activity,
  Shield,
  Droplets,
  Microscope,
  Bone,
  Baby,
  HeartPulse,
  Monitor,
  Wallet,
  HelpCircle,
  BedDouble,
  TestTube2,
  Syringe,
  CreditCard,
  Receipt,
  ClipboardList,
  DollarSign,
  BarChart3,
  UserCog,
  Wrench,
  Database,
  Landmark,
  Images,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  teams: [
    {
      name: 'Super Admin',
      logo: Command,
      plan: 'Role',
    },
    {
      name: 'Manager',
      logo: GalleryVerticalEnd,
      plan: 'Role',
    },
    {
      name: 'Receptionist',
      logo: AudioWaveform,
      plan: 'Role',
    },
    {
      name: 'Pathologist',
      logo: LineChart,
      plan: 'Role',
    },
    {
      name: 'Accountant',
      logo: Users,
      plan: 'Role',
    },
  ],
  navGroups: [
    // ── Overview ─────────────────────────────────────────────────────
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Subscription',
          url: '/dashboard/subscription',
          icon: CreditCard,
        },
        {
          title: 'Company Account',
          url: '/dashboard/company-account',
          icon: Landmark,
        },
        {
          title: 'Gallery',
          url: '/dashboard/gallery',
          icon: Images,
        },
      ],
    },

    // ── Outdoor ──────────────────────────────────────────────────────
    {
      title: 'Outdoor',
      items: [
        {
          title: 'Master',
          icon: FlaskConical,
          items: [
            { title: 'Tests', url: '/dashboard/outdoor/master/tests' },
            { title: 'Test Tables', url: '/dashboard/outdoor/master/test-tables' },
            { title: 'Departments', url: '/dashboard/outdoor/master/departments' },
            { title: 'Categories', url: '/dashboard/outdoor/master/categories' },
            { title: 'Doctors', url: '/dashboard/outdoor/master/doctors' },
            { title: 'Machines', url: '/dashboard/outdoor/master/machines' },
            { title: 'Sample Rooms', url: '/dashboard/outdoor/master/sample-collection-rooms' },
          ],
        },
        {
          title: 'Reception',
          icon: Stethoscope,
          items: [
            { title: 'Create Invoice', url: '/dashboard/outdoor/reception/invoices/create' },
            { title: 'Due Invoices', url: '/dashboard/outdoor/reception/due-collection' },
            { title: 'Paid Invoices', url: '/dashboard/outdoor/reception/paid-invoices' },
            { title: 'All Invoices', url: '/dashboard/outdoor/reception/invoices/list' },
            { title: 'My Invoices', url: '/dashboard/outdoor/reception/my-invoices' },
            { title: 'Invoices by Users', url: '/dashboard/outdoor/reception/user-invoices' },
          ],
        },
      ],
    },

    // ── Indoor ───────────────────────────────────────────────────────
    {
      title: 'Indoor',
      items: [
        {
          title: 'Master',
          icon: Recycle,
          items: [
            { title: 'Services', url: '/dashboard/indoor/master/services' },
            { title: 'Service Categories', url: '/dashboard/indoor/master/service-categories' },
            { title: 'Treatment Outcomes', url: '/dashboard/indoor/master/treatment-outcomes' },
            { title: 'Operation Types', url: '/dashboard/indoor/master/operation-types' },
            { title: 'Anesthesia Types', url: '/dashboard/indoor/master/anasthesia-types' },
            { title: 'Resource Types', url: '/dashboard/indoor/master/bed-resource-types' },
            { title: 'Beds & Cabins', url: '/dashboard/indoor/master/bed-cabin-list' },
            { title: 'Doctor Types', url: '/dashboard/indoor/master/doctor-types' },
            { title: 'Patient Types', url: '/dashboard/indoor/master/patient-types' },
          ],
        },
        {
          title: 'Admission',
          icon: UserPlus,
          items: [
            { title: 'New Admission', url: '/dashboard/admission/new-admission' },
            { title: 'All Patients', url: '/dashboard/admission/patients' },
            { title: 'Active Patients', url: '/dashboard/admission/patients/active' },
            { title: 'Discharged Patients', url: '/dashboard/admission/patients/discharged' },
          ],
        },
        {
          title: 'Management',
          icon: BedDouble,
          items: [
            { title: 'Bill Created', url: '/dashboard/admission/patients/bill-created-list' },
            { title: 'Final Bills', url: '/dashboard/admission/patients/final-bill-created-list' },
            { title: 'Discharge List', url: '/dashboard/admission/patients/discharged-list' },
            { title: 'Payment Completed', url: '/dashboard/admission/patients/payment-completed-list' },
            { title: 'Bills Distributed', url: '/dashboard/admission/patients/bill-distributed-list' },
            { title: 'Balance & Finish', url: '/dashboard/admission/patients/balance-distributed-list' },
            { title: 'Doctor Referred', url: '/dashboard/indoor/management/doctor-referred' },
            { title: 'Doctor Bill', url: '/dashboard/indoor/management/doctor-bill' },
            { title: 'Anesthesia Bill', url: '/dashboard/indoor/management/anesthesia-bill' },
            { title: 'Assistant Bill', url: '/dashboard/indoor/management/assistant-bill' },
            { title: 'Surgeon Bill', url: '/dashboard/indoor/management/surgeon-bill' },
            { title: 'Clinical Bills', url: '/dashboard/indoor/management/clinical-bills' },
            { title: 'Other Bills', url: '/dashboard/indoor/management/other-bills' },
          ],
        },
      ],
    },

    // ── Pathology ─────────────────────────────────────────────────────
    {
      title: 'Pathology',
      items: [
        {
          title: 'Biochemical',
          icon: Beaker,
          items: [
            { title: 'All Reports', url: '/dashboard/pathology/biochemical/all' },
            { title: 'Lipid Profile', url: '/dashboard/pathology/biochemical/lipid-profile' },
          ],
        },
        {
          title: 'Hematology',
          icon: Activity,
          items: [
            { title: 'All Reports', url: '/dashboard/pathology/hematology/all' },
            { title: 'Blood TCDC', url: '/dashboard/pathology/hematology/blood-for-tcdc' },
            { title: 'Blood BT & CT', url: '/dashboard/pathology/hematology/blood-for-bt-ct' },
            { title: 'CBC Short', url: '/dashboard/pathology/hematology/cbc-short' },
            { title: 'Peripheral Blood Film', url: '/dashboard/pathology/hematology/peripheral-blood-film' },
            { title: 'CBC With PBF', url: '/dashboard/pathology/hematology/cbc-with-pbf' },
            { title: 'Prothom Bin Time', url: '/dashboard/pathology/hematology/prothom-bin-time-full' },
          ],
        },
        {
          title: 'Immunology',
          icon: Shield,
          items: [
            { title: 'All Reports', url: '/dashboard/pathology/immunology/all' },
            { title: 'Widal Test', url: '/dashboard/pathology/immunology/widal-test' },
            { title: 'Blood Group', url: '/dashboard/pathology/immunology/blood-group' },
            { title: 'MT', url: '/dashboard/pathology/immunology/mt' },
            { title: 'Beta HCG', url: '/dashboard/pathology/immunology/beta-hcg' },
          ],
        },
        {
          title: 'Urine',
          icon: Droplets,
          items: [
            { title: 'Urine R/E Full', url: '/dashboard/pathology/urine/urine-for-re-full' },
            { title: 'Urine Sugar', url: '/dashboard/pathology/urine/urine-for-sugar' },
            { title: 'Urine Albumin', url: '/dashboard/pathology/urine/urine-for-albumin' },
          ],
        },
        {
          title: 'Stool',
          icon: Microscope,
          items: [
            { title: 'Stool R/E', url: '/dashboard/pathology/stool/stool-re' },
            { title: 'Ocult Blood (OBT)', url: '/dashboard/pathology/stool/ocult-blood-test' },
            { title: 'Reducing Substance', url: '/dashboard/pathology/stool/reducing-substance' },
          ],
        },
        {
          title: 'Hormone',
          icon: Baby,
          items: [
            { title: 'All Reports', url: '/dashboard/pathology/hormone/all' },
            { title: 'Sputum', url: '/dashboard/pathology/hormone/sputum' },
            { title: 'Semen', url: '/dashboard/pathology/hormone/semen' },
            { title: 'Electrolytes', url: '/dashboard/pathology/hormone/electrolytes' },
            { title: 'Skin Fungus', url: '/dashboard/pathology/hormone/skin-scrapping-for-fungus' },
            { title: 'T3 T4 TSH', url: '/dashboard/pathology/hormone/t3t4tsh' },
          ],
        },
      ],
    },

    // ── Diagnostics ───────────────────────────────────────────────────
    {
      title: 'Diagnostics',
      items: [
        {
          title: 'X-Ray',
          icon: Bone,
          items: [
            { title: 'All Reports', url: '/dashboard/x-ray/all' },
          ],
        },
        {
          title: 'Ultrasonogram',
          icon: Monitor,
          items: [
            { title: 'All Reports', url: '/dashboard/ultrasonogram/all' },
          ],
        },
        {
          title: 'ECG',
          icon: HeartPulse,
          items: [
            { title: 'All Reports', url: '/dashboard/ecg/all' },
          ],
        },
      ],
    },

    // ── Finance ───────────────────────────────────────────────────────
    {
      title: 'Finance',
      items: [
        {
          title: 'Accounting',
          icon: HandCoins,
          items: [
            { title: 'Dashboard', url: '/dashboard/accounting', icon: LayoutDashboard },
            { title: 'Transactions', url: '/dashboard/accounting/transactions', icon: FileText },
            { title: 'Chart of Accounts', url: '/dashboard/accounting/accounts', icon: List },
            { title: 'Journal Report', url: '/dashboard/accounting/reports/journal', icon: FileText },
            { title: 'Daily Summary', url: '/dashboard/accounting/reports/daily-summary', icon: Activity },
            { title: 'Ledger Report', url: '/dashboard/accounting/reports/ledger', icon: FileText },
            { title: 'Trial Balance', url: '/dashboard/accounting/reports/trial-balance', icon: Scale },
            { title: 'Profit & Loss', url: '/dashboard/accounting/reports/profit-and-loss', icon: PieChart },
            { title: 'Balance Sheet', url: '/dashboard/accounting/reports/balance-sheet', icon: FileText },
            { title: 'Income', url: '/dashboard/accounting/income', icon: TrendingUp },
            { title: 'Expense', url: '/dashboard/accounting/expense', icon: TrendingDown },
          ],
        },
        {
          title: 'Banks',
          icon: Building2,
          items: [
            { title: 'Bank Accounts', url: '/dashboard/banks/bank-accounts' },
            { title: 'Transactions', url: '/dashboard/banks/bank-transactions' },
            { title: 'Deposits', url: '/dashboard/banks/bank-deposits' },
            { title: 'Withdrawals', url: '/dashboard/banks/bank-withdrawals' },
          ],
        },
        {
          title: 'Payroll',
          icon: Wallet,
          items: [
            { title: 'Overview', url: '/dashboard/payroll/overview' },
          ],
        },
      ],
    },

    // ── Reports ───────────────────────────────────────────────────────
    {
      title: 'Reports',
      items: [
        {
          title: 'Patient Reports',
          icon: ClipboardList,
          items: [
            { title: 'Admission Register', url: '/dashboard/reports/patient/admission-register' },
            { title: 'Discharge Summary', url: '/dashboard/reports/patient/discharge-summary' },
            { title: 'Bed Occupancy', url: '/dashboard/reports/patient/bed-occupancy' },
            { title: 'Patient Type Stats', url: '/dashboard/reports/patient/patient-type-stats' },
            { title: 'Doctor-wise Patients', url: '/dashboard/reports/patient/doctor-wise-patients' },
          ],
        },
        {
          title: 'Outdoor Reports',
          icon: Receipt,
          items: [
            { title: "Today's Collection", url: '/dashboard/reports/my/outdoor/today-collection' },
            { title: 'Date-wise Collection', url: '/dashboard/reports/my/outdoor/date-wise-collection' },
            { title: 'Patient List', url: '/dashboard/reports/outdoor/patient-list' },
            { title: 'Test-wise Revenue', url: '/dashboard/reports/outdoor/test-wise-revenue' },
            { title: 'Category-wise Revenue', url: '/dashboard/reports/outdoor/category-wise-revenue' },
            { title: 'Due Collection', url: '/dashboard/reports/outdoor/due-collection' },
            { title: 'Doctor-wise Collection', url: '/dashboard/reports/outdoor/doctor-wise-collection' },
          ],
        },
        {
          title: 'Indoor Reports',
          icon: BarChart3,
          items: [
            { title: 'Revenue Summary', url: '/dashboard/reports/indoor/revenue-summary' },
            { title: 'Service-wise Revenue', url: '/dashboard/reports/indoor/service-wise-revenue' },
            { title: 'Advance Payments', url: '/dashboard/reports/indoor/advance-payments' },
            { title: 'Bill Distribution', url: '/dashboard/reports/indoor/bill-distribution' },
            { title: 'Final Bill Register', url: '/dashboard/reports/indoor/final-bill-register' },
            { title: 'Outstanding Balance', url: '/dashboard/reports/indoor/outstanding-balance' },
          ],
        },
        {
          title: 'Pathology Reports',
          icon: TestTube2,
          items: [
            { title: 'Test-wise Count', url: '/dashboard/reports/pathology/test-wise-count' },
            { title: 'Department Volume', url: '/dashboard/reports/pathology/department-wise-volume' },
            { title: 'Pending Results', url: '/dashboard/reports/pathology/pending-results' },
            { title: 'Machine Utilization', url: '/dashboard/reports/pathology/machine-utilization' },
            { title: 'Sample Status', url: '/dashboard/reports/pathology/sample-status' },
          ],
        },
        {
          title: 'Accounting Reports',
          icon: DollarSign,
          items: [
            { title: 'Daily Transactions', url: '/dashboard/reports/accounting/daily-transactions' },
            { title: 'Income vs Expense', url: '/dashboard/reports/accounting/income-vs-expense' },
            { title: 'Profit & Loss', url: '/dashboard/reports/accounting/profit-and-loss' },
            { title: 'Trial Balance', url: '/dashboard/reports/accounting/trial-balance' },
            { title: 'Balance Sheet', url: '/dashboard/reports/accounting/balance-sheet' },
            { title: 'Ledger', url: '/dashboard/reports/accounting/ledger' },
            { title: 'Journal', url: '/dashboard/reports/accounting/journal' },
            { title: 'Cash Flow', url: '/dashboard/reports/accounting/cash-flow' },
            { title: 'Bank Book', url: '/dashboard/reports/accounting/bank-book' },
          ],
        },
        {
          title: 'HR & Payroll',
          icon: Users,
          items: [
            { title: 'Salary Sheet', url: '/dashboard/reports/payroll/salary-sheet' },
            { title: 'Attendance Summary', url: '/dashboard/reports/payroll/attendance-summary' },
            { title: 'Leave Report', url: '/dashboard/reports/payroll/leave-report' },
            { title: 'Department-wise Staff', url: '/dashboard/reports/payroll/department-wise-staff' },
            { title: 'Payroll Summary', url: '/dashboard/reports/payroll/payroll-summary' },
          ],
        },
        {
          title: 'Inventory',
          icon: Syringe,
          items: [
            { title: 'Stock Report', url: '/dashboard/reports/inventory/stock-report' },
            { title: 'Supplier Purchases', url: '/dashboard/reports/inventory/supplier-purchases' },
            { title: 'Customer Ledger', url: '/dashboard/reports/inventory/customer-ledger' },
          ],
        },
      ],
    },

    // ── Administration ────────────────────────────────────────────────
    {
      title: 'Administration',
      items: [
        {
          title: 'Users & Roles',
          icon: UserCog,
          items: [
            { title: 'Users', url: '/dashboard/users' },
            { title: 'Roles', url: '/dashboard/roles' },
          ],
        },
        {
          title: 'Settings',
          icon: Settings,
          items: [
            { title: 'App Configuration', url: '/dashboard/settings' },
            { title: 'Date Controls', url: '/dashboard/settings/date-controls' },
            { title: 'Payment Accounts', url: '/dashboard/settings/payment-accounts' },
            { title: 'Database Browser', url: '/dashboard/database' },
            { title: 'Backups', url: '/dashboard/backups' },
            { title: 'Backup Settings', url: '/dashboard/backup-settings' },
          ],
        },
        {
          title: 'Notifications',
          url: '/dashboard/notifications',
          icon: Bell,
        },
        {
          title: 'Chats',
          url: '/dashboard/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: 'Help',
          url: '/dashboard/help',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
