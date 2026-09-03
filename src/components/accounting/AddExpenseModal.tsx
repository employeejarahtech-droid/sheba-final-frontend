import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, FileText, CreditCard, TrendingDown, CornerDownRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useAddExpenseHeadwiseMutation, useGetExpenseHeadsQuery } from "@/features/accounting/accountingQueries";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import { getCookie } from "@/lib/cookies";

const DEFAULT_PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "Mobile Banking", "Check"];

const expenseSchema = z.object({
  title: z.string().min(1, "Required"),
  expense_date: z.string().min(1, "Required"),
  debit_head_id: z.number().min(1, "Required"),
  description: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paidVia: z.string().optional(),
  reference: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function AddExpenseModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [openDebitHead, setOpenDebitHead] = useState(false);
  const [openPaidVia, setOpenPaidVia] = useState(false);
  const [search, setSearch] = useState("");

  const { mutateAsync: addExpense, isPending: isLoading } = useAddExpenseHeadwiseMutation();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      expense_date: new Date().toISOString().split('T')[0],
      debit_head_id: 0,
      description: "",
      amount: 0,
      paidVia: "",
      reference: "",
    },
  });

  const { control, handleSubmit, reset, formState: { errors } } = form;

  const { data: expenseHeadsData } = useGetExpenseHeadsQuery({ search });
  const debitHeads = expenseHeadsData?.data || [];

  const token = getCookie("accessToken");
  const { data: paymentMappings } = useQuery({
    queryKey: ["payment-mappings"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings/payment-mappings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch payment mappings");
      const json = await res.json();
      return json.data || {};
    },
    enabled: !!token,
  });
  // "Paid Via" options come from Settings → Payment Accounts (general_expense
  // scenario), so admins configure which asset account each method maps to
  // in one place instead of picking a raw COA account here.
  const paymentMethods: string[] =
    paymentMappings?.general_expense?.methods?.map((m: any) => m.name).filter(Boolean) || DEFAULT_PAYMENT_METHODS;

  const { currencySymbol } = useCurrency();

  const onSubmit = async (values: ExpenseFormValues) => {
    const payload = {
      title: values.title,
      expense_date: values.expense_date,
      debit_head_id: values.debit_head_id,
      description: values.description,
      amount: values.amount,
      payment_method: values.paidVia,
      reference_number: values.reference,
    };

    try {
      const res = await addExpense(payload);
      // @ts-ignore
      if (res?.data?.status || res?.status) {
        toast.success("Expense added successfully");
        setOpen(false);
        reset({
          title: "",
          expense_date: new Date().toISOString().split('T')[0],
          debit_head_id: 0,
          description: "",
          amount: 0,
          paidVia: "",
          reference: "",
        });
      } else {
        toast.success("Expense added successfully");
        setOpen(false);
        reset();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add expense");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
            <TrendingDown className="h-8 w-8 text-red-600" /> Add Expense
          </DialogTitle>
          <p className="text-muted-foreground mt-1">Record a new expense transaction</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* BASIC INFO */}
            <Card className="overflow-hidden border-1 transition-all duration-300 hover:border-red-200 hover:shadow-lg">
              <CardHeader className="">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl shadow-lg shadow-red-500/30">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Basic Information</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Expense title, category, and description</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* TITLE */}
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Controller
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <Input placeholder="Expense Title" {...field} />
                    )}
                  />
                  {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                </div>

                {/* DEBIT HEAD */}
                <div className="space-y-2">
                  <Label>Debit Head</Label>
                  <Controller
                    control={control}
                    name="debit_head_id"
                    render={({ field }) => {
                      const selected = debitHeads?.find(
                        (item: any) => Number(item.id) === Number(field.value)
                      );

                      return (
                        <Popover open={openDebitHead} onOpenChange={setOpenDebitHead} modal={true}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              {selected ? selected.name : "Select debit head..."}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[350px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search debit head..." value={search} onValueChange={setSearch} />
                              <CommandList>
                                <CommandEmpty>No debit head found.</CommandEmpty>
                                <CommandGroup>
                                  {debitHeads?.map((item: any) => {
                                    const level = item.level || 0;
                                    return (
                                      <CommandItem
                                        key={item.id}
                                        value={`${item.name}-${item.id}`}
                                        onSelect={() => {
                                          field.onChange(item.id);
                                          setOpenDebitHead(false);
                                        }}
                                        className="flex items-center gap-2"
                                        style={{ paddingLeft: `${level === 0 ? 12 : (level * 20) + 12}px` }}
                                      >
                                        <div className="flex items-center flex-1 gap-2">
                                          <div className="flex items-center gap-1">
                                            {level > 0 && <CornerDownRight className="h-3 w-3 text-muted-foreground stroke-[1.5]" />}
                                            <div className="flex flex-col">
                                              <span className={cn(level === 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>{item.name}</span>
                                              <span className="text-[10px] text-muted-foreground/70">{item.code}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            Number(field.value) === Number(item.id) ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                  {errors.debit_head_id && <p className="text-red-500 text-xs">{errors.debit_head_id.message}</p>}
                </div>

                {/* DATE */}
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Controller
                    control={control}
                    name="expense_date"
                    render={({ field }) => (
                      <Input type="date" {...field} />
                    )}
                  />
                  {errors.expense_date && <p className="text-red-500 text-xs">{errors.expense_date.message}</p>}
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <Textarea rows={3} placeholder="Describe expense..." {...field} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* PAYMENT INFO */}
            <Card className="overflow-hidden border-1 transition-all duration-300 hover:border-red-200 hover:shadow-lg">
              <CardHeader className="">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl shadow-lg shadow-red-500/30">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Payment Details</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Amount, payment method, and reference</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* AMOUNT */}
                <div className="space-y-2">
                  <Label>Amount ({currencySymbol})</Label>
                  <Controller
                    control={control}
                    name="amount"
                    render={({ field }) => (
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                  {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
                </div>

                {/* PAID VIA */}
                <div className="space-y-2">
                  <Label>Paid Via</Label>
                  <Controller
                    control={control}
                    name="paidVia"
                    render={({ field }) => {
                      return (
                        <Popover open={openPaidVia} onOpenChange={setOpenPaidVia} modal={true}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              {field.value || "Select payment method..."}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[350px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search payment method..." />
                              <CommandList>
                                <CommandEmpty>No payment method found.</CommandEmpty>
                                <CommandGroup>
                                  {paymentMethods.map((name: string) => (
                                    <CommandItem
                                      key={name}
                                      value={name}
                                      onSelect={() => {
                                        field.onChange(name);
                                        setOpenPaidVia(false);
                                      }}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="flex-1">{name}</span>
                                      <Check className={cn("ml-auto h-4 w-4", field.value === name ? "opacity-100" : "opacity-0")} />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                </div>

                {/* REFERENCE */}
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Controller
                    control={control}
                    name="reference"
                    render={({ field }) => (
                      <Input placeholder="Bill #, Txn ID, etc." {...field} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4 gap-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-8 py-3 font-semibold text-white shadow-lg shadow-red-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/50 active:translate-y-0 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingDown className="mr-2 h-4 w-4" />}
              Save Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
