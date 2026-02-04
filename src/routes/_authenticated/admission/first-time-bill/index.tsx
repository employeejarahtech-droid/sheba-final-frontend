import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { topNav } from '@/data/data'
import { AddClinicalServicesForm } from '@/features/admission/AddClinicalServicesForm'
import { AddConsultantForm } from '@/features/admission/AddConsultantForm'
import { AddOperationTypeForm } from '@/features/admission/AddOperationTypeForm'
import { AddServiceForm } from '@/features/admission/AddServiceForm'
//import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export const Route = createFileRoute(
  '/_authenticated/admission/first-time-bill/',
)({
  component: FirstTimeBill,
})

type Patient = {
  patientName: string;
  admissionDate: string;
};

const tableData = [
  { id: "INV-001", provider: "Dr. John Doe", service: "Consultant", bill_amount: "5000" },
  { id: "INV-002", provider: "Dr. Sarah Lee", service: "Follow-up", bill_amount: "3000" },
  { id: "INV-003", provider: "Dr. Richard Kim", service: "Specialist Visit", bill_amount: "4000" },
  { id: "INV-004", provider: "Dr. Emily Watson", service: "Emergency Checkup", bill_amount: "6000" },
];

function FirstTimeBill() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [patientInfo, setPatientInfo] = useState<Patient | null>(null);
  const [openConsultantForm, setOpenConsultantForm] = useState(false);
  const [openAddServiceForm, setOpenAddServiceForm] = useState(false);
  const [openAddClinicalServicesForm, setOpenAddClinicalServicesForm] = useState(false);

  const form = useForm({
    defaultValues: {
      invoiceId: "",
      patientName: "",
      admissionDate: "",
    },
  });
  const handleSelectInvoice = async (invoiceId: string) => {
    try {
      setPatientInfo(null); // clear previous info

      // OPTIONAL: Set loading state if needed
      // setLoading(true);

      // ============================
      // 🔹 1. Call your API here
      // ============================
      // Example API request:
      // const response = await fetch(`/api/invoice/${invoiceId}`);
      // const data = await response.json();

      // For now, using dummy data:
      const dummyInvoiceData: Record<string, any> = {
        "inv001": { patientName: "John Doe", admissionDate: "2025-01-15" },
        "inv002": { patientName: "Sarah Ali", admissionDate: "2025-02-03" },
        "inv003": { patientName: "Michael Khan", admissionDate: "2025-03-21" },
      };

      const data = dummyInvoiceData[invoiceId];

      if (!data) {
        console.warn("No patient found for invoice:", invoiceId);
        return;
      }

      // ==================================
      // 🔹 2. Update form values directly
      // ==================================
      form.setValue("patientName", data.patientName);
      form.setValue("admissionDate", data.admissionDate);

      // ==================================
      // 🔹 3. Store in component state
      // ==================================
      setPatientInfo(data);

      // OPTIONAL
      // setLoading(false);

    } catch (error) {
      console.error("Error loading invoice:", error);
    }
  };

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return <>
    <Header>
      <TopNav links={topNav} />
      <div className="ms-auto flex items-center space-x-4">
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </div>
    </Header>
    <Main>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Create First Time Bill</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <Card className="p-4">
                <h3 className="font-semibold">Search Patient by Invoice</h3>

                {/* Invoice ID Select */}
                <FormField
                  control={form.control}
                  name="invoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice ID</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleSelectInvoice(value); // <-- auto-load patient info
                          }}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Invoice ID..." />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="inv001">INV-001</SelectItem>
                            <SelectItem value="inv002">INV-002</SelectItem>
                            <SelectItem value="inv003">INV-003</SelectItem>
                            {/* Add your real invoice list here */}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Patient Info (shown after invoice is selected) */}
                {patientInfo && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">

                    {/* Patient Name */}
                    <FormField
                      control={form.control}
                      name="patientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Name</FormLabel>
                          <FormControl>
                            <Input disabled {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Admission Date */}
                    <FormField
                      control={form.control}
                      name="admissionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admission Date</FormLabel>
                          <FormControl>
                            <Input type="date" disabled {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Next Button */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={!patientInfo}
                    onClick={() => setStep(2)}
                  >
                    Next →
                  </Button>
                </div>
              </Card>
            )}
            {step === 2 && (
              <>
                <Card className="shadow-sm border border-neutral-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold tracking-tight">
                      Patient Information
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    {patientInfo ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                        {/* Invoice ID */}
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground font-medium">
                            Invoice ID
                          </span>
                          <span className="font-semibold text-base text-neutral-800">
                            {form.getValues("invoiceId")}
                          </span>
                        </div>

                        {/* Patient Name */}
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground font-medium">
                            Patient Name
                          </span>
                          <span className="font-semibold text-base text-neutral-800">
                            {patientInfo?.patientName}
                          </span>
                        </div>

                        {/* Admission Date */}
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground font-medium">
                            Admission Date
                          </span>
                          <span className="font-semibold text-base text-neutral-800">
                            {patientInfo?.admissionDate}
                          </span>
                        </div>

                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No patient selected.</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <div className="flex flex-wrap items-center">
                      <div className="w-full">
                        <div className="flex justify-between items-center gap-5 mb-5">
                          <h3 className="text-xl font-semibold tracking-tight">List of Operation Types</h3>
                          <Button onClick={() => setOpen(true)}>Add Operation Type</Button>
                          <AddOperationTypeForm open={open} setOpen={setOpen} />
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                            <thead>
                              <tr className="bg-gray-100 text-gray-700">
                                <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                                  ID
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                                  Operation Type
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                                  Date
                                </th>
                                <th className="border border-gray-300 px-4 py-2 font-medium text-center">
                                  Action
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              <tr className="hover:bg-blue-50 transition-colors">
                                <td className="border border-gray-300 px-4 py-2 text-gray-800">INV-001</td>
                                <td className="border border-gray-300 px-4 py-2 text-gray-800">Operation 1</td>
                                <td className="border border-gray-300 px-4 py-2 text-gray-800">2023-06-01</td>
                                <td className="border border-gray-300 px-4 py-2 text-gray-800 text-center space-x-2">
                                  <Button
                                    onClick={() => alert("Delete")}
                                    variant="destructive"
                                    size="sm"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" onClick={() => setOpenAddServiceForm(true)}>
                                    <Plus className="w-4 h-4" />
                                    Service
                                  </Button>
                                  <AddServiceForm open={openAddServiceForm} setOpen={setOpenAddServiceForm} />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <div className="flex flex-wrap items-center">
                      <div className="w-full">
                        <div className="flex justify-between items-center gap-5 mb-5">
                          <h3 className="text-xl font-semibold tracking-tight">List of Consultants</h3>
                          <Button onClick={() => setOpenConsultantForm(true)}>Add Consultant</Button>
                          <AddConsultantForm open={openConsultantForm} setOpen={setOpenConsultantForm} />
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                            <thead>
                              <tr className="bg-gray-100 text-gray-700">
                                <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                                  SL
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                                  Consultant's Name
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                                  Date
                                </th>
                                <th className="border border-gray-300 px-4 py-2 font-medium text-center">
                                  Action
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              <tr className="hover:bg-blue-50 transition-colors">
                                <td className="border border-gray-300 px-4 py-2 text-gray-800">1</td>
                                <td className="border border-gray-300 px-4 py-2 text-gray-800">Dr. Doctor 1</td>
                                <td className="border border-gray-300 px-4 py-2 text-gray-800">2023-06-01</td>
                                <td className="border border-gray-300 px-4 py-2 text-gray-800 text-center"><button
                                  onClick={() => alert("Delete")}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="min-h-[250px]">
                  <CardContent>
                    <div className="flex justify-between items-center gap-5 mb-5">
                      <h3 className="text-xl font-semibold tracking-tight">List of Services</h3>
                      <Button onClick={() => { setOpenAddClinicalServicesForm(true) }}>Add Service</Button>
                      <AddClinicalServicesForm open={openAddClinicalServicesForm} setOpen={setOpenAddClinicalServicesForm} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-gray-100 text-gray-700">
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                              Entity ID
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                              Service Provided By / Service Head
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                              Service Against
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                              Bill Amount (BDT)
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {tableData.map((row) => (
                            <tr
                              key={row.id}
                              className="hover:bg-blue-50 transition-colors"
                            >
                              <td className="border border-gray-300 px-4 py-2 text-gray-800">
                                {row.id}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-800">
                                {row.provider}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-800">
                                {row.service}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-800">
                                {row.bill_amount}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                <button
                                  onClick={() => alert("Delete " + row.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>


                    </div>
                  </CardContent>
                </Card>
                {/* ======================= COMMON TASK ======================= */}
                <div className="flex justify-between">
                  <Button variant="destructive">Delete</Button>
                  <Button variant="secondary">Close</Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </div>
    </Main>
  </>
}
