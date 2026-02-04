import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
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
import { Loader, PlusCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAddCategory } from "@/features/products/api/categoryQueries";

const statusOptions = [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
];

const categorySchema = z.object({
    name: z.string().min(1, "Required"),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
});

export default function AddProductCategoryForm({
    open,
    setOpen,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
}) {
    const form = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            description: "",
            is_active: true,
        },
    });

    const { mutate: addProductCategory, isPending: isLoading } = useAddCategory();

    const handleAddCategory = async (values: z.infer<typeof categorySchema>) => {
        console.log(values);
        const payload = {
            name: values.name,
            description: values.description,
            is_active: values.is_active,
        };

        addProductCategory(payload, {
            onSuccess: (data) => {
                console.log("Category added successfully:", data);
                if (data.status) {
                    toast.success("Category added successfully");
                    setOpen(false);
                    form.reset();
                }
            },
            onError: (error: any) => {
                console.error("Error in adding category", error);
                toast.error(error?.message || "Error adding category");
            },
        });
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:translate-y-0 active:shadow-none">
                    <PlusCircle size={18} />
                    Add Category
                </button>
            </SheetTrigger>

            <SheetContent side="right" className="max-w-[400px] w-full">
                <SheetHeader>
                    <SheetTitle>Add Category</SheetTitle>
                </SheetHeader>
                <div className="px-4">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleAddCategory)}
                            className="space-y-5"
                        >
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter category name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter category description"
                                                {...field}
                                            />
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
                                            onValueChange={(value) => field.onChange(value === "true")}
                                            value={String(field.value)}
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
                                        Adding...
                                    </div>
                                ) : (
                                    "Add Category"
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
