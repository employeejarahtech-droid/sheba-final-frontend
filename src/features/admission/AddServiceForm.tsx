import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";

export function AddServiceForm({ open, setOpen }: any) {

    const form = useForm({
        defaultValues: {
            docType: "",
            name: "",
        },
    });

    const handleAddOperationType = (data: any) => {
        console.log("Form Data:", data);
        const payload = {
            docType: data.docType,
            name: data.name,
        };

        console.log("Payload Ready:", payload);

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
                        <SheetTitle>Add New Service</SheetTitle>
                    </SheetHeader>

                    <div className="px-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddOperationType)} className="space-y-4">
                                <div className="mt-6 space-y-4">

                                    <FormField
                                        control={form.control}
                                        name="docType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Doctor Type</FormLabel>
                                                <FormControl>
                                                    <Select onValueChange={field.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select Type..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="general">Surgeon</SelectItem>
                                                            <SelectItem value="local">Anesthelogist</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Doctor Name</FormLabel>
                                                <FormControl>
                                                    <Select onValueChange={field.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select Type..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="general">Dr. John</SelectItem>
                                                            <SelectItem value="local">Dr. Jane</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <SheetFooter>
                                        <Button type="submit">
                                            Add
                                        </Button>
                                        <SheetClose asChild>
                                            <Button variant="secondary">Cancel</Button>
                                        </SheetClose>
                                    </SheetFooter>
                                </div>
                            </form>
                        </Form>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
