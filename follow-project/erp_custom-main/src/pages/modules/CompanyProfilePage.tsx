import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const companySchema = z.object({
  logo: z.instanceof(File).optional(),
  name: z.string().min(1, "Required"),
  registrationNo: z.string().optional(),
  taxNo: z.string().optional(),
  address: z.string().min(1, "Required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function CompanyProfilePage() {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      logo: undefined,
      name: "",
      registrationNo: "",
      taxNo: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  const { control, handleSubmit } = form;

  const onSubmit: SubmitHandler<CompanyFormValues> = (values) => {
    console.log("Company Profile:", values);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-6">

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* COMPANY DETAILS */}
        <Card className="
          border border-gray-300 dark:border-gray-700
          rounded-sm shadow-sm
          bg-white dark:bg-gray-900
        ">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Company Profile Details
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 pt-4">

            {/* Logo */}
            <Controller
              control={control}
              name="logo"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel className="font-medium text-gray-700 dark:text-gray-300">
                    Upload Logo
                  </FieldLabel>

                  <Input
                    type="file"
                    accept="image/*"
                    className="
                      border border-gray-300 dark:border-gray-700 
                      rounded-sm shadow-sm
                      bg-gray-50 dark:bg-gray-800
                      text-gray-800 dark:text-gray-200
                    "
                    onChange={(e) => field.onChange(e.target.files?.[0])}
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* Company Name */}
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel className="font-medium text-gray-700 dark:text-gray-300">
                    Company Name
                  </FieldLabel>

                  <Input
                    placeholder="Your Company Name Sdn Bhd"
                    {...field}
                    className="
                      border border-gray-300 dark:border-gray-700 
                      rounded-sm shadow-sm
                      bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-200
                    "
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* Registration Number */}
            <Controller
              control={control}
              name="registrationNo"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel className="font-medium text-gray-700 dark:text-gray-300">
                    Registration No.
                  </FieldLabel>
                  <Input
                    placeholder="e.g. 1234567-X"
                    {...field}
                    className="
                      border border-gray-300 dark:border-gray-700 
                      rounded-sm shadow-sm
                      bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-200
                    "
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* Tax */}
            <Controller
              control={control}
              name="taxNo"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel className="font-medium text-gray-700 dark:text-gray-300">
                    Tax / GST / VAT No.
                  </FieldLabel>
                  <Input
                    placeholder="e.g. GST-XXXX"
                    {...field}
                    className="
                      border border-gray-300 dark:border-gray-700 
                      rounded-sm shadow-sm
                      bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-200
                    "
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

          </CardContent>
        </Card>

        {/* ADDRESS & CONTACT */}
        <Card className="
          border border-gray-300 dark:border-gray-700
          rounded-sm shadow-sm
          bg-white dark:bg-gray-900
        ">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Address & Contact
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">

            {/* Address */}
            <Controller
              control={control}
              name="address"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel className="font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </FieldLabel>
                  <Textarea
                    placeholder="Full company address"
                    {...field}
                    className="
                      border border-gray-300 dark:border-gray-700 
                      rounded-sm shadow-sm
                      bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-200
                    "
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* Phone + Email */}
            <div className="grid md:grid-cols-2 gap-4">

              <Controller
                control={control}
                name="phone"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel className="font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </FieldLabel>
                    <Input
                      placeholder="+60..."
                      {...field}
                      className="
                        border border-gray-300 dark:border-gray-700 
                        rounded-sm shadow-sm
                        bg-white dark:bg-gray-800
                        text-gray-900 dark:text-gray-200
                      "
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel className="font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </FieldLabel>
                    <Input
                      placeholder="info@company.com"
                      {...field}
                      className="
                        border border-gray-300 dark:border-gray-700 
                        rounded-sm shadow-sm
                        bg-white dark:bg-gray-800
                        text-gray-900 dark:text-gray-200
                      "
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

            </div>
          </CardContent>
        </Card>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end">
          <Button
            type="submit"
            className="
              px-6 py-2 
              bg-gray-800 hover:bg-gray-900 
              dark:bg-gray-700 dark:hover:bg-gray-600
              text-white rounded-sm shadow-sm
            "
          >
            Save Company Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
