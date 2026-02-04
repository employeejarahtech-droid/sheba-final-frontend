import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

export function AddConsultantForm({ open, setOpen }: any) {

    const form = useForm({
        defaultValues: {        
            name: '',
            visitDate: '',
        },
    });

    const handleAddConsultant = (data: any) => {
        console.log("Form Data:", data);
        const payload = {
            name: data.name,
            visitDate: data.visitDate
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
                        <SheetTitle>Add New Consultant</SheetTitle>
                    </SheetHeader>

                    <div className="px-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddConsultant)} className="space-y-4">
                                <div className="mt-6 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Consultant Name</FormLabel>
                                                <FormControl>
                                                    <Select onValueChange={field.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select Type..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="minor">Dr. A</SelectItem>
                                                            <SelectItem value="major">Dr. B</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="visitDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Visit Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className="block" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <SheetFooter>
                                        <Button type="submit">
                                            Add
                                        </Button>
                                        <SheetClose asChild>
                                            <Button variant="secondary" type="button">Cancel</Button>
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
