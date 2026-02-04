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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute(
  '/_authenticated/pathology/urine/urine-for-re-full/edit/$id',
)({
  component: EditUrineForReFull,
})

// --------------------------------------------------
// ZOD SCHEMA
// --------------------------------------------------
const urineSchema = z.object({
  // --- PHYSICAL ---
  color: z.string().min(1, "Required"),
  appearance: z.string().min(1, "Required"),
  sediment: z.string().optional(),

  // --- MICROSCOPIC ---
  epithelialCells: z.string().optional(),
  rbcCells: z.string().optional(),
  pusCells: z.string().optional(),
  yeastCells: z.string().optional(),
  spermatozoa: z.string().optional(),

  // --- CRYSTALS ---
  uricAcidCrystals: z.string().optional(),
  calciumOxalate: z.string().optional(),
  triplePhosphate: z.string().optional(),
  amorphousDeposits: z.string().optional(),

  // --- CASTS / LPE ---
  hyalineCasts: z.string().optional(),
  granularCasts: z.string().optional(),
  rbcCasts: z.string().optional(),
  wbcCasts: z.string().optional(),
  epithelialCasts: z.string().optional(),

  // --- CHEMICAL ---
  urobilinogen: z.string().optional(),
  bilirubin: z.string().optional(),
  ketone: z.string().optional(),
  blood: z.string().optional(),
  protein: z.string().optional(),
  nitrite: z.string().optional(),
  leukocytes: z.string().optional(),
  glucose: z.string().optional(),
  specificGravity: z.string().optional(),
  reactionPh: z.string().optional(),
  ascorbicAcid: z.string().optional(),

  comments: z.string().optional(),
  testCarriedOutBy: z.string().min(1, "Select a machine"),
});

type UrineFormValues = z.infer<typeof urineSchema>;

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------
function EditUrineForReFull() {
  const {id} = Route.useParams();
  const form = useForm<UrineFormValues>({
    resolver: zodResolver(urineSchema),
    defaultValues: {},
  });

  const handleView = () => alert("View triggered.");

  const onSubmit = (values: UrineFormValues) => {
    console.log("Urine Examination Report:", values);
  };

  const machineList = [
    "Sysmex XN-1000",
    "Sysmex XP-300",
    "Mindray BC-20",
    "Abbott CELL-DYN Ruby",
    "Nihon Kohden MEK-9100",
  ];

  return (
    <>
      {/* HEADER */}
      <Header>
        <TopNav
          links={[
            { title: "Overview", href: "dashboard/overview", isActive: true },
          ]}
        />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* MAIN */}
      <Main className="px-6 py-8 max-w-4xl mx-auto">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-2xl font-bold mb-6">Edit Urine Examination Report</h1>

          {/* INVOICE */}
          <div className="bg-white shadow rounded-xl p-6 border mb-8">
            <PatientInvoiceInfo
              invoiceInfo={{
                invoiceNo: "UEX-4021",
                patientName: "Hasina Begum",
                age: "29 Years",
                gender: "Female",
              }}
            />
          </div>

          {/* FORM */}
          <div className="bg-white shadow rounded-xl p-6 border">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                {/* ------------------------------- */}
                {/* PHYSICAL EXAMINATION            */}
                {/* ------------------------------- */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Physical Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["color", "appearance", "sediment"].map((fieldName) => (
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

                {/* ------------------------------- */}
                {/* MICROSCOPIC EXAMINATION         */}
                {/* ------------------------------- */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Microscopic Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "epithelialCells",
                      "rbcCells",
                      "pusCells",
                      "yeastCells",
                      "spermatozoa",
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

                {/* ------------------------------- */}
                {/* CRYSTALS                        */}
                {/* ------------------------------- */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Crystals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "uricAcidCrystals",
                      "calciumOxalate",
                      "triplePhosphate",
                      "amorphousDeposits",
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

                {/* ------------------------------- */}
                {/* CASTS / LPE                     */}
                {/* ------------------------------- */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Casts / LPE</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "hyalineCasts",
                      "granularCasts",
                      "rbcCasts",
                      "wbcCasts",
                      "epithelialCasts",
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

                {/* ------------------------------- */}
                {/* CHEMICAL EXAMINATION            */}
                {/* ------------------------------- */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Chemical Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "urobilinogen",
                      "bilirubin",
                      "ketone",
                      "blood",
                      "protein",
                      "nitrite",
                      "leukocytes",
                      "glucose",
                      "specificGravity",
                      "reactionPh",
                      "ascorbicAcid",
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
                        <Input placeholder="Write notes..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />



                {/* TEST CARRIED OUT BY */}
                <FormField
                  control={form.control}
                  name="testCarriedOutBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test carried out by</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select lab technician" />
                          </SelectTrigger>

                          <SelectContent>
                            {machineList.map((machine) => (
                              <SelectItem key={machine} value={machine}>
                                {machine}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                {/* BUTTONS */}
                <div className="flex justify-between gap-3 pt-4">
                  <Button type="submit" variant="success" className="flex-1">
                    Save Report
                  </Button>
                  <Link to="/pathology/urine/urine-for-re-full/report/$reportId" params={{ reportId: id }}>
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

