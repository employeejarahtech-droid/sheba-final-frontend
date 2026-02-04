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
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useCategory, useUpdateCategory } from "@/features/products/api/categoryQueries";

const statusOptions = [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
];

const categorySchema = z.object({
    name: z.string().min(1, "Required"),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
});

export default function EditProductCategoryForm({
    open,
    setOpen,
    categoryId,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    categoryId: number;
}) {
    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            description: "",
            is_active: true,
        },
    });

    const { data: fetchedCategory } = useCategory(categoryId);
    const category = fetchedCategory?.data;

    useEffect(() => {
        if (category) {
            form.reset({
                name: category.name,
                description: category.description,
                is_active: category.is_active,
            });
        }
    }, [category, form]);

    const { mutate: updateCategory, isPending: isLoading } = useUpdateCategory();

    const handleUpdateCategory = async (values: z.infer<typeof categorySchema>) => {
        console.log(values);
        const payload = {
            id: categoryId,
            data: values,
        };

        updateCategory(payload, {
            onSuccess: (data) => {
                console.log("Category updated successfully:", data);
                if (data.status) {
                    toast.success("Category updated successfully");
                    setOpen(false);
                }
            },
            onError: (error: any) => {
                console.error("Error updating category:", error);
                toast.error(error?.message || "Error updating category");
            },
        });
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="max-w-[400px] w-full">
                <SheetHeader>
                    <SheetTitle>Update Category</SheetTitle>
                </SheetHeader>
                <div className="px-4">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleUpdateCategory)}
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
                                    "Update Category"
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
