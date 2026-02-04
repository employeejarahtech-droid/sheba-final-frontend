
"use client";

import { useState, useEffect } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { Search, Loader2, Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createFileRoute } from '@tanstack/react-router';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

import { useAddJournalEntryMutation, useGetJournalReportQuery, useLazyGetAccountingAccountsQuery } from "@/features/accounting/accountingQueries";
import { toast } from "sonner";
import { ChartOfAccount } from "@/types/accounting.types";

import { TopNav } from "@/components/layout/top-nav";
import { topNav } from "@/data/data";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Header } from "@/components/layout/header";

export const Route = createFileRoute('/_authenticated/accounting/reports/journal/')({
  component: JournalReport,
})

type JournalEntryFormValues = {
  date: string;
  narration: string;
  entries: {
    account_id: string; // Use string for form handling, convert to number on submit
    debit: number;
    credit: number;
  }[];
};

function JournalReport() {
  const [isOpen, setIsOpen] = useState(false);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [page] = useState(1);
  const [limit] = useState(20);
  const [search] = useState("");
  /* eslint-enable @typescript-eslint/no-unused-vars */

  // Queries
  const { data: journalData, isLoading } = useGetJournalReportQuery({ page, limit, search });
  const { mutateAsync: addJournalEntry, isPending: isAdding } = useAddJournalEntryMutation();

  // Form
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<JournalEntryFormValues>({
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      narration: "",
      entries: [
        { account_id: "", debit: 0, credit: 0 },
        { account_id: "", debit: 0, credit: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "entries",
  });

  const watchEntries = watch("entries");
  const totalDebit = watchEntries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);
  const totalCredit = watchEntries.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const onSubmit = async (data: JournalEntryFormValues) => {
    if (!isBalanced) {
      toast.error("Total Debit must equal Total Credit!");
      return;
    }

    const payload = {
      date: data.date,
      narration: data.narration,
      entries: data.entries.map(e => ({
        account_id: Number(e.account_id),
        debit: Number(e.debit),
        credit: Number(e.credit),
      })),
    };

    try {
      await addJournalEntry(payload);
      toast.success("Journal Entry added successfully");
      setIsOpen(false);
      reset({
        date: format(new Date(), "yyyy-MM-dd"),
        narration: "",
        entries: [
          { account_id: "", debit: 0, credit: 0 },
          { account_id: "", debit: 0, credit: 0 },
        ],
      });
    } catch (error) {
      toast.error("Failed to add journal entry");
      console.error(error);
    }
  };

  /* --- ACCOUNT COMBOBOX --- */
  const AccountCombobox = ({ value, onChange, error }: { value: string, onChange: (val: string) => void, error?: string }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

    const [fetchAccounts, { isLoading: isSearching }] = useLazyGetAccountingAccountsQuery() as any; // Cast because custom lazy hook structure might be simple fn

    useEffect(() => {
      // In my simplified lazy hook, fetchAccounts returns a promise
      const timeOutId = setTimeout(() => {
        fetchAccounts({ search: query, limit: 10 }).then((res: any) => {
          if (res?.data) setAccounts(res.data);
        });
      }, 300);
      return () => clearTimeout(timeOutId);
    }, [query, fetchAccounts]);


    const selectedAccount = accounts.find(acc => String(acc.id) === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", error && "border-red-500")}
          >
            {value
              ? (selectedAccount ? selectedAccount.name : "Account selected")
              : "Select account..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search account..." value={query} onValueChange={setQuery} />
            <CommandEmpty>{isSearching ? "Searching..." : "No account found."}</CommandEmpty>
            <CommandGroup>
              {accounts.map((account) => (
                <CommandItem
                  key={account.id}
                  value={String(account.id)}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : String(account.id));
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === String(account.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {account.code} - {account.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };


  return (
    <div className="space-y-6">
      <Header fixed>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <div className='hidden md:block'><Search /></div>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <main className='p-6 lg:p-10'>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Journal Entries</h2>
            <p className="text-muted-foreground">Record and review double-entry bookkeeping records.</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> New Journal Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>New Journal Entry</DialogTitle>
                <DialogDescription>Create a balanced journal entry.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                  {/* Date & Narration */}
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Controller
                      name="date"
                      control={control}
                      rules={{ required: "Date is required" }}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent mode="single" selected={new Date(field.value)} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")} initialFocus />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Narration</Label>
                    <Controller name="narration" control={control} rules={{ required: "Narration is required" }} render={({ field }) => (
                      <Textarea {...field} placeholder="Brief description of the transaction..." />
                    )} />
                    {errors.narration && <p className="text-sm text-red-500">{errors.narration.message}</p>}
                  </div>

                  {/* Entries List */}
                  <div className="space-y-4 border rounded p-3 bg-muted/20">
                    <Label>Entries</Label>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground mb-1 block">Account</Label>
                          <Controller
                            control={control}
                            name={`entries.${index}.account_id`}
                            rules={{ required: true }}
                            render={({ field }) => (
                              <AccountCombobox value={field.value} onChange={field.onChange} error={errors.entries?.[index]?.account_id?.message} />
                            )}
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs text-muted-foreground mb-1 block">Debit</Label>
                          <Input type="number" {...control.register(`entries.${index}.debit`)} onChange={(e) => {
                            control.register(`entries.${index}.debit`).onChange(e);
                            // force re-render for totals calc if not automatic
                          }} min="0" step="0.01" />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs text-muted-foreground mb-1 block">Credit</Label>
                          <Input type="number" {...control.register(`entries.${index}.credit`)} onChange={(e) => {
                            control.register(`entries.${index}.credit`).onChange(e);
                          }} min="0" step="0.01" />
                        </div>
                        <div className="pt-6">
                          {fields.length > 2 && (
                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ account_id: "", debit: 0, credit: 0 })}>
                      <Plus className="mr-2 h-4 w-4" /> Add Line
                    </Button>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-between items-center text-sm font-medium border-t pt-2">
                    <div className={cn("text-muted-foreground", !isBalanced && "text-destructive")}>
                      {isBalanced ? "Balanced" : "Unbalanced"}
                    </div>
                    <div className="flex gap-8 mr-12">
                      <span>Total Debit: {totalDebit.toFixed(2)}</span>
                      <span>Total Credit: {totalCredit.toFixed(2)}</span>
                    </div>
                  </div>

                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)} type="button">Cancel</Button>
                  <Button type="submit" disabled={isAdding || !isBalanced}>
                    {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Entry
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* List */}
        <div className="border rounded-lg bg-card mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Narration</TableHead>
                <TableHead>Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : (journalData?.data || []).length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No journal entries found.</TableCell></TableRow>
              ) : (
                (journalData?.data || []).map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.narration}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {entry.details?.map((d: any, i: number) => (
                          <div key={i} className="flex justify-between max-w-sm">
                            <span>{d.account?.name}</span>
                            <span>{d.amount > 0 ? `Dr ${d.amount}` : `Cr ${Math.abs(d.amount)}`}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{entry.total_debit}</TableCell>
                    <TableCell className="text-right">{entry.total_credit}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
