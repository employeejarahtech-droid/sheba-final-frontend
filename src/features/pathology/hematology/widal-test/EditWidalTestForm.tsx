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
 
// --- Schema ---
const widalSchema = z.object({
    typhiO: z.string().min(1, { message: "Required" }),
    typhiH: z.string().min(1, { message: "Required" }),
    paratyphiAH: z.string().min(1, { message: "Required" }),
    paratyphiBH: z.string().min(1, { message: "Required" }),
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
