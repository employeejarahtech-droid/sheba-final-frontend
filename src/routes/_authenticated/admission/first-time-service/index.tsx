import { createFileRoute } from '@tanstack/react-router'
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from '@/components/layout/header';
import { TopNav } from '@/components/layout/top-nav';
import { topNav } from '@/data/data';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layout/main';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AddOperationTypeForm } from '@/features/admission/AddOperationTypeForm';
import { AddConsultantForm } from '@/features/admission/AddConsultantForm';
import { AddServiceForm } from '@/features/admission/AddServiceForm';
import { AddClinicalServicesForm } from '@/features/admission/AddClinicalServicesForm';

export const Route = createFileRoute(
  '/_authenticated/admission/first-time-service/',
)({
  component: FirstTimeServiceProviderForm,
})

const schema = z.object({
  invoiceId: z.string().optional(),
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  admissionDate: z.string().optional(),
  operationNo: z.string().optional(),
  doctorType: z.string().optional(),
  doctorName: z.string().optional(),
  consultant: z.string().optional(),
  newOperationNo: z.string().optional(),
  opType: z.string().optional(),
  anesthesiaType: z.string().optional(),
  opDate: z.string().optional(),
  receptionId: z.string().optional(),
  selectedBy: z.string().optional(),
  dueAmount: z.string().optional(),
});

const tableData = [
  { id: "INV-001", provider: "Dr. John Doe", service: "Consultant" },
  { id: "INV-002", provider: "Dr. Sarah Lee", service: "Follow-up" },
  { id: "INV-003", provider: "Dr. Richard Kim", service: "Specialist Visit" },
  { id: "INV-004", provider: "Dr. Emily Watson", service: "Emergency Checkup" },
];

type Patient = {
  patientName: string;
  admissionDate: string;
};

export default function FirstTimeServiceProviderForm() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [patientInfo, setPatientInfo] = useState<Patient | null>(null);
  const [openConsultantForm, setOpenConsultantForm] = useState(false);
  const [openAddServiceForm, setOpenAddServiceForm] = useState(false);
  const [openAddClinicalServicesForm, setOpenAddClinicalServicesForm] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {},
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

  function onSubmit(values: z.infer<typeof schema>) {
    console.log(values);
  }

  return (
    <>
      {/* HEADER AREA (unchanged) */}
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
          <h2 className="text-2xl font-semibold mb-4">List of All Services</h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* ============================================================
                STEP 1 — SEARCH PATIENT
              ============================================================ */}
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

              {/* ============================================================
                STEP 2 — REMAINDER OF ALL FORMS
              ============================================================ */}
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
                        <Button onClick={() => { setOpenAddClinicalServicesForm(true)}}>Add Service</Button>
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
  );
}
