
import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";

export const Route = createFileRoute(
  '/_authenticated/pathology/stool/stool-re/edit/$id',
)({
  component: EditStoolRe,
})

// --------------------------------------------------
// TOP NAV (same as your example)
// --------------------------------------------------
const topNav = [
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

// --------------------------------------------------
// ZOD SCHEMA
// --------------------------------------------------
const stoolSchema = z.object({
  // --- PHYSICAL ---
  colour: z.string().min(1, "Required"),
  consistency: z.string().min(1, "Required"),
  mucous: z.string().optional(),
  blood: z.string().optional(),
  helminths: z.string().optional(),

  // --- CHEMICAL ---
  reaction: z.string().optional(),
  reducingSubstance: z.string().optional(),
  occultBlood: z.string().optional(),
  bilePigments: z.string().optional(),
  bileSalts: z.string().optional(),

  // --- MICROSCOPIC ---
  ovaOf: z.string().optional(),
  cystsOf: z.string().optional(),
  larvaOf: z.string().optional(),
  trophozoiteOf: z.string().optional(),
  pusCells: z.string().optional(),
  epithelialCells: z.string().optional(),
  rbc: z.string().optional(),
  macrophage: z.string().optional(),
  vegetableCells: z.string().optional(),
  undigestedFood: z.string().optional(),
  fatGlobules: z.string().optional(),
  others: z.string().optional(),

  comments: z.string().optional(),
});

type StoolFormValues = z.infer<typeof stoolSchema>;

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------
function EditStoolRe() {
  const { id } = Route.useParams();
  const form = useForm<StoolFormValues>({
    resolver: zodResolver(stoolSchema),
    defaultValues: {
      colour: "",
      consistency: "",
      mucous: "",
      blood: "",
      helminths: "",
      reaction: "",
      reducingSubstance: "",
      occultBlood: "",
      bilePigments: "",
      bileSalts: "",
      ovaOf: "",
      cystsOf: "",
      larvaOf: "",
      trophozoiteOf: "",
      pusCells: "",
      epithelialCells: "",
      rbc: "",
      macrophage: "",
      vegetableCells: "",
      undigestedFood: "",
      fatGlobules: "",
      others: "",
      comments: "",
    },
  });

  const onSubmit = (values: StoolFormValues) => {
    console.log("Stool Examination Report:", values);
  };

  const handleView = () => alert("View triggered.");

  return (
    <>
      {/* Header */}
      <Header className="bg-white shadow-sm">
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main */}
      <Main className="px-6 py-8 max-w-4xl mx-auto">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-2xl font-bold mb-6">Edit Stool Examination Report</h1>

          {/* Invoice Info */}
          <div className="bg-white shadow rounded-xl p-6 border mb-8">
            <PatientInvoiceInfo
              invoiceInfo={{
                invoiceNo: "RPT-3033",
                patientName: "Abdul Karim",
                age: "45 Years",
                gender: "Male",
              }}
            />
          </div>

          {/* FORM */}
          <div className="bg-white shadow rounded-xl p-6 border">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* ====================== */}
                {/* PHYSICAL EXAMINATION    */}
                {/* ====================== */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Physical Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["colour", "consistency", "mucous", "blood", "helminths"].map(
                      (fieldName) => (
                        <FormField
                          key={fieldName}
                          control={form.control}
                          name={fieldName as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="capitalize">
                                {fieldName.replace(/([A-Z])/g, " $1")}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )
                    )}
                  </div>
                </section>

                {/* ====================== */}
                {/* CHEMICAL EXAMINATION    */}
                {/* ====================== */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Chemical Examination</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "reaction",
                      "reducingSubstance",
                      "occultBlood",
                      "bilePigments",
                      "bileSalts",
                    ].map((fieldName) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="capitalize">
                              {fieldName
                                .replace(/([A-Z])/g, " $1")
                                .replace("Substance", " Substance")}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </section>

                {/* ====================== */}
                {/* MICROSCOPIC EXAMINATION */}
                {/* ====================== */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Microscopic Examination</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "ovaOf",
                      "cystsOf",
                      "larvaOf",
                      "trophozoiteOf",
                      "pusCells",
                      "epithelialCells",
                      "rbc",
                      "macrophage",
                      "vegetableCells",
                      "undigestedFood",
                      "fatGlobules",
                      "others",
                    ].map((fieldName) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="capitalize">
                              {fieldName.replace(/([A-Z])/g, " $1")}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </section>

                {/* COMMENTS */}
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments / Remarks</FormLabel>
                      <FormControl>
                        <Input placeholder="Additional notes..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* BUTTONS */}
                <div className="flex justify-between gap-3 pt-6">
                  <Button type="submit" variant="success" className="flex-1">
                    Save Report
                  </Button>

                  <Link to={`/pathology/stool/stool-re/report/$reportId`} params={{ reportId: id }}>
                    <Button type="button" variant="warning" className="flex-1">
                      Print Preview
                    </Button>
                  </Link>

                  <Button type="button" variant="info" className="flex-1" onClick={handleView}>
                    View
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </Main>
    </>
  );
}

