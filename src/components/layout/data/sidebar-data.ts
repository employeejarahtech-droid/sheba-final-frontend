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
  FilePlus,
  Globe,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ListFilter,
  Cpu,
  Home,
  Calendar,
  Clock,
  User,
  Package,
  ShoppingCart,
  Truck,
  RotateCcw,
  AlertTriangle,
  Trash2,
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
            { title: 'Tests', url: '/dashboard/outdoor/master/tests', icon: TestTube2 },
            { title: 'Test Tables', url: '/dashboard/outdoor/master/test-tables', icon: ClipboardList },
            { title: 'Departments', url: '/dashboard/outdoor/master/departments', icon: Building2 },
            { title: 'Categories', url: '/dashboard/outdoor/master/categories', icon: ListFilter },
            { title: 'Doctors', url: '/dashboard/outdoor/master/doctors', icon: UserCog },
            { title: 'Machines', url: '/dashboard/outdoor/master/machines', icon: Cpu },
            { title: 'Sample Rooms', url: '/dashboard/outdoor/master/sample-collection-rooms', icon: Home },
          ],
        },
        {
          title: 'Reception',
          icon: Stethoscope,
          items: [
            { title: 'Dashboard', url: '/dashboard/outdoor/dashboard', icon: LayoutDashboard },
            { title: 'Create Invoice', url: '/dashboard/outdoor/reception/invoices/create', icon: FilePlus },
            { title: 'Due Invoices', url: '/dashboard/outdoor/reception/due-collection', icon: AlertCircle },
            { title: 'Paid Invoices', url: '/dashboard/outdoor/reception/paid-invoices', icon: CheckCircle2 },
            { title: 'All Invoices', url: '/dashboard/outdoor/reception/invoices/list', icon: FileText },
            { title: 'My Invoices', url: '/dashboard/outdoor/reception/my-invoices', icon: User },
            { title: 'Invoices by Users', url: '/dashboard/outdoor/reception/user-invoices', icon: Users },
            { title: 'All Collections', url: '/dashboard/outdoor/reception/all-collections', icon: Wallet },
            { title: 'My Collections', url: '/dashboard/outdoor/reception/my-collections', icon: HandCoins },
            { title: 'User Wise Collections', url: '/dashboard/outdoor/reception/user-wise-collections', icon: UserCog },
            { title: 'Patients by Referrer', url: '/dashboard/outdoor/reception/patients-by-referrer', icon: UserPlus },
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
            { title: 'Services', url: '/dashboard/indoor/master/services', icon: Settings },
            { title: 'Service Categories', url: '/dashboard/indoor/master/service-categories', icon: ListFilter },
            { title: 'Treatment Outcomes', url: '/dashboard/indoor/master/treatment-outcomes', icon: HeartPulse },
            { title: 'Operation Types', url: '/dashboard/indoor/master/operation-types', icon: Activity },
            { title: 'Anesthesia Types', url: '/dashboard/indoor/master/anasthesia-types', icon: Syringe },
            { title: 'Resource Types', url: '/dashboard/indoor/master/bed-resource-types', icon: Database },
            { title: 'Wards & Departments', url: '/dashboard/indoor/master/bed-wards', icon: Building2 },
            { title: 'Bed & Cabin Type', url: '/dashboard/indoor/master/bed-cabin-types', icon: ListFilter },
            { title: 'Beds & Cabins', url: '/dashboard/indoor/master/bed-cabin-list', icon: BedDouble },
            { title: 'Doctor Types', url: '/dashboard/indoor/master/doctor-types', icon: UserCog },
            { title: 'Patient Types', url: '/dashboard/indoor/master/patient-types', icon: Users },
          ],
        },
        {
          title: 'Admission',
          icon: UserPlus,
          items: [
            { title: 'New Admission', url: '/dashboard/admission/new-admission', icon: FilePlus },
            { title: 'All Patients', url: '/dashboard/admission/patients', icon: ListFilter },
            { title: 'Active Patients', url: '/dashboard/admission/patients/active', icon: Activity },
            { title: 'Bill Created', url: '/dashboard/admission/patients/bill-created-list', icon: FilePlus },
            { title: 'Final Bill Created', url: '/dashboard/admission/patients/final-bill-created-list', icon: Receipt },
            { title: 'Discharged List', url: '/dashboard/admission/patients/discharged-list', icon: LogOut },
            { title: 'Discharged & Paid', url: '/dashboard/admission/patients/discharged-paid-list', icon: CheckCircle2 },
            { title: 'Discharged & Due', url: '/dashboard/admission/patients/discharged-due-list', icon: AlertCircle },
            { title: 'All Collections', url: '/dashboard/admission/all-collections', icon: Wallet },
            { title: 'My Collections', url: '/dashboard/admission/my-collections', icon: HandCoins },
            { title: 'User Wise Collections', url: '/dashboard/admission/user-wise-collections', icon: UserCog },
          ],
        },
        {
          title: 'Management',
          icon: BedDouble,
          items: [
            { title: 'Bills Not Distributed', url: '/dashboard/admission/patients/bill-not-distributed-list', icon: AlertCircle },
            { title: 'Pay. Dist. Incompleted', url: '/dashboard/admission/patients/bill-distributed-partial-list', icon: TrendingUp },
            { title: 'Pay. Dist. Completed', url: '/dashboard/admission/patients/bill-distributed-list', icon: CheckCircle2 },
            { title: 'Bills Distributed (Completed)', url: '/dashboard/admission/patients/balance-distributed-list', icon: Scale },
            { title: 'Doctor Referred', url: '/dashboard/indoor/management/doctor-referred', icon: UserCog },
            { title: 'Anesthesia Bill', url: '/dashboard/indoor/management/anesthesia-bill', icon: DollarSign },
            { title: 'Assistant Bill', url: '/dashboard/indoor/management/assistant-bill', icon: DollarSign },
            { title: 'Surgeon Bill', url: '/dashboard/indoor/management/surgeon-bill', icon: DollarSign },
            { title: 'Clinical Bills', url: '/dashboard/indoor/management/clinical-bills', icon: DollarSign },
            { title: 'Clinic Services Bills', url: '/dashboard/indoor/management/other-bills', icon: DollarSign },
          ],
        },
      ],
    },

    // ── Pathology ─────────────────────────────────────────────────────
    {
      title: 'Pathology',
      items: [
        { title: 'Dashboard', url: '/dashboard/pathology/dashboard', icon: LayoutDashboard },
        {
          title: 'Biochemical',
          icon: Beaker,
          items: [
            { title: 'All Reports', url: '/dashboard/pathology/biochemical/all', icon: FileText },
            { title: 'Lipid Profile', url: '/dashboard/pathology/biochemical/lipid-profile', icon: Activity },
          ],
        },
        {
          title: 'Hematology',
          icon: Activity,
          items: [
            { title: 'All Reports', url: '/dashboard/pathology/hematology/all', icon: FileText },
            { title: 'Blood TCDC', url: '/dashboard/pathology/hematology/blood-for-tcdc', icon: Droplets },
            { title: 'Blood BT & CT', url: '/dashboard/pathology/hematology/blood-for-bt-ct', icon: Activity },
            { title: 'CBC Short', url: '/dashboard/pathology/hematology/cbc-short', icon: ListFilter },
            { title: 'Peripheral Blood Film', url: '/dashboard/pathology/hematology/peripheral-blood-film', icon: Microscope },
            { title: 'CBC With PBF', url: '/dashboard/pathology/hematology/cbc-with-pbf', icon: Microscope },
            { title: 'Prothom Bin Time', url: '/dashboard/pathology/hematology/prothom-bin-time-full', icon: Activity },
          ],
        },
        {
          title: 'Immunology',
          icon: Shield,
          items: [
            { title: 'All Reports', url: '/dashboard/pathology/immunology/all', icon: FileText },
            { title: 'Widal Test', url: '/dashboard/pathology/immunology/widal-test', icon: Shield },
            { title: 'Blood Group', url: '/dashboard/pathology/immunology/blood-group', icon: Droplets },
            { title: 'MT', url: '/dashboard/pathology/immunology/mt', icon: Shield },
            { title: 'Beta HCG', url: '/dashboard/pathology/immunology/beta-hcg', icon: Baby },
          ],
        },
        {
          title: 'Urine',
          icon: Droplets,
          items: [
            { title: 'Urine R/E Full', url: '/dashboard/pathology/urine/urine-for-re-full', icon: Droplets },
            { title: 'Urine Sugar', url: '/dashboard/pathology/urine/urine-for-sugar', icon: Droplets },
            { title: 'Urine Albumin', url: '/dashboard/pathology/urine/urine-for-albumin', icon: Droplets },
          ],
        },
        {
          title: 'Stool',
          icon: Microscope,
          items: [
            { title: 'Stool R/E', url: '/dashboard/pathology/stool/stool-re', icon: Microscope },
            { title: 'Ocult Blood (OBT)', url: '/dashboard/pathology/stool/ocult-blood-test', icon: Droplets },
            { title: 'Reducing Substance', url: '/dashboard/pathology/stool/reducing-substance', icon: Beaker },
          ],
        },
        {
          title: 'Hormone',
          icon: Baby,
          items: [
            { title: 'All Reports', url: '/dashboard/pathology/hormone/all', icon: FileText },
            { title: 'Sputum', url: '/dashboard/pathology/hormone/sputum', icon: FlaskConical },
            { title: 'Semen', url: '/dashboard/pathology/hormone/semen', icon: FlaskConical },
            { title: 'Electrolytes', url: '/dashboard/pathology/hormone/electrolytes', icon: Beaker },
            { title: 'Skin Fungus', url: '/dashboard/pathology/hormone/skin-scrapping-for-fungus', icon: Activity },
            { title: 'T3 T4 TSH', url: '/dashboard/pathology/hormone/t3t4tsh', icon: Activity },
          ],
        },
        {
          title: 'Custom Tests',
          icon: FileText,
          items: [
            { title: 'Custom Test Report', url: '/dashboard/pathology/custom-tests', icon: FileText },
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
            { title: 'All Reports', url: '/dashboard/x-ray/all', icon: Bone },
          ],
        },
        {
          title: 'Ultrasonogram',
          icon: Monitor,
          items: [
            { title: 'All Reports', url: '/dashboard/ultrasonogram/all', icon: Monitor },
          ],
        },
        {
          title: 'ECG',
          icon: HeartPulse,
          items: [
            { title: 'All Reports', url: '/dashboard/ecg/all', icon: HeartPulse },
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
            { title: 'Multi-Ledger Report', url: '/dashboard/accounting/reports/multi-ledger', icon: FileText },
            { title: 'Trial Balance', url: '/dashboard/accounting/reports/trial-balance', icon: Scale },
            { title: 'Profit & Loss', url: '/dashboard/accounting/reports/profit-and-loss', icon: PieChart },
            { title: 'Balance Sheet', url: '/dashboard/accounting/reports/balance-sheet', icon: FileText },
            { title: 'Cash Flow', url: '/dashboard/accounting/reports/cash-flow', icon: TrendingUp },
            { title: 'Income', url: '/dashboard/accounting/income', icon: TrendingUp },
            { title: 'Expense', url: '/dashboard/accounting/expenses', icon: TrendingDown },
          ],
        },
        {
          title: 'Banks',
          icon: Building2,
          items: [
            { title: 'Bank Accounts', url: '/dashboard/banks/bank-accounts', icon: Landmark },
            { title: 'Transactions', url: '/dashboard/banks/bank-transactions', icon: FileText },
          ],
        },
        {
          title: 'Payroll',
          icon: Wallet,
          items: [
            { title: 'Overview', url: '/dashboard/payroll/overview', icon: Wallet },
            { title: 'Employees', url: '/dashboard/payroll/employees', icon: Users },
            { title: 'Attendance', url: '/dashboard/payroll/attendance-list', icon: Calendar },
            { title: 'Salary Structure', url: '/dashboard/payroll/salary-structure', icon: DollarSign },
            { title: 'All Payrolls', url: '/dashboard/payroll/all-payrolls', icon: FileText },
          ],
        },
        {
          title: 'Payments',
          icon: CreditCard,
          items: [
            { title: 'Process Payments', url: '/dashboard/finance/payments', icon: CreditCard },
            { title: 'Payment History', url: '/dashboard/finance/payment-history', icon: Receipt },
            { title: 'Reconciliation', url: '/dashboard/finance/reconciliation', icon: CheckCircle2 },
          ],
        },
      ],
    },

    // ── Inventory ─────────────────────────────────────────────────────
    {
      title: 'Inventory',
      items: [
        {
          title: 'Asset Management',
          icon: Package,
          items: [
            { title: 'Assets Dashboard', url: '/dashboard/assets', icon: LayoutDashboard },
            { title: 'All Assets', url: '/dashboard/assets/list', icon: List },
            { title: 'Categories', url: '/dashboard/assets/categories', icon: ListFilter },
            { title: 'Locations', url: '/dashboard/assets/locations', icon: Building2 },
            { title: 'Maintenance', url: '/dashboard/assets/maintenance', icon: Wrench },
            { title: 'Depreciation', url: '/dashboard/assets/depreciation', icon: TrendingDown },
            { title: 'Asset Statistics', url: '/dashboard/assets/statistics', icon: BarChart3 },
          ],
        },
        {
          title: 'Purchase Management',
          icon: ShoppingCart,
          items: [
            { title: 'Purchase Dashboard', url: '/dashboard/purchase', icon: LayoutDashboard },
            { title: 'Purchase Requests', url: '/dashboard/purchase/requests', icon: FileText },
            { title: 'Pending Requests', url: '/dashboard/purchase/requests/pending', icon: Bell },
            { title: 'Goods Receipt Notes', url: '/dashboard/purchase/goods-receipt', icon: Truck },
            { title: 'Suppliers', url: '/dashboard/purchase/suppliers', icon: Users },
            { title: 'Supplier Performance', url: '/dashboard/purchase/supplier-performance', icon: BarChart3 },
            { title: 'Purchase Statistics', url: '/dashboard/purchase/statistics', icon: PieChart },
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
            { title: 'Admission Register', url: '/dashboard/reports/patient/admission-register', icon: ClipboardList },
            { title: 'Discharge Summary', url: '/dashboard/reports/patient/discharge-summary', icon: FileText },
            { title: 'Bed Occupancy', url: '/dashboard/reports/patient/bed-occupancy', icon: BedDouble },
            { title: 'Patient Type Stats', url: '/dashboard/reports/patient/patient-type-stats', icon: BarChart3 },
            { title: 'Ref. Doctor-wise Patients', url: '/dashboard/reports/patient/ref-doctor-wise-patients', icon: Users },
            { title: 'Consultant Wise Patients', url: '/dashboard/reports/patient/consultant-wise-patients', icon: Stethoscope },
          ],
        },
        {
          title: 'Outdoor Reports',
          icon: Receipt,
          items: [
            { title: "Today's Collection", url: '/dashboard/reports/my/outdoor/today-collection', icon: DollarSign },
            { title: 'My Date-wise Collection', url: '/dashboard/reports/my/outdoor/date-wise-collection', icon: Calendar },
            { title: 'Date Wise Collections', url: '/dashboard/reports/outdoor/date-wise-collection', icon: Calendar },
            { title: 'Patient List', url: '/dashboard/reports/outdoor/patient-list', icon: Users },
            { title: 'Test-wise Revenue', url: '/dashboard/reports/outdoor/test-wise-revenue', icon: TrendingUp },
            { title: 'Category-wise Revenue', url: '/dashboard/reports/outdoor/category-wise-revenue', icon: PieChart },
            { title: 'Due Collection', url: '/dashboard/reports/outdoor/due-collection', icon: TrendingDown },
            { title: 'Doctor-wise Collection', url: '/dashboard/reports/outdoor/doctor-wise-collection', icon: UserCog },
            { title: 'Department Wise Review', url: '/dashboard/reports/outdoor/department-wise-review', icon: Building2 },
          ],
        },
        {
          title: 'Indoor Reports',
          icon: BarChart3,
          items: [
            { title: 'Revenue Summary', url: '/dashboard/reports/indoor/revenue-summary', icon: BarChart3 },
            { title: 'Service-wise Revenue', url: '/dashboard/reports/indoor/service-wise-revenue', icon: TrendingUp },
            { title: 'Advance Payments', url: '/dashboard/reports/indoor/advance-payments', icon: Wallet },
            { title: 'Bill Distribution', url: '/dashboard/reports/indoor/bill-distribution', icon: TrendingUp },
            { title: 'Final Bill Register', url: '/dashboard/reports/indoor/final-bill-register', icon: Receipt },
            { title: 'Outstanding Balance', url: '/dashboard/reports/indoor/outstanding-balance', icon: TrendingDown },
            { title: 'Anesthesia Bill', url: '/dashboard/reports/indoor/anesthesia-bill', icon: DollarSign },
            { title: 'Assistant Bill', url: '/dashboard/reports/indoor/assistant-bill', icon: DollarSign },
            { title: 'Surgeon Bill', url: '/dashboard/reports/indoor/surgeon-bill', icon: DollarSign },
            { title: 'Clinical Bills', url: '/dashboard/reports/indoor/clinical-bills', icon: DollarSign },
          ],
        },
        {
          title: 'Pathology Reports',
          icon: TestTube2,
          items: [
            { title: 'Test Table Wise Count', url: '/dashboard/reports/pathology/test-table-wise-count', icon: BarChart3 },
            { title: 'Test Wise Count', url: '/dashboard/reports/pathology/test-wise-count', icon: FlaskConical },
            { title: 'Department Volume', url: '/dashboard/reports/pathology/department-wise-volume', icon: PieChart },
            { title: 'Pending Results', url: '/dashboard/reports/pathology/pending-results', icon: Activity },
            { title: 'Machine Utilization', url: '/dashboard/reports/pathology/machine-utilization', icon: Monitor },
            { title: 'Sample Status', url: '/dashboard/reports/pathology/sample-status', icon: CheckCircle2 },
          ],
        },
        {
          title: 'Accounting Reports',
          icon: DollarSign,
          items: [
            { title: 'Daily Transactions', url: '/dashboard/reports/accounting/daily-transactions', icon: FileText },
            { title: 'Income vs Expense', url: '/dashboard/reports/accounting/income-vs-expense', icon: Scale },
            { title: 'Profit & Loss', url: '/dashboard/reports/accounting/profit-and-loss', icon: PieChart },
            { title: 'Trial Balance', url: '/dashboard/reports/accounting/trial-balance', icon: Scale },
            { title: 'Balance Sheet', url: '/dashboard/reports/accounting/balance-sheet', icon: FileText },
            { title: 'Ledger', url: '/dashboard/reports/accounting/ledger', icon: FileText },
            { title: 'Journal', url: '/dashboard/reports/accounting/journal', icon: FileText },
            { title: 'Cash Flow', url: '/dashboard/reports/accounting/cash-flow', icon: TrendingUp },
            { title: 'Bank Book', url: '/dashboard/reports/accounting/bank-book', icon: Landmark },
          ],
        },
        {
          title: 'HR & Payroll',
          icon: Users,
          items: [
            { title: 'Salary Sheet', url: '/dashboard/reports/payroll/salary-sheet', icon: DollarSign },
            { title: 'Attendance Summary', url: '/dashboard/reports/payroll/attendance-summary', icon: CheckCircle2 },
            { title: 'Leave Report', url: '/dashboard/reports/payroll/leave-report', icon: Calendar },
            { title: 'Department-wise Staff', url: '/dashboard/reports/payroll/department-wise-staff', icon: Users },
            { title: 'Payroll Summary', url: '/dashboard/reports/payroll/payroll-summary', icon: Wallet },
          ],
        },
        {
          title: 'Inventory',
          icon: Syringe,
          items: [
            { title: 'Stock Report', url: '/dashboard/reports/inventory/stock-report', icon: ClipboardList },
            { title: 'Supplier Purchases', url: '/dashboard/reports/inventory/supplier-purchases', icon: Receipt },
            { title: 'Customer Ledger', url: '/dashboard/reports/inventory/customer-ledger', icon: FileText },
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
            { title: 'Users', url: '/dashboard/users', icon: Users },
            { title: 'Roles', url: '/dashboard/roles', icon: UserCog },
          ],
        },
        {
          title: 'Settings',
          icon: Settings,
          items: [
            { title: 'App Configuration', url: '/dashboard/settings', icon: Settings },
            { title: 'Login Settings', url: '/dashboard/settings/login-settings', icon: UserCog },
            { title: 'Home Page Settings', url: '/dashboard/settings/home-page-settings', icon: Home },
            { title: 'Report Settings', url: '/dashboard/settings/report-settings', icon: FileText },
            { title: 'Date Controls', url: '/dashboard/settings/date-controls', icon: Clock },
            { title: 'Payment Accounts', url: '/dashboard/settings/payment-accounts', icon: Landmark },
            { title: 'Inventory Accounts', url: '/dashboard/settings/inventory-accounts', icon: Package },
            { title: 'Domain Configuration', url: '/dashboard/settings/domain-configuration', icon: Globe },
            { title: 'Database Browser', url: '/dashboard/database', icon: Database },
            { title: 'Backups', url: '/dashboard/backups', icon: Database },
            { title: 'Backup Settings', url: '/dashboard/backup-settings', icon: Settings },
            { title: 'Reset Database', url: '/dashboard/settings/reset-database', icon: AlertTriangle },
            { title: 'Pages & Modals & Drawers (List)', url: '/dashboard/settings/app-inventory', icon: List },
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
