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
import { toast } from "sonner";

const unitSchema = z.object({
  name: z.string().min(1, "Required"),
  symbol: z.string().min(1, "Required"),
  is_active: z.boolean().optional(),
});

type UnitFormValues = z.infer<typeof unitSchema>;

interface AddRawMaterialUnitFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function AddRawMaterialUnitForm({ open, setOpen }: AddRawMaterialUnitFormProps) {
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: "",
      symbol: "",
      is_active: true,
    },
  });

  const onSubmit = (values: UnitFormValues) => {
    console.log('unit form values', values);
    // Simulate API call
    toast.success("Raw material unit added!");
    setOpen(false);
    form.reset();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Raw Material Unit</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Unit name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="symbol" render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. kg, m, pcs" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full">Add Unit</Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
