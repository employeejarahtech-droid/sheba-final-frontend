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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { useAddRawMaterialCategoryMutation } from "@/store/features/admin/rawMaterialApiService";

const categorySchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface AddRawMaterialCategoryFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function AddRawMaterialCategoryForm({ open, setOpen }: AddRawMaterialCategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  });

  const [addCategory, { isLoading }] = useAddRawMaterialCategoryMutation();

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      const res = await addCategory(values).unwrap();
      if (res.status) {
        toast.success("Raw material category added!");
        setOpen(false);
        form.reset();
      } else {
        toast.error("Failed to add category");
      }
    } catch (error: any) {
      console.error("Error adding category:", error);
      toast.error(error?.data?.message || "Error adding category");
    }
  };


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Raw Material Category</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Category name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Description (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={isLoading}>
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
      </SheetContent>
    </Sheet>
  );
}
