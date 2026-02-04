import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";


import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";

/* ------------------ ZOD SCHEMA ------------------ */
const emailSmsSchema = z.object({
  /* Email SMTP */
  smtpHost: z.string().min(1, "SMTP Host is required"),
  smtpPort: z.string().min(1, "Port is required"),
  encryption: z.enum(["TLS", "SSL", "None"]),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password required"),
  fromName: z.string().min(1, "Sender name required"),
  fromEmail: z.string().email("Invalid email"),

  /* SMS / WhatsApp */
  provider: z.enum(["None", "Twilio", "Msg91", "WhatsAppAPI"]),
  apiKey: z.string().optional(),
  senderId: z.string().optional(),
});

type FormValues = z.infer<typeof emailSmsSchema>;

/* ------------------ PAGE ------------------ */
export default function EmailSmsSettingsPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(emailSmsSchema),
    defaultValues: {
      smtpHost: "smtp.mailgun.org",
      smtpPort: "587",
      encryption: "TLS",
      username: "",
      password: "",
      fromName: "",
      fromEmail: "",
      provider: "None",
      apiKey: "",
      senderId: "",
    },
  });

  const { control, handleSubmit } = form;

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    console.log("Email & SMS Settings:", values);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-6">

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* EMAIL SETTINGS */}
        <Card className="
          border border-gray-300 dark:border-gray-700
          rounded-sm shadow-sm
          bg-white dark:bg-gray-900
        ">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Email (SMTP) Settings
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 pt-4">

            {/* SMTP Host */}
            <Controller
              control={control}
              name="smtpHost"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel className="text-gray-700 dark:text-gray-300">SMTP Host</FieldLabel>
                  <Input
                    placeholder="smtp.mailgun.org"
                    {...field}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* Port */}
            <Controller
              control={control}
              name="smtpPort"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel className="text-gray-700 dark:text-gray-300">Port</FieldLabel>
                  <Input
                    placeholder="587"
                    {...field}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* Encryption */}
            <Controller
              control={control}
              name="encryption"
              render={({ field }) => (
                <Field>
                  <FieldLabel className="text-gray-700 dark:text-gray-300">Encryption</FieldLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select Encryption" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TLS">TLS</SelectItem>
                      <SelectItem value="SSL">SSL</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            {/* Username */}
            <Controller
              control={control}
              name="username"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel className="text-gray-700 dark:text-gray-300">Username</FieldLabel>
                  <Input
                    placeholder="postmaster@domain.com"
                    {...field}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel className="text-gray-700 dark:text-gray-300">Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="********"
                    {...field}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* From Name */}
            <Controller
              control={control}
              name="fromName"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel className="text-gray-700 dark:text-gray-300">From Name</FieldLabel>
                  <Input
                    placeholder="Your Company Name"
                    {...field}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* From Email */}
            <Controller
              control={control}
              name="fromEmail"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel className="text-gray-700 dark:text-gray-300">From Email</FieldLabel>
                  <Input
                    placeholder="no-reply@domain.com"
                    {...field}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

          </CardContent>
        </Card>

        {/* SMS / WHATSAPP */}
        <Card className="
          border border-gray-300 dark:border-gray-700
          rounded-sm shadow-sm
          bg-white dark:bg-gray-900
        ">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              SMS / WhatsApp Gateway
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 pt-4">

            {/* Provider */}
            <Controller
              control={control}
              name="provider"
              render={({ field }) => (
                <Field>
                  <FieldLabel className="text-gray-700 dark:text-gray-300">Provider</FieldLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Twilio">Twilio</SelectItem>
                      <SelectItem value="Msg91">MSG91</SelectItem>
                      <SelectItem value="WhatsAppAPI">WhatsApp API</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            {/* API Key */}
            <Controller
              control={control}
              name="apiKey"
              render={({ field }) => (
                <Field>
                  <FieldLabel className="text-gray-700 dark:text-gray-300">API Key / Token</FieldLabel>
                  <Input
                    placeholder="API key or access token"
                    {...field}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </Field>
              )}
            />

            {/* Sender ID */}
            <Controller
              control={control}
              name="senderId"
              render={({ field }) => (
                <Field>
                  <FieldLabel className="text-gray-700 dark:text-gray-300">Sender ID / From Number</FieldLabel>
                  <Input
                    placeholder="e.g., COMPANY / +60123456789"
                    {...field}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </Field>
              )}
            />
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
            Save Settings
          </Button>
        </div>

      </form>
    </div>
  );
}
