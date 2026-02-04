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

import { useCreateIncomeHeadMutation } from "@/store/features/accounting/accoutntingApiService";
import { useAppSelector } from "@/store/store";
import {
  AccountingPermission,
  SuperAdminPermission,
} from "@/config/permissions";

/* ------------------ ZOD SCHEMA ------------------ */
const incomeHeadSchema = z.object({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(1, "Income head name is required"),
});

type IncomeHeadFormValues = z.infer<typeof incomeHeadSchema>;

/* ------------------ COMPONENT ------------------ */
export default function CreateIncomeHeadForm() {
  const [open, setOpen] = useState(false);

  const userPermissions =
    useAppSelector((state) => state.auth.user?.role.permissions) || [];

  const canCreateIncomeHead =
    userPermissions.includes(AccountingPermission.CREATE_CREDIT_HEADS) ||
    userPermissions.includes(SuperAdminPermission.ACCESS_ALL);

  const form = useForm<IncomeHeadFormValues>({
    resolver: zodResolver(incomeHeadSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  const [addIncomeHead, { isLoading }] = useCreateIncomeHeadMutation();

  /* ------------------ SUBMIT HANDLER ------------------ */
  const handleSubmit = async (values: IncomeHeadFormValues) => {
    const payload = {
      code: values.code,
      name: values.name,
      type: "INCOME", //  mandatory & fixed
    };

    try {
      const res = await addIncomeHead(payload).unwrap();

      if (res?.status) {
        toast.success(res.message || "Income Head created successfully");
        form.reset();
        setOpen(false);
      } else {
        toast.error(res?.message || "Failed to create Income Head");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.data?.message || "Something went wrong while creating Income Head");
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/40">
          <PlusCircle size={18} />
          Add Income Head
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Add Income Head</SheetTitle>
        </SheetHeader>

        <div className="px-4 pt-6">
          {!canCreateIncomeHead ? (
            /* -------- ACCESS DENIED -------- */
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">Access Denied</h2>
              <p className="text-sm text-muted-foreground">
                You do not have permission to create an Income Head.
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
                        <Input placeholder="e.g. 4500" {...field} />
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
                      <FormLabel>Income Head Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Consulting Income"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* INFO */}
                <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Account Type: <strong>INCOME</strong>
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    "Add Income Head"
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
