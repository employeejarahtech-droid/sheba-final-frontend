import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useUnit, useUpdateUnit } from "@/features/products/api/unitQueries";

const statusOptions = [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
];

const unitSchema = z.object({
    name: z.string().min(1, "Required"),
    is_active: z.boolean().optional(),
});

export default function EditProductUnitForm({
    open,
    setOpen,
    unitId,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    unitId: number;
}) {
    const form = useForm<z.infer<typeof unitSchema>>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            name: "",
            is_active: true,
        },
    });

    const { data: fetchedUnit } = useUnit(unitId);
    const unit = fetchedUnit?.data;

    useEffect(() => {
        if (unit) {
            form.reset({
                name: unit.name,
                is_active: unit.is_active,
            });
        }
    }, [unit, form]);

    const { mutate: updateUnit, isPending: isLoading } = useUpdateUnit();

    const handleUpdateUnit = async (values: z.infer<typeof unitSchema>) => {
        console.log(values);
        const payload = {
            id: unitId,
            data: values,
        };

        updateUnit(payload, {
            onSuccess: (data) => {
                console.log("Unit updated successfully:", data);
                if (data.status) {
                    toast.success("Unit updated successfully");
                    setOpen(false);
                }
            },
            onError: (error: any) => {
                console.error("Error updating unit:", error);
                toast.error(error?.message || "Error updating unit");
            },
        });
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="max-w-[400px] w-full">
                <SheetHeader>
                    <SheetTitle>Update Unit</SheetTitle>
                </SheetHeader>
                <div className="px-4">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleUpdateUnit)}
                            className="space-y-5"
                        >
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter unit name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select
                                            value={field.value === true ? "true" : "false"}
                                            onValueChange={(value) => field.onChange(value === "true")}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {statusOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </div>
                                ) : (
                                    "Update Unit"
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
