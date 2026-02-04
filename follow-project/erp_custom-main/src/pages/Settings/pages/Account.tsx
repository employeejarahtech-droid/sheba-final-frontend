


import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

/* ------------------ ZOD SCHEMA ------------------ */
const accountSchema = z.object({
    name: z.string().min(1, "Required"),
    dob: z.string().min(1, "Required"),
    language: z.string().min(1, "Required"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

/* ------------------ PAGE ------------------ */
export default function AccountSettings() {
    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: "",
            dob: "",
            language: "",
        },
    });

    const { control, handleSubmit } = form;

    const onSubmit: SubmitHandler<AccountFormValues> = (values) => {
        console.log("Updated account:", values);
        alert("Account updated! (Check console for data)");
    };

    return (
        <div className=" p-6 bg-white ">
            <h2 className="text-2xl font-semibold mb-2">Account</h2>
            <p className="text-gray-500 mb-6 text-sm">
                Update your account settings. Set your preferred language and timezone.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* NAME */}
                <Controller
                    control={control}
                    name="name"
                    render={({ field, fieldState }) => (
                        <Field>
                            <FieldLabel>Name</FieldLabel>
                            <Input {...field} placeholder="Your name" />
                            <p className="text-xs text-gray-400 mt-1">
                                This is the name that will be displayed on your profile and in emails.
                            </p>
                            <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                    )}
                />

                {/* DATE OF BIRTH */}
                <Controller
                    control={control}
                    name="dob"
                    render={({ field, fieldState }) => (
                        <Field>
                            <FieldLabel>Date of Birth</FieldLabel>
                            <Input {...field} type="date" />
                            <p className="text-xs text-gray-400 mt-1">
                                Your date of birth is used to calculate your age.
                            </p>
                            <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                    )}
                />

                {/* LANGUAGE */}
                <Controller
                    control={control}
                    name="language"
                    render={({ field, fieldState }) => (
                        <Field>
                            <FieldLabel>Language</FieldLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="bn">Bangla</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                    {/* Add more languages as needed */}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-400 mt-1">
                                This is the language that will be used in the dashboard.
                            </p>
                            <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                    )}
                />


                {/* SUBMIT */}
                <div className="pt-4">
                    <Button type="submit" className="w-full">
                        Update account
                    </Button>
                </div>
            </form>
        </div>
    );
}
