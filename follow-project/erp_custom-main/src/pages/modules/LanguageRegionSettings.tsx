import { Controller, useForm, type SubmitHandler, } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// LANGUAGE & REGION SCHEMA
const localeSchema = z.object({
  language: z.string().min(1, "Language is required"),
  timezone: z.string().min(1, "Timezone is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  numberFormat: z.string().min(1, "Number format is required"),
  currency: z.string().min(1, "Currency is required"),
});

type LocaleFormValues = z.infer<typeof localeSchema>;

export default function LanguageRegionSettings() {
  const form = useForm<LocaleFormValues>({
    resolver: zodResolver(localeSchema),
    defaultValues: {
      language: "en-MY",
      timezone: "Asia/Kuala_Lumpur",
      dateFormat: "dd/MM/yyyy",
      numberFormat: "1,234.56",
      currency: "MYR",
    },
  });

  const { control, handleSubmit } = form;

  const onSubmit: SubmitHandler<LocaleFormValues> = (v) => {
    console.log("Locale Settings:", v);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto py-6">

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        <Card className="border border-gray-300 dark:border-gray-700 rounded-sm shadow-sm bg-white dark:bg-gray-900">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Language & Region
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-5 pt-4">

            {/* LANGUAGE */}
            <Controller
              control={control}
              name="language"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Language</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-MY">en-MY – English (Malaysia)</SelectItem>
                      <SelectItem value="en-US">en-US – English (US)</SelectItem>
                      <SelectItem value="en-GB">en-GB – English (UK)</SelectItem>
                      <SelectItem value="ms-MY">ms-MY – Bahasa Malaysia</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* TIMEZONE */}
            <Controller
              control={control}
              name="timezone"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Timezone</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                      <SelectItem value="Asia/Dhaka">Asia/Dhaka</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* DATE FORMAT */}
            <Controller
              control={control}
              name="dateFormat"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Date Format</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                      <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* NUMBER FORMAT */}
            <Controller
              control={control}
              name="numberFormat"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Number Format</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1,234.56">1,234.56</SelectItem>
                      <SelectItem value="1.234,56">1.234,56</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* CURRENCY */}
            <Controller
              control={control}
              name="currency"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Default Currency</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MYR">MYR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </CardContent>
        </Card>

        {/* SAVE BUTTON */}
        <div className="flex justify-end">
          <Button
            type="submit"
            className="px-6 py-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm shadow-sm"
          >
            Save Locale Settings
          </Button>
        </div>

      </form>
    </div>
  );
}
