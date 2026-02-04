import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Main } from "@/components/layout/main";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { topNav } from "@/data/data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getCookie } from "@/lib/cookies";
import { toast } from "sonner";

export const Route = createFileRoute(
  '/_authenticated/pathology/hematology/cbc-short/edit/$id',
)({
  component: EditCBCShort,
})

// ─────────────────────────────
// FORM SCHEMA
// ─────────────────────────────
const cbcSchema = z.object({

  hemoglobin: z.string().min(1, "Required"),
  rbc_count: z.string().min(1, "Required"),
  wbc_count: z.string().min(1, "Required"),
  platelets: z.string().min(1, "Required"),

  hct: z.string().min(1, "Required"),
  mcv: z.string().min(1, "Required"),
  mch: z.string().min(1, "Required"),
  mchc: z.string().min(1, "Required"),

  neutrophils: z.string().min(1, "Required"),
  lymphocytes: z.string().min(1, "Required"),
  monocytes: z.string().min(1, "Required"),
  eosinophils: z.string().min(1, "Required"),
  basophils: z.string().min(1, "Required"),
});

type CBCFormValues = z.infer<typeof cbcSchema>;

// ─────────────────────────────
// COMPONENT
// ─────────────────────────────
function EditCBCShort() {
  const { id } = Route.useParams();

  const navigate = useNavigate();
  const token = getCookie('accessToken');
  const queryClient = useQueryClient();

  const form = useForm<CBCFormValues>({
    resolver: zodResolver(cbcSchema),
    defaultValues: {
      hemoglobin: "",
      rbc_count: "",
      wbc_count: "",
      platelets: "",

      hct: "",
      mcv: "",
      mch: "",
      mchc: "",

      neutrophils: "",
      lymphocytes: "",
      monocytes: "",
      eosinophils: "",
      basophils: "",

    },
  });

  // Fetch existing peripheral blood film data
  const { data: cbcData } = useQuery({
    queryKey: ["cbc", id],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cbc/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch test");
      const result = await res.json();
      return result.data;
    },
    enabled: !!token && !!id,
  });

  console.log('cbcData', cbcData);

  useEffect(() => {
    if (cbcData) {
      form.reset({
        hemoglobin: cbcData.hemoglobin,
        rbc_count: cbcData.rbc_count,
        wbc_count: cbcData.wbc_count,
        platelets: cbcData.platelets,

        hct: cbcData.hct,
        mcv: cbcData.mcv,
        mch: cbcData.mch,
        mchc: cbcData.mchc,

        neutrophils: cbcData.neutrophils,
        lymphocytes: cbcData.lymphocytes,
        monocytes: cbcData.monocytes,
        eosinophils: cbcData.eosinophils,
        basophils: cbcData.basophils,

      })
    }
  }, [cbcData, form]);

  //PUT api call

    const updateCBCMutation = useMutation({
        mutationFn: async (data: CBCFormValues) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/cbc/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        invoice_id: cbcData?.invoice_id,
                        ...data
                    }),
                }
            );
            if (!res.ok) throw new Error("Failed to update cbc");
            return res.json();
        },
        onSuccess: (data) => {
            console.log("Updated API Response:", data);
            queryClient.invalidateQueries({ queryKey: ["cbc", id] });
            toast.success(data.message || "CBC updated successfully");
            navigate({ to: "/pathology/hematology/cbc-short" });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update cbc");
        },
    })

  const onSubmit = (values: CBCFormValues) => {
    console.log("CBC Report:", values);
    updateCBCMutation.mutate(values);
  };

  return (
    <>
      {/* Header */}
      <Header fixed>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main Content */}
      <Main className="px-6 py-8 max-w-5xl mx-auto">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-2xl font-bold mb-6">Edit Blood For CBC Report</h1>

          {/* Invoice + Patient Section */}
          <div className="bg-white shadow rounded-xl p-6 border mb-8">
            <PatientInvoiceInfo
              invoiceInfo={{
                invoiceNo: "INV-2002",
                patientName: "Rahim Uddin",
                age: "29 Years",
                gender: "Male",
              }}
            />
          </div>

          {/* CBC Form */}
          <div className="bg-white shadow rounded-xl p-6 border">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Group: Basic CBC */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Hematology Indices</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="hemoglobin" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hemoglobin (g/dL)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 14.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="rbc_count" render={({ field }) => (
                      <FormItem>
                        <FormLabel>RBC Count (million/cmm)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 5.2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="wbc_count" render={({ field }) => (
                      <FormItem>
                        <FormLabel>WBC Count (/cmm)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 7800" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="platelets" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platelets (/cmm)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 250000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 mt-8">RBC Indices</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="hct" render={({ field }) => (
                      <FormItem>
                        <FormLabel>HCT (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 42.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="mcv" render={({ field }) => (
                      <FormItem>
                        <FormLabel>MCV (fL)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 88.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="mch" render={({ field }) => (
                      <FormItem>
                        <FormLabel>MCH (pg)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 29.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="mchc" render={({ field }) => (
                      <FormItem>
                        <FormLabel>MCHC (g/dL)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 33.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                  </div>

                </div>

                {/* Group: Differential Count */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Differential Count
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Neutrophils */}
                    <FormField
                      control={form.control}
                      name="neutrophils"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neutrophils (%)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Lymphocytes */}
                    <FormField
                      control={form.control}
                      name="lymphocytes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lymphocytes (%)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Monocytes */}
                    <FormField
                      control={form.control}
                      name="monocytes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monocytes (%)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 6" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Eosinophils */}
                    <FormField
                      control={form.control}
                      name="eosinophils"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Eosinophils (%)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Basophils */}
                    <FormField
                      control={form.control}
                      name="basophils"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Basophils (%)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-between gap-3 pt-4">
                  <Button type="submit" variant="success" className="flex-1">
                    Save Report
                  </Button>

                  <Link to="/pathology/hematology/cbc-short/report/$reportId" params={{ reportId: id }}>
                    <Button type="button" variant="warning" className="flex-1">
                      Print Preview
                    </Button>
                  </Link>

                  <Button type="button" variant="info" className="flex-1">
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

