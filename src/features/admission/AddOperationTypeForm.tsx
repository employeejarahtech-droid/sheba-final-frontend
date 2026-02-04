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

export function AddOperationTypeForm({ open, setOpen }: any) {

    const form = useForm({
        defaultValues: {
            newOperationNo: "",
            opType: "",
            anesthesiaType: "",
            opDate: "",
        },
    });

    const handleAddOperationType = (data: any) => {
        console.log("Form Data:", data);
        const payload = {
            operationNo: data.newOperationNo,
            type: data.opType,
            anesthesia: data.anesthesiaType,
            date: data.opDate,
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
                        <SheetTitle>Add New Operation Type</SheetTitle>
                    </SheetHeader>

                    <div className="px-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddOperationType)} className="space-y-4">
                                <div className="mt-6 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="newOperationNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Consultant Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 33526" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="opType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Operation Type</FormLabel>
                                                <FormControl>
                                                    <Select onValueChange={field.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select Type..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="minor">Minor</SelectItem>
                                                            <SelectItem value="major">Major</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="anesthesiaType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Anesthesia Type</FormLabel>
                                                <FormControl>
                                                    <Select onValueChange={field.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select Type..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="general">General</SelectItem>
                                                            <SelectItem value="local">Local</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="opDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Operation Date</FormLabel>
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
