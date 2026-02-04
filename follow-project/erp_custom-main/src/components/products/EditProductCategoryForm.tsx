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
import { Textarea } from "../ui/textarea";
import { useGetCategoryByIdQuery, useUpdateCategoryMutation } from "@/store/features/admin/productsApiService";
import { Loader, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/store/store";
import { ProductPermission, SuperAdminPermission } from "@/config/permissions";

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

  const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);
  const canEditCategory = userPermissions.includes(ProductPermission.Edit_CATEGORIES) || userPermissions.includes(SuperAdminPermission.ACCESS_ALL);




  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  });

  const { data: fetchedCategory } = useGetCategoryByIdQuery(categoryId, { skip: !categoryId }); // Replace null with actual category data to edit


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

  const [updateCategory, { isLoading }] = useUpdateCategoryMutation();
  const handleUpdateCategory = async (values: z.infer<typeof categorySchema>) => {
    console.log(values);
    const payload = {
      id: categoryId, // Replace with actual category ID to update
      body: values,
    };

    try {
      const res = await updateCategory(payload).unwrap();
      console.log("Category updated successfully:", res.data);

      if (res.status) {
        // Show success message
        toast.success("Category updated successfully");
        setOpen(false);
      }
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast.error(error?.data?.message || "Error updating category");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-[400px] w-full">
        <SheetHeader>
          <SheetTitle>Update Category</SheetTitle>
        </SheetHeader>
        <div className="px-4">

          {!canEditCategory ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
                <ShieldAlert className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Access Denied
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You do not have permission to edit a category. <br />
                Please contact your administrator if you believe this is an error.
              </p>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="mt-4"
              >
                Close
              </Button>
            </div>
          ) :
            (<Form {...form}>
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
                        // onValueChange={field.onChange}
                        // value={Boolean(field.value).toString()}
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
            </Form>)
          }
        </div>
      </SheetContent>
    </Sheet>
  );
}
