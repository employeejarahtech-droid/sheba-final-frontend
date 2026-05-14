import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlusCircle, Loader } from "lucide-react";
import { useAddAccount } from "@/features/accounting/api/queries";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/* ------------------ ZOD SCHEMA ------------------ */
const expenseHeadSchema = z.object({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(1, "Expense head name is required"),
});

type ExpenseHeadFormValues = z.infer<typeof expenseHeadSchema>;

/* ------------------ COMPONENT ------------------ */
export default function CreateExpenseHeadForm() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ExpenseHeadFormValues>({
    resolver: zodResolver(expenseHeadSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  /* ------------------ SUBMIT HANDLER ------------------ */
  const addAccount = useAddAccount();

  const handleSubmit = async (values: ExpenseHeadFormValues) => {
    setIsLoading(true);
    try {
      await addAccount.mutateAsync({
        code: values.code,
        name: values.name,
        type: "EXPENSE",
        parent_id: null,
      });
      toast.success("Expense Head created successfully");
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create expense head");
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5 hover:shadow-red-500/40">
          <PlusCircle size={18} />
          Add Expense Head
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Add Expense Head</SheetTitle>
        </SheetHeader>

        <div className="px-4 pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 5500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Head Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Travel Expense"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* INFO */}
              <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                Account Type: <strong>EXPENSE</strong>
              </div>

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    Adding...
                  </span>
                ) : (
                  "Add Expense Head"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
