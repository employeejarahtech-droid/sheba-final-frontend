import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

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

import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { Link } from "@tanstack/react-router";

// --- Schema ---
const thyroidFunctionSchema = z.object({
    t3: z.string().min(1, { message: "Required" }),
    t4: z.string().min(1, { message: "Required" }),
    tsh: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
});

type ThyroidFunctionFormValues = z.infer<typeof thyroidFunctionSchema>;

interface ThyroidFunctionFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number
}

export function ThyroidFunctionTestForm({ open, setOpen, reportId }: ThyroidFunctionFormProps) {
    const form = useForm<ThyroidFunctionFormValues>({
        resolver: zodResolver(thyroidFunctionSchema),
        defaultValues: {
            t3: "",
            t4: "",
            tsh: "",
            comments: "",
        },
    });

    function onSubmit(values: ThyroidFunctionFormValues) {
        console.log("Thyroid Function Test Report:", values);
        setOpen(false);
    }

    const handleView = () => alert("View triggered.");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Thyroid Function Test (T3/T4/TSH)</SheetTitle>
                </SheetHeader>

              <div className="px-4">
                  <PatientInvoiceInfo
                    invoiceInfo={{
                        invoiceNo: "RPT-1017",
                        patientName: "Sadia Hossain",
                        age: "37 Years",
                        gender: "Female",
                    }}
                />
              </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* T3 */}
                        <FormField
                            control={form.control}
                            name="t3"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>T3 (Triiodothyronine) (ng/dL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter T3 value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* T4 */}
                        <FormField
                            control={form.control}
                            name="t4"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>T4 (Thyroxine) (µg/dL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter T4 value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* TSH */}
                        <FormField
                            control={form.control}
                            name="tsh"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>TSH (µIU/mL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter TSH value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Comments */}
                        <FormField
                            control={form.control}
                            name="comments"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comments / Remarks (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Additional notes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Buttons */}
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to="/pathology/special/t3t4tsh/report/$reportId" params={{ reportId: reportId.toString() }}>
                                <Button type="button" variant="warning">
                                    Print Preview
                                </Button>
                            </Link>

                            <Button type="button" variant="info" onClick={handleView}>
                                View
                            </Button>
                        </div>

                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
