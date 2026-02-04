"use client";

import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { BackButton } from "@/components/BackButton";
import { useAddRawMaterialSupplierMutation } from "@/store/features/admin/rawMaterialApiService";
import { Textarea } from "@/components/ui/textarea";

/* ------------------ ZOD SCHEMA ------------------ */
const supplierSchema = z.object({
  name: z.string().min(1, "Required"),
  code: z.string().optional(),
  email: z.string().min(1, "Required").email("Invalid email"),
  phone: z.string().optional(),
  contact_person: z.string().optional(),
  address: z.string().optional(),
  payment_terms: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

/* ------------------ PAGE ------------------ */
export default function AddRMSupplier() {
  const navigate = useNavigate();
  const [addSupplier, { isLoading }] = useAddRawMaterialSupplierMutation();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      code: "",
      email: "",
      phone: "",
      contact_person: "",
      address: "",
      payment_terms: "",
      status: "Active",
    },
  });

  const { control, handleSubmit, reset } = form;

  const onSubmit: SubmitHandler<SupplierFormValues> = async (values) => {
    try {
      const payload = {
        name: values.name,
        code: values.code,
        contact_person: values.contact_person,
        email: values.email,
        phone: values.phone,
        address: values.address,
        payment_terms: values.payment_terms,
        is_active: values.status === "Active",
      };

      const res = await addSupplier(payload).unwrap();
      if (res?.status) {
        toast.success("Supplier added successfully");
        reset();
        navigate("/dashboard/raw-materials/suppliers");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add supplier");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Add Supplier</h1>
        <BackButton />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* BASIC INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <Input placeholder="Supplier Name" {...field} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="code"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Supplier Code (optional)</FieldLabel>
                  <Input placeholder="e.g., SUP001" {...field} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input type="email" placeholder="supplier@example.com" {...field} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Phone</FieldLabel>
                  <Input placeholder="+880 1234-567-890" {...field} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="contact_person"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Contact Person</FieldLabel>
                  <Input placeholder="John Doe" {...field} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="payment_terms"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Payment Terms</FieldLabel>
                  <Input placeholder="e.g., Net 30" {...field} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field, fieldState }) => (
                <Field className="md:col-span-2">
                  <FieldLabel>Address</FieldLabel>
                  <Textarea placeholder="Full Address" {...field} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="status"
              render={({ field, fieldState }) => (
                <Field className="md:col-span-2">
                  <FieldLabel>Status</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </CardContent>
        </Card>

        {/* SUBMIT */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Supplier"}
          </Button>
        </div>
      </form>
    </div>
  );
}
