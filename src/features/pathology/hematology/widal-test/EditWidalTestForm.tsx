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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "lucide-react";
 
// --- Schema ---
const widalSchema = z.object({
    typhiO: z.string().min(1, { message: "Required" }),
    typhiH: z.string().min(1, { message: "Required" }),
    paratyphiAH: z.string().min(1, { message: "Required" }),
    paratyphiBH: z.string().min(1, { message: "Required" }),
    status: z.union([z.literal('complete'), z.literal('incomplete')]),
});
 
type WidalFormValues = z.infer<typeof widalSchema>;
 
interface WidalTestFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}
 
export function WidalTestForm({ open, setOpen }: WidalTestFormProps) {
    const form = useForm<WidalFormValues>({
        resolver: zodResolver(widalSchema),
        defaultValues: {
            typhiO: "",
            typhiH: "",
            paratyphiAH: "",
            paratyphiBH: "",
            status: "incomplete",
        },
    });
 
    function onSubmit(values: WidalFormValues) {
        console.log("Widal Test Report:", values);
        setOpen(false);
    }
 
    const handlePrint = () => alert("Print triggered.");
    const handleView = () => alert("View triggered.");
 
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Widal Tests</SheetTitle>
                </SheetHeader>
 
                <PatientInvoiceInfo
                    invoiceInfo={{
                        invoiceNo: "RPT-1007",
                        patientName: "Shakil Hasan",
                        age: "33 Years",
                        gender: "Male",
                    }}
                />
 
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >
 
                        {/* S. Typhi O */}
                        <FormField
                            control={form.control}
                            name="typhiO"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>S. Typhi O (titer)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1:80" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
 
                        {/* S. Typhi H */}
                        <FormField
                            control={form.control}
                            name="typhiH"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>S. Typhi H (titer)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1:160" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
 
                        {/* S. Paratyphi A (AH) */}
                        <FormField
                            control={form.control}
                            name="paratyphiAH"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>S. Paratyphi A (AH) (titer)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1:40" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
 
                        {/* S. Paratyphi B (BH) */}
                        <FormField
                            control={form.control}
                            name="paratyphiBH"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>S. Paratyphi B (BH) (titer)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1:40" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
 
                        {/* Report Status */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border rounded-lg p-4">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md">
                                    <Activity className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800">Report Status</h3>
                                    <p className="text-xs text-gray-600">Mark report as complete or incomplete</p>
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value === 'complete' ? 'complete' : 'incomplete'}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="incomplete">Incomplete</SelectItem>
                                                    <SelectItem value="complete">Complete</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>
 
                            <Button type="button" variant="warning" onClick={handlePrint}>
                                Print
                            </Button>
 
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
