import {
  LayoutDashboard,
  Bell,
  Settings,
  Users,
  MessagesSquare,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
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
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
          items: [
            {
              title: '- List of Users',
              url: "/users",
            },
            {
              title: '- List of Roles',
              url: "/roles",
            },
          ]
        },
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: '- App Configuration',
              url: '/settings',
            },
            {
              title: '- Payment Account Mapping',
              url: '/settings/payment-accounts',
            },
            {
              title: '- Database Browser',
              url: '/database',
            },
            {
              title: '- Backups List',
              url: '/backups',
            },
            {
              title: '- Backup Settings',
              url: '/backup-settings',
            },
          ],
        },
        {
          title: 'Outdoor:Master',
          icon: FlaskConical,
          items: [
            {
              title: '- List of Test',
              url: '/outdoor/master/tests',
            },
            {
              title: '- List of Test Tables',
              url: '/outdoor/master/test-tables',
            },
            {
              title: '- List of Department',
              url: '/outdoor/master/departments',
            },
            {
              title: '- List of Category',
              url: '/outdoor/master/categories',
            },
            {
              title: '- List of Doctor',
              url: '/outdoor/master/doctors',
            },
            {
              title: '- List of Machines',
              url: '/outdoor/master/machines',
            },
            {
              title: '- Sample Collection Rooms',
              url: '/outdoor/master/sample-collection-rooms',
            },
          ],
        },
        {
          title: 'Outdoor:Reception',
          icon: Stethoscope,
          items: [
            {
              title: '- Create Invoice',
              url: '/outdoor/reception/invoices/create',
            },
            {
              title: '- Due Collection',
              url: '/outdoor/reception/due-collection',
            },
            {
              title: '- Paid Invoices',
              url: '/outdoor/reception/paid-invoices',
            },
            {
              title: '- List of Invoices',
              url: '/outdoor/reception/invoices/list',
            },
             {
              title: '- My Invoices',
              url: '/outdoor/reception/my-invoices',
            },
              {
              title: '- Invoices by users',
              url: '/outdoor/reception/user-invoices',
            },
          ],
        },
        {
          title: 'Indoor:Master',
          icon: Recycle,
          items: [
            {
              title: '- Services',
              url: '/indoor/master/services',
            },
            {
              title: '- Service Categories',
              url: '/indoor/master/service-categories',
            },
            {
              title: '- Treatment Outcomes',
              url: '/indoor/master/treatment-outcomes',
            },
            {
              title: '- Operation Types',
              url: '/indoor/master/operation-types',
            },
            {
              title: '- Anasthesia Types',
              url: '/indoor/master/anasthesia-types',
            },
            {
              title: '- Bed Cabin List',
              url: '/indoor/master/bed-cabin-list',
            },
            {
              title: '- List of Doctor Type',
              url: '/indoor/master/doctor-types',
            },
            {
              title: '- List of Patient Type',
              url: '/indoor/master/patient-types',
            },
          ],
        },
        {
          title: 'Indoor:Admission',
          icon: UserPlus,
          items: [
            {
              title: '- New Admission',
              url: '/admission/new-admission',
            },
            {
              title: '- List of Patients',
              url: '/admission/patients',
            },
            {
              title: '- Active Patients',
              url: '/admission/patients/active',
            },
            {
              title: '- Discharged Patients',
              url: '/admission/patients/discharged',
            },
          ],
        },
        {
          title: 'Indoor: Management',
          icon: BedDouble,
          items: [
            {
              title: '- Bill Created List',
              url: '/admission/patients/bill-created-list',
            },
            {
              title: '- Final Bills List',
              url: '/admission/patients/final-bill-created-list',
            },
            {
              title: '- Discharge Patient List',
              url: '/admission/patients/discharged-list',
            },
            {
              title: '- Payment Completed List',
              url: '/admission/patients/payment-completed-list',
            },
            {
              title: '- Bills Distributed List',
              url: '/admission/patients/bill-distributed-list',
            },
            {
              title: '- Balance Distribution & Finish List',
              url: '/admission/patients/balance-distributed-list',
            },
            {
              title: '- Doctor Referred',
              url: '/indoor/management/doctor-referred',
            },
            {
              title: '- Doctor Bill',
              url: '/indoor/management/doctor-bill',
            },
            {
              title: '- Anesthesia Bill',
              url: '/indoor/management/anesthesia-bill',
            },
            {
              title: '- Assistant Bill',
              url: '/indoor/management/assistant-bill',
            },
            {
              title: '- Surgeon Bill',
              url: '/indoor/management/surgeon-bill',
            },
            {
              title: '- Clinical Bills',
              url: '/indoor/management/clinical-bills',
            },
            {
              title: '- Other Bills',
              url: '/indoor/management/other-bills',
            },
          ],
        },
        {
          title: 'Path:Biochemical',
          icon: Beaker,
          items: [
            {
              title: '- All Reports',
              url: '/pathology/biochemical/all',
            },
            {
              title: '- Lipid Profile',
              url: '/pathology/biochemical/lipid-profile',
            },
          ],
        },
        {
          title: 'Path:Hematology',
          icon: Activity,
          items: [
            {
              title: '- All Reports',
              url: '/pathology/hematology/all',
            },
            {
              title: '- Blood For TCDC',
              url: '/pathology/hematology/blood-for-tcdc',
            },
            {
              title: '- Blood For BT & CT',
              url: '/pathology/hematology/blood-for-bt-ct',
            },
            {
              title: '- CBC Short',
              url: '/pathology/hematology/cbc-short',
            },
            // {
            //   title: '- CBC Detail',
            //   url: '/pathology/hematology/cbc-detail',
            // },
            // {
            //   title: '- Prothom Bin Time Short',
            //   url: '#',
            // },
            {
              title: '- Peripheral Blood Film',
              url: '/pathology/hematology/peripheral-blood-film',
            },
            {
              title: '- CBC With PBF',
              url: '/pathology/hematology/cbc-with-pbf',
            },
            {
              title: '- Prothom Bin Time Full',
              url: '/pathology/hematology/prothom-bin-time-full',
            },
          ],
        },
        {
          title: 'Path:Immunology',
          icon: Shield,
          items: [
            {
              title: '- All Reports',
              url: '/pathology/immunology/all',
            },
            {
              title: '- Widal Test',
              url: '/pathology/immunology/widal-test',
            },
            {
              title: '- Blood Group',
              url: '/pathology/immunology/blood-group',
            },
            {
              title: '- MT',
              url: '/pathology/immunology/mt',
            },
            {
              title: '- Beta HCG',
              url: '/pathology/immunology/beta-hcg',
            },
          ],
        },
        {
          title: 'Path:Urine',
          icon: Droplets,
          items: [
            // {
            //   title: '- Urine For R/E Short',
            //   url: '#',
            // },
            {
              title: '- Urine For R/E Full',
              url: '/pathology/urine/urine-for-re-full',
            },
            {
              title: '- Urine For Sugar',
              url: '/pathology/urine/urine-for-sugar',
            },
            {
              title: '- Urine For Albumin',
              url: '/pathology/urine/urine-for-albumin',
            },
          ],
        },
        {
          title: 'Path:Stool',
          icon: Microscope,
          items: [
            {
              title: '- Stool For R/E',
              url: '/pathology/stool/stool-re',
            },
            {
              title: '- Ocult Blood Test(O.B.T)',
              url: '/pathology/stool/ocult-blood-test',
            },
            {
              title: '- Reducing Substance',
              url: '/pathology/stool/reducing-substance',
            },
          ],
        },
        {
          title: 'Path:Hormone',
          icon: Baby,
          items: [
            {
              title: '- All Reports',
              url: '/pathology/hormone/all',
            },
            {
              title: '- Sputum',
              url: '/pathology/hormone/sputum',
            },
            {
              title: '- Semen',
              url: '/pathology/hormone/semen',
            },
            {
              title: '- Electrolytes',
              url: '/pathology/hormone/electrolytes',
            },
            {
              title: '- Skin Scrapping For Fungus',
              url: '/pathology/hormone/skin-scrapping-for-fungus',
            },
            {
              title: '- T3T4TSH',
              url: '/pathology/hormone/t3t4tsh',
            },
          ],
        },
        {
          title: 'X-Ray',
          icon: Bone,
          items: [
            {
              title: '- All Reports',
              url: '/x-ray/all',
            },
          ],
        },
        {
          title: 'Ultrasonogram',
          icon: Monitor,
          items: [
            {
              title: '- All Reports',
              url: '/ultrasonogram/all',
            },
          ],
        },
        {
          title: 'ECG',
          icon: HeartPulse,
          items: [
            {
              title: '- All Reports',
              url: '/ecg/all',
            },
          ],
        },
        // {
        //   title: 'Accounts',
        //   icon: Settings,
        //   items: [
        //     {
        //       title: '- Daily Debit',
        //       url: '/accounts/daily-debit',
        //     },
        //     {
        //       title: '- Daily Credit',
        //       url: '/accounts/daily-credit',
        //     },
        //     {
        //       title: '- Journal',
        //       url: '/accounts/journal',
        //     },
        //     {
        //       title: '- Payment to Surgeon',
        //       url: '/accounts/pay-to-surgeon',
        //     },
        //     {
        //       title: '- Payment to Anaesthetist',
        //       url: '/accounts/pay-to-anaesthetist',
        //     },
        //     {
        //       title: '- Payment to Assistant',
        //       url: '/accounts/pay-to-assistant',
        //     },
        //     {
        //       title: '- Payment to Consultant',
        //       url: '/accounts/pay-to-consultant',
        //     },
        //   ],
        // },
        {
          title: "Accounting",
          icon: HandCoins,
          items: [
            {
              title: "Dashboard",
              url: "/accounting",
              icon: LayoutDashboard,
            },
            {
              title: "Transactions",
              url: "/accounting/transactions",
              icon: FileText,
            },
            {
              title: "Chart of Accounts",
              url: "/accounting/accounts",
              icon: List,
            },
            {
              title: "Journal Report",
              url: "/accounting/reports/journal",
              icon: FileText,
            },
            {
              title: "Ledger Report",
              url: "/accounting/reports/ledger",
              icon: FileText,
            },
            {
              title: "Trial Balance",
              url: "/accounting/reports/trial-balance",
              icon: Scale,
            },
            {
              title: "Profit & Loss",
              url: "/accounting/reports/profit-and-loss",
              icon: PieChart,
            },
            {
              title: "Balance Sheet",
              url: "/accounting/reports/balance-sheet",
              icon: FileText,
            },
            {
              title: "Income List",
              url: "/accounting/income",
              icon: TrendingUp,
            },
            {
              title: "Expense List",
              url: "/accounting/expense",
              icon: TrendingDown,
            },
          ],
        },
        {
          title: 'Banks',
          icon: Building2,
          items: [
            {
              title: '- Bank Accounts',
              url: '/banks/bank-accounts',
            },
            {
              title: '- Bank Transactions',
              url: '/banks/bank-transactions',
            },
            {
              title: '- Bank Deposits',
              url: '/banks/bank-deposits',
            },
            {
              title: '- Bank Withdrawals',
              url: '/banks/bank-withdrawals',
            },
          ],
        },
        {
          title: 'Payroll',
          icon: Wallet,
          items: [
            {
              title: '- Overview',
              url: '/payroll/overview',
            },
            // {
            //   title: '- View Salary Slips',
            //   url: '/payroll/view-salary-slips',
            // },
            // {
            //   title: '- Create Payroll',
            //   url: '#',
            // },
            // {
            //   title: '- Manage Deductions',
            //   url: '#',
            // },
            // {
            //   title: '- Bonuses & Allowances',
            //   url: '#',
            // },
          ],
        },
        {
          title: 'Notifications',
          url: '/notifications',
          icon: Bell,
        },
        {
          title: 'Chats',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: 'Reports',
          icon: LineChart,
          items: [
            {
              title: '= Patient Reports =',
              url: '#',
              bold: true,
            },
            {
              title: '- Admission Register',
              url: '/reports/patient/admission-register',
            },
            {
              title: '- Discharge Summary',
              url: '/reports/patient/discharge-summary',
            },
            {
              title: '- Bed Occupancy',
              url: '/reports/patient/bed-occupancy',
            },
            {
              title: '- Patient Type Statistics',
              url: '/reports/patient/patient-type-stats',
            },
            {
              title: '- Doctor-wise Patient Count',
              url: '/reports/patient/doctor-wise-patients',
            },
            {
              title: '= Outdoor Reports =',
              url: '#',
              bold: true,
            },
            {
              title: '- Today\'s Collection',
              url: '/reports/my/outdoor/today-collection',
            },
            {
              title: '- Date-wise Collection',
              url: '/reports/my/outdoor/date-wise-collection',
            },
            {
              title: '- Outdoor Patient List',
              url: '/reports/outdoor/patient-list',
            },
            {
              title: '- Test-wise Revenue',
              url: '/reports/outdoor/test-wise-revenue',
            },
            {
              title: '- Category-wise Revenue',
              url: '/reports/outdoor/category-wise-revenue',
            },
            {
              title: '- Due Collection Report',
              url: '/reports/outdoor/due-collection',
            },
            {
              title: '- Doctor-wise Collection',
              url: '/reports/outdoor/doctor-wise-collection',
            },
            {
              title: '= Indoor Reports =',
              url: '#',
              bold: true,
            },
            {
              title: '- Indoor Revenue Summary',
              url: '/reports/indoor/revenue-summary',
            },
            {
              title: '- Service-wise Revenue',
              url: '/reports/indoor/service-wise-revenue',
            },
            {
              title: '- Advance Payments',
              url: '/reports/indoor/advance-payments',
            },
            {
              title: '- Bill Distribution Report',
              url: '/reports/indoor/bill-distribution',
            },
            {
              title: '- Final Bill Register',
              url: '/reports/indoor/final-bill-register',
            },
            {
              title: '- Outstanding Balance',
              url: '/reports/indoor/outstanding-balance',
            },
            {
              title: '= Pathology Reports =',
              url: '#',
              bold: true,
            },
            {
              title: '- Test-wise Count',
              url: '/reports/pathology/test-wise-count',
            },
            {
              title: '- Department-wise Volume',
              url: '/reports/pathology/department-wise-volume',
            },
            {
              title: '- Pending Test Results',
              url: '/reports/pathology/pending-results',
            },
            {
              title: '- Machine Utilization',
              url: '/reports/pathology/machine-utilization',
            },
            {
              title: '- Sample Collection Status',
              url: '/reports/pathology/sample-status',
            },
            {
              title: '= Accounting Reports =',
              url: '#',
              bold: true,
            },
            {
              title: '- Daily Transactions',
              url: '/reports/accounting/daily-transactions',
            },
            {
              title: '- Income vs Expense',
              url: '/reports/accounting/income-vs-expense',
            },
            {
              title: '- Profit & Loss',
              url: '/reports/accounting/profit-and-loss',
            },
            {
              title: '- Trial Balance',
              url: '/reports/accounting/trial-balance',
            },
            {
              title: '- Balance Sheet',
              url: '/reports/accounting/balance-sheet',
            },
            {
              title: '- Ledger',
              url: '/reports/accounting/ledger',
            },
            {
              title: '- Journal',
              url: '/reports/accounting/journal',
            },
            {
              title: '- Cash Flow',
              url: '/reports/accounting/cash-flow',
            },
            {
              title: '- Bank Book',
              url: '/reports/accounting/bank-book',
            },
            {
              title: '= HR & Payroll Reports =',
              url: '#',
              bold: true,
            },
            {
              title: '- Salary Sheet',
              url: '/reports/payroll/salary-sheet',
            },
            {
              title: '- Attendance Summary',
              url: '/reports/payroll/attendance-summary',
            },
            {
              title: '- Leave Report',
              url: '/reports/payroll/leave-report',
            },
            {
              title: '- Department-wise Staff',
              url: '/reports/payroll/department-wise-staff',
            },
            {
              title: '- Payroll Summary',
              url: '/reports/payroll/payroll-summary',
            },
            {
              title: '= Inventory Reports =',
              url: '#',
              bold: true,
            },
            {
              title: '- Stock Report',
              url: '/reports/inventory/stock-report',
            },
            {
              title: '- Supplier Purchases',
              url: '/reports/inventory/supplier-purchases',
            },
            {
              title: '- Customer Ledger',
              url: '/reports/inventory/customer-ledger',
            },
          ],
        },
        {
          title: 'Help',
          url: '/help',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
