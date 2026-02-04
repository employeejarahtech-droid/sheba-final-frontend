import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, ChevronDown, FileText, CreditCard, TrendingUp, CornerDownRight, Loader2 } from "lucide-react";

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

import { useAddIncomeMutation, useGetIncomeHeadsQuery, useGetAccountingAccountsQuery } from "@/features/accounting/accountingQueries";
import { cn } from "@/lib/utils";
import { CreditHead } from "@/types/accounting.types";

const incomeSchema = z.object({
  title: z.string().min(1, "Required"),
  income_date: z.string().min(1, "Required"),
  credit_head_id: z.number().min(1, "Required"),
  description: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  receivedVia: z.string().optional(),
  reference: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

export function AddIncomeModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [openCreditHead, setOpenCreditHead] = useState(false);
  const [openReceivedVia, setOpenReceivedVia] = useState(false);
  const [search, setSearch] = useState("");

  const { mutateAsync: addIncome, isPending: isLoading } = useAddIncomeMutation();

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      title: "",
      income_date: new Date().toISOString().split('T')[0],
      credit_head_id: 0,
      description: "",
      amount: 0,
      receivedVia: "",
      reference: "",
    },
  });

  const { control, handleSubmit, reset, formState: { errors } } = form;

  const { data: headsData } = useGetIncomeHeadsQuery();
  const creditHeads: CreditHead[] = headsData?.data || [];

  const { data: accountsData } = useGetAccountingAccountsQuery({ limit: 1000 });
  const assetAccounts = (accountsData?.data || []).filter((acc: any) => acc.type === "Asset");

  const currency = '৳';

  const onSubmit = async (values: IncomeFormValues) => {
    const payload = {
      title: values.title,
      income_date: values.income_date,
      income_head_id: values.credit_head_id,
      description: values.description,
      amount: values.amount,
      payment_method: values.receivedVia,
      reference_number: values.reference,
    };

    try {
      const res = await addIncome(payload);
      // @ts-ignore
      if (res?.data?.status || res?.status) {
        toast.success("Income added successfully");
        setOpen(false);
        reset({
          title: "",
          income_date: new Date().toISOString().split('T')[0],
          credit_head_id: 0,
          description: "",
          amount: 0,
          receivedVia: "",
          reference: "",
        });
      } else {
        toast.success("Income added successfully");
        setOpen(false);
        reset();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add income");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-green-600" /> Add Income
          </DialogTitle>
          <p className="text-muted-foreground mt-1">Record a new income transaction</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* BASIC INFO */}
            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-green-200 hover:shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-green-950/30 border-b-1 border-green-100 dark:border-green-900 py-3 gap-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-600 to-green-500 rounded-xl shadow-lg shadow-green-500/30">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Basic Information</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Income title, category, and description</p>
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
                      <Input placeholder="Income Title" {...field} />
                    )}
                  />
                  {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                </div>

                {/* CREDIT HEAD */}
                <div className="space-y-2">
                  <Label>Credit Head</Label>
                  <Controller
                    control={control}
                    name="credit_head_id"
                    render={({ field }) => {
                      const selected = creditHeads?.find(
                        (item) => Number(item.id) === Number(field.value)
                      );

                      return (
                        <Popover open={openCreditHead} onOpenChange={setOpenCreditHead} modal={true}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              {selected ? selected.name : "Select credit head..."}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[350px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search credit head..." value={search} onValueChange={setSearch} />
                              <CommandList>
                                <CommandEmpty>No credit head found.</CommandEmpty>
                                <CommandGroup>
                                  {creditHeads?.map((item: any) => {
                                    const level = item.level || (item.parent_id ? 1 : 0);
                                    return (
                                      <CommandItem
                                        key={item.id}
                                        value={`${item.name}-${item.id}`}
                                        onSelect={() => {
                                          field.onChange(item.id);
                                          setOpenCreditHead(false);
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
                  {errors.credit_head_id && <p className="text-red-500 text-xs">{errors.credit_head_id.message}</p>}
                </div>

                {/* DATE */}
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Controller
                    control={control}
                    name="income_date"
                    render={({ field }) => (
                      <Input type="date" {...field} />
                    )}
                  />
                  {errors.income_date && <p className="text-red-500 text-xs">{errors.income_date.message}</p>}
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <Textarea rows={3} placeholder="Describe income..." {...field} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* PAYMENT INFO */}
            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-green-200 hover:shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-green-950/30 border-b-1 border-green-100 dark:border-green-900 py-3 gap-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-600 to-green-500 rounded-xl shadow-lg shadow-green-500/30">
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
                  <Label>Amount ({currency})</Label>
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

                {/* RECEIVED VIA */}
                <div className="space-y-2">
                  <Label>Received Via</Label>
                  <Controller
                    control={control}
                    name="receivedVia"
                    render={({ field }) => {
                      const selected = assetAccounts?.find(
                        (item: any) => item.name === field.value || String(item.id) === field.value
                      );
                      return (
                        <Popover open={openReceivedVia} onOpenChange={setOpenReceivedVia} modal={true}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              {selected ? selected.name : "Select payment account..."}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[350px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search account..." />
                              <CommandList>
                                <CommandEmpty>No account found.</CommandEmpty>
                                <CommandGroup>
                                  {assetAccounts?.map((acc: any) => {
                                    const level = acc.level || 0;
                                    return (
                                      <CommandItem
                                        key={acc.id}
                                        value={`${acc.name}-${acc.id}`}
                                        onSelect={() => {
                                          field.onChange(acc.name);
                                          setOpenReceivedVia(false);
                                        }}
                                        className="flex items-center gap-2"
                                        style={{ paddingLeft: `${level === 0 ? 12 : (level * 20) + 12}px` }}
                                      >
                                        <div className="flex items-center flex-1 gap-2">
                                          <div className="flex items-center gap-1">
                                            {level > 0 && <CornerDownRight className="h-3 w-3 text-muted-foreground stroke-[1.5]" />}
                                            <div className="flex flex-col">
                                              <span className={cn(level === 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>{acc.name}</span>
                                              <span className="text-[10px] text-muted-foreground/70">{acc.code}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <Check className={cn("ml-auto h-4 w-4", field.value === acc.name ? "opacity-100" : "opacity-0")} />
                                      </CommandItem>
                                    )
                                  })}
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
                      <Input placeholder="Cheque #, Transaction ID" {...field} />
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
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 px-8 py-3 font-semibold text-white shadow-lg shadow-green-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-500/50 active:translate-y-0 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
              Save Income
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
