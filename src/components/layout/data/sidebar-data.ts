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
              title: '- Database Browser',
              url: '/database',
            },
          ],
        },
        {
          title: 'Outdoor:Master',
          icon: Settings,
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
          ],
        },
        {
          title: 'Outdoor:Reception',
          icon: Settings,
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
              title: '- List of Invoices',
              url: '/outdoor/reception/invoices/list',
            },
          ],
        },
        {
          title: 'Indoor:Master',
          icon: Settings,
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
          icon: Settings,
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
              title: '- Advance Payment',
              url: '/admission/advance-payment',
            },
            {
              title: '- First Time Service',
              url: '/admission/first-time-service',
            },
            {
              title: '- Finalise Services',
              url: '/admission/finalise-services',
            },
            {
              title: '- First Time Bill',
              url: '/admission/first-time-bill',
            },
            {
              title: '- Second Time Bill',
              url: '/admission/second-time-bill',
            },
            {
              title: '- Create Invoice',
              url: '/admission/invoice/create',
            },
            {
              title: '- Due Collection',
              url: '/admission/due-collection',
            },
            {
              title: '- Bed/Cabin Change',
              url: '/admission/bed-cabin-charge',
            },
          ],
        },
        {
          title: 'Service Bill',
          icon: Settings,
          items: [
            {
              title: '- Bill Distribute',
              url: '#',
            },
            {
              title: '- Account Balance',
              url: '#',
            },
            {
              title: '- Balance Distribute',
              url: '#',
            },
          ],
        },
        {
          title: 'Path:Biochemical',
          icon: Settings,
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
          icon: Settings,
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
          icon: Settings,
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
          icon: Settings,
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
          icon: Settings,
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
          icon: Settings,
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
          icon: Settings,
          items: [
            {
              title: '- All Reports',
              url: '/x-ray/all',
            },
          ],
        },
        {
          title: 'Ultrasonogram',
          icon: Settings,
          items: [
            {
              title: '- All Reports',
              url: '/ultrasonogram/all',
            },
          ],
        },
        {
          title: 'ECG',
          icon: Settings,
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
          icon: Settings,
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
          icon: Settings,
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
          icon: Bell,
          items: [
            {
              title: '- Email Notifications',
              url: '#',
            },
            {
              title: '- Push Notifications',
              url: '#',
            },
            {
              title: '- SMS Settings',
              url: '#',
            },
          ],
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
              title: 'Report 1',
              url: "#",
            },
            {
              title: 'Report 2',
              url: "#",
            },
            {
              title: 'Report 3',
              url: "#",
            },
          ]
        },
        {
          title: 'Help',
          url: '/help',
          icon: MessagesSquare,
        },
      ],
    },
  ],
}
