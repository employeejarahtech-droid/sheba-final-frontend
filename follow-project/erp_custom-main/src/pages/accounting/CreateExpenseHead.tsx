import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlusCircle, Loader, ShieldAlert } from "lucide-react";

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


import { useAppSelector } from "@/store/store";
import {
  AccountingPermission,
  SuperAdminPermission,
} from "@/config/permissions";
import { useCreateExpanseHeadMutation } from "@/store/features/accounting/accoutntingApiService";

/* ------------------ ZOD SCHEMA ------------------ */
const expenseHeadSchema = z.object({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(1, "Expense head name is required"),
});

type ExpenseHeadFormValues = z.infer<typeof expenseHeadSchema>;

/* ------------------ COMPONENT ------------------ */
export default function CreateExpenseHeadForm() {
  const [open, setOpen] = useState(false);

  const userPermissions =
    useAppSelector((state) => state.auth.user?.role.permissions) || [];

  const canCreateExpenseHead =
    userPermissions.includes(AccountingPermission.CREATE_CREDIT_HEADS) ||
    userPermissions.includes(SuperAdminPermission.ACCESS_ALL);

  const form = useForm<ExpenseHeadFormValues>({
    resolver: zodResolver(expenseHeadSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  const [addExpenseHead, { isLoading }] = useCreateExpanseHeadMutation();

  /* ------------------ SUBMIT HANDLER ------------------ */
  const handleSubmit = async (values: ExpenseHeadFormValues) => {
    const payload = {
      code: values.code,
      name: values.name,
      type: "EXPENSE", //  mandatory & fixed
    };

    try {
      const res = await addExpenseHead(payload).unwrap();

      if (res?.status) {
        toast.success(res.message || "Expense Head created successfully");
        form.reset();
        setOpen(false);
      } else {
        toast.error(res?.message || "Failed to create Expense Head");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
        "Something went wrong while creating Expense Head"
      );
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5 hover:shadow-red-500/40">
          <PlusCircle size={18} />
          Add Expense Head
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Add Expense Head</SheetTitle>
        </SheetHeader>

        <div className="px-4 pt-6">
          {!canCreateExpenseHead ? (
            /* -------- ACCESS DENIED -------- */
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">Access Denied</h2>
              <p className="text-sm text-muted-foreground">
                You do not have permission to create an Expense Head.
                <br />
                Please contact your administrator.
              </p>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          ) : (
            /* -------- FORM -------- */
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
