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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import {
  useGetRawMaterialCategoryByIdQuery,
  useUpdateRawMaterialCategoryMutation,
} from "@/store/features/admin/rawMaterialApiService";

const statusOptions = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const categorySchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface EditRawMaterialCategoryFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  categoryId: number;
  onSuccess?: () => void;
}

export default function EditRawMaterialCategoryForm({
  open,
  setOpen,
  categoryId,
  onSuccess,
}: EditRawMaterialCategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  });

  const { data: fetchedCategory } = useGetRawMaterialCategoryByIdQuery(categoryId, {
    skip: !categoryId,
  });

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

  const [updateCategory, { isLoading }] = useUpdateRawMaterialCategoryMutation();

  const handleUpdateCategory = async (values: CategoryFormValues) => {
    try {
      const payload = {
        id: categoryId,
        body: values,
      };

      const res = await updateCategory(payload).unwrap();

      if (res.status) {
        toast.success("Category updated successfully");
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error("Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error(
        "Error updating category" +
          (error instanceof Error ? ": " + error.message : "")
      );
    }
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
