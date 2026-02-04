export const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Customers',
    href: 'dashboard/customers',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Products',
    href: 'dashboard/products',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Settings',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]

export const departments = [
  { id: "1", name: "Xray" },
  { id: "2", name: "Ultra-sonography" },
  { id: "3", name: "Pathology" },
  { id: "4", name: "Others" },
];


// Example category data
export const categoryData = [
  { id: 2, DeptID: 3, CategoryName: "Urine" },
  { id: 3, DeptID: 3, CategoryName: "Immunological Test" },
  { id: 4, DeptID: 3, CategoryName: "Biochemical Test" },
  { id: 6, DeptID: 1, CategoryName: "Digital X-Ray" },
  { id: 7, DeptID: 2, CategoryName: "Ultra-sonography" },
  { id: 8, DeptID: 3, CategoryName: "Haematological" },
  { id: 9, DeptID: 3, CategoryName: "Stool" },
  { id: 10, DeptID: 1, CategoryName: "ECG" },
  { id: 11, DeptID: 3, CategoryName: "Hormone" },
  { id: 12, DeptID: 3, CategoryName: "Special Inv" },
  { id: 13, DeptID: 1, CategoryName: "X-RAY D.S.B.V.P.T" }
];


export const testData = [
  { id: "1", name: "Complete Blood Count (CBC)", category: "Hematology", status: "passed" as "passed" | "failed" | "pending", score: 98 },
  { id: "2", name: "Lipid Profile", category: "Cardiology", status: "failed" as "passed" | "failed" | "pending", score: 55 },
  { id: "3", name: "Liver Function Test (LFT)", category: "Biochemistry", status: "pending" as "passed" | "failed" | "pending", score: 0 },
  { id: "4", name: "Thyroid Panel (TSH/T3/T4)", category: "Endocrinology", status: "passed" as "passed" | "failed" | "pending", score: 92 },
  { id: "5", name: "Urinalysis", category: "Pathology", status: "failed" as "passed" | "failed" | "pending", score: 45 },
  { id: "6", name: "Electrocardiogram (ECG)", category: "Cardiology", status: "pending" as "passed" | "failed" | "pending", score: 0 },
];


export const doctorsData = [
  { id: "1", name: "Amit Kumar Bose", title: "Dr.", qualification: "MBBS, DMRT", speciality: "Medicine", country: "Bangladesh", city: "Kurigram", phone: "01191133239", mobile: "01715394737", email: "www" },
  { id: "2", name: "Shoopon Kumar", title: "Dr.", qualification: "MBBS, DMRT, FCPS", speciality: "Medicine", country: "Bangladesh", city: "Kurigram", phone: "000", mobile: "00", email: "www" },
  { id: "3", name: "Md. Rakbul Islam", title: "Dr.", qualification: "FCPS (Medicine)", speciality: "N/A", country: "Bangladesh", city: "N/A", phone: "000", mobile: "00", email: "www" },
  { id: "4", name: "Arup Chakravarty", title: "Dr.", qualification: "MBBS, MCPS", speciality: "DLO", country: "Bangladesh", city: "N/A", phone: "4454545", mobile: "017161992559", email: "www" },
  { id: "5", name: "Nazem Ahmed", title: "Dr.", qualification: "MBBS, CCD, CMU", speciality: "N/A", country: "Bangladesh", city: "N/A", phone: "198996816", mobile: "01719899616", email: "www" },
  { id: "6", name: "Devendra Nath", title: "Dr.", qualification: "MBBS, MCPS", speciality: "N/A", country: "Bangladesh", city: "N/A", phone: "789", mobile: "01819986616", email: "www" },
  { id: "7", name: "Ranenra Nath", title: "Dr.", qualification: "MBBS, MCPS", speciality: "N/A", country: "America", city: "N/A", phone: "54657687", mobile: "01712112345", email: "www" },
  { id: "8", name: "A.K.M. Nurunnoor", title: "Prof.Dr.", qualification: "MBBS, D.D.V, FCPS", speciality: "Health", country: "Bangladesh", city: "N/A", phone: "45576788", mobile: "01712123457", email: "www" },
];


export const reportsData = [
  {
    id: "1",
    receiptId: "RPT-1001",
    patientName: "John Doe",
    tests: ["CBC", "Lipid Profile", "Blood Sugar (Fasting)"],
    date: "2025-01-12",
    status: "passed"
  },
  {
    id: "2",
    receiptId: "RPT-1002",
    patientName: "Emily Carter",
    tests: ["Urine Routine", "TSH"],
    date: "2025-01-15",
    status: "pending"
  },
  {
    id: "3",
    receiptId: "RPT-1003",
    patientName: "Michael Johnson",
    tests: ["CBC", "Vitamin D", "HbA1c"],
    date: "2025-02-01",
    status: "passed"
  },
  {
    id: "4",
    receiptId: "RPT-1004",
    patientName: "Sophia Williams",
    tests: ["LFT", "KFT", "Electrolytes Panel"],
    date: "2025-02-04",
    status: "failed"
  },
  {
    id: "5",
    receiptId: "RPT-1005",
    patientName: "Daniel Smith",
    tests: ["Thyroid Profile (T3, T4, TSH)"],
    date: "2025-02-10",
    status: "pending"
  },
  {
    id: "6",
    receiptId: "RPT-1006",
    patientName: "Olivia Brown",
    tests: ["CBC", "Urine Culture"],
    date: "2025-02-18",
    status: "passed"
  },
  {
    id: "7",
    receiptId: "RPT-1007",
    patientName: "Liam Davis",
    tests: ["Blood Sugar (Random)", "ESR"],
    date: "2025-02-20",
    status: "failed"
  },
  {
    id: "8",
    receiptId: "RPT-1008",
    patientName: "Ava Wilson",
    tests: ["Lipid Profile", "ECG"],
    date: "2025-03-01",
    status: "pending"
  },
  {
    id: "9",
    receiptId: "RPT-1009",
    patientName: "James Miller",
    tests: ["CBC", "CRP", "D-Dimer"],
    date: "2025-03-05",
    status: "passed"
  },
  {
    id: "10",
    receiptId: "RPT-1010",
    patientName: "Isabella Martinez",
    tests: ["KFT", "Electrolytes Panel", "Blood Sugar (Fasting)"],
    date: "2025-03-08",
    status: "pending"
  }
];


export const patientTypes = [
  { id: 1, label: "General", value: "general" },
  { id: 2, label: "Emergency", value: "emergency" },
  { id: 3, label: "Maternity", value: "maternity" },
  { id: 4, label: "Pediatric", value: "pediatric" },
  { id: 5, label: "Surgery", value: "surgery" },
  { id: 6, label: "Orthopedic", value: "orthopedic" },
  { id: 7, label: "Cardiology", value: "cardiology" },
  { id: 8, label: "ICU", value: "icu" },
  { id: 9, label: "VIP / Private", value: "vip" }
];


export type Invoice = {
  id: number
  patient_name: string
  sex: string
  age: string
  phone: string
  reference_doctor: string
  invoice_date: Date
  delivery_date: Date
  delivery_time: string
  total_amount: number
  net_amount: number
  created_by: number
  created_at: Date
}


export const outdoorInvoices: Invoice[] = [
  {
    id: 1,
    patient_name: "John Doe",
    sex: "Male",
    age: "32",
    phone: "1234567890",
    reference_doctor: "Dr. Smith",
    invoice_date: new Date("2025-01-10"),
    delivery_date: new Date("2025-01-12"),
    delivery_time: "4:00 PM",
    total_amount: 1500.50,
    net_amount: 1400.00,
    created_by: 1,
    created_at: new Date()
  },
  {
    id: 2,
    patient_name: "Jane Roe",
    sex: "Female",
    age: "28",
    phone: "0987654321",
    reference_doctor: "Dr. Allen",
    invoice_date: new Date("2025-01-11"),
    delivery_date: new Date("2025-01-13"),
    delivery_time: "10:30 AM",
    total_amount: 2200.00,
    net_amount: 2100.00,
    created_by: 2,
    created_at: new Date()
  },
  {
    id: 3,
    patient_name: "Michael Johnson",
    sex: "Male",
    age: "45",
    phone: "5554443322",
    reference_doctor: "Dr. Carter",
    invoice_date: new Date("2025-01-09"),
    delivery_date: new Date("2025-01-11"),
    delivery_time: "2:15 PM",
    total_amount: 1800.75,
    net_amount: 1750.75,
    created_by: 1,
    created_at: new Date()
  },
  {
    id: 4,
    patient_name: "Emily Watson",
    sex: "Female",
    age: "36",
    phone: "7778889990",
    reference_doctor: "Dr. Ross",
    invoice_date: new Date("2025-01-12"),
    delivery_date: new Date("2025-01-14"),
    delivery_time: "6:45 PM",
    total_amount: 2500.00,
    net_amount: 2400.00,
    created_by: 3,
    created_at: new Date()
  },
  {
    id: 5,
    patient_name: "Chris Evans",
    sex: "Male",
    age: "40",
    phone: "2223334445",
    reference_doctor: "Dr. Miller",
    invoice_date: new Date("2025-01-08"),
    delivery_date: new Date("2025-01-10"),
    delivery_time: "9:00 AM",
    total_amount: 1300.00,
    net_amount: 1200.00,
    created_by: 2,
    created_at: new Date()
  }
];