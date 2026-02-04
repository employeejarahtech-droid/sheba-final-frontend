import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import z from "zod";

const clinicalServicesSchema = z.object({
    admission_fee: z.boolean(),
    ot_charge: z.boolean(),
    bed_cabin: z.boolean(),
    service_charge: z.boolean(),
    nebulizer: z.boolean(),
    oxygen: z.boolean(),
})

export function AddClinicalServicesForm({ open, setOpen }: any) {

    const form = useForm({
        defaultValues: {
            admission_fee: false,
            ot_charge: false,
            bed_cabin: false,
            service_charge: false,
            nebulizer: false,
            oxygen: false
        },
    });

    const handleAddClinicalServices = (data: z.infer<typeof clinicalServicesSchema>) => {
        console.log("Form Data:", data);
        // const payload = {
        //     docType: data.docType,
        //     name: data.name,
        // };

        //console.log("Payload Ready:", payload);

        // TODO: send request
        // await axios.post('/api/operation-types', payload)

        setOpen(false);
    };

    return (
        <>
            {/* Drawer */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="max-w-[450px] w-full">
                    <SheetHeader>
                        <SheetTitle>Clinical Services</SheetTitle>
                    </SheetHeader>

                    <div className="px-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddClinicalServices)} className="space-y-4">
                                <div className="mt-6 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="admission_fee"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 cursor-pointer">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel htmlFor="admission_fee">Admission Fee</FormLabel>

                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="ot_charge"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 cursor-pointer">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel htmlFor="ot_charge">OT Charge</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="bed_cabin"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 cursor-pointer">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel htmlFor="ot_charge">Bed / Cabin</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="service_charge"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 cursor-pointer">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel htmlFor="ot_charge">Service Charge</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="nebulizer"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 cursor-pointer">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel htmlFor="ot_charge">Nebulizer</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="oxygen"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 cursor-pointer">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel htmlFor="ot_charge">Oxygen</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <SheetFooter>
                                    <Button type="submit">
                                        Add
                                    </Button>
                                    <SheetClose asChild>
                                        <Button variant="secondary">Cancel</Button>
                                    </SheetClose>
                                </SheetFooter>
                            </form>
                        </Form>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
