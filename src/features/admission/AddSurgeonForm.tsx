import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { CalendarIcon, Check, ChevronDown, HeartPulse } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'

const surgeonSchema = z.object({
    surgeon_id: z.number().positive('Surgeon is required'),
    operation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    fees: z.number().nonnegative('Fees must be non-negative'),
})

type SurgeonFormData = z.infer<typeof surgeonSchema>

interface AddSurgeonFormProps {
    open: boolean
    setOpen: (open: boolean) => void
    onAdd: (surgeon: {
        id?: number
        surgeon_id: number
        operation_date: string
        fees: number
        surgeon_name?: string
    }) => void
    doctors: any[]
    editSurgeon?: {
        id: number
        surgeon_id: number
        operation_date: string
        fees: number
    } | null
}

export function AddSurgeonForm({ open, setOpen, onAdd, doctors, editSurgeon }: AddSurgeonFormProps) {
    const { currencySymbol } = useCurrency()
    const { formatHint, formatDate, toISODate } = useDateFormat()

    // Convert a stored ISO date (YYYY-MM-DD) into a local Date for the calendar,
    // avoiding UTC/timezone off-by-one shifts.
    const isoToDate = (iso: string): Date | undefined => {
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined
        const [y, m, d] = iso.split('-').map(Number)
        return new Date(y, m - 1, d)
    }
    const [surgeonOpen, setSurgeonOpen] = useState(false)

    const form = useForm<SurgeonFormData>({
        resolver: zodResolver(surgeonSchema),
        defaultValues: {
            surgeon_id: 0,
            operation_date: new Date().toISOString().split('T')[0],
            fees: 0,
        },
    })

    // Reset form when editSurgeon changes
    useEffect(() => {
        if (editSurgeon) {
            form.reset({
                surgeon_id: editSurgeon.surgeon_id,
                operation_date: editSurgeon.operation_date,
                fees: editSurgeon.fees,
            })
        } else {
            form.reset({
                surgeon_id: 0,
                operation_date: new Date().toISOString().split('T')[0],
                fees: 0,
            })
        }
        setSurgeonOpen(false) // Close dropdown when opening or changing edit mode
    }, [editSurgeon, form])

    const handleAddSurgeon = (data: SurgeonFormData) => {
        const doctor = doctors.find((d: any) => d.id === data.surgeon_id)
        onAdd({
            id: editSurgeon?.id,
            ...data,
            surgeon_name: doctor?.doctor_name || 'Unknown',
        })
        form.reset()
        setOpen(false)
    }

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="max-w-[450px] w-full">
                    <SheetHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4 gap-0">
                        <div className="flex items-center gap-2.5 pr-8">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                <HeartPulse className="h-4 w-4" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold">{editSurgeon ? 'Edit Surgeon' : 'Add Surgeon'}</SheetTitle>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Surgeon assignments and surgery fee distribution</p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="px-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddSurgeon)} className="space-y-4">
                                <div className="mt-6 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="surgeon_id"
                                        render={({ field }) => {
                                            const selectedDoctor = doctors.find(
                                                (doc: any) => String(doc.id) === String(field.value)
                                            )

                                            return (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel>Surgeon *</FormLabel>
                                                    <Popover open={surgeonOpen} onOpenChange={setSurgeonOpen}>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className={cn(
                                                                        "w-full justify-between h-10 font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {selectedDoctor ? (
                                                                        <div className="flex flex-col items-start">
                                                                            <span className="font-medium">
                                                                                Dr. {selectedDoctor.doctor_name}
                                                                                {(selectedDoctor.qualification || selectedDoctor.title) && ` (${selectedDoctor.qualification || selectedDoctor.title})`}
                                                                            </span>
                                                                            {selectedDoctor.speciality && (
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {selectedDoctor.speciality}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        "Select surgeon..."
                                                                    )}
                                                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                            <Command
                                                                filter={(value, search) => {
                                                                    if (!search) return 1;
                                                                    return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                                                                }}
                                                            >
                                                                <CommandInput placeholder="Search doctor by name, qualification, or specialty..." className="h-9" />
                                                                <CommandList className="max-h-[300px]">
                                                                    <CommandEmpty>No doctor found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {doctors.map((doctor: any) => {
                                                                            const displayName = `Dr. ${doctor.doctor_name}`;
                                                                            const subtitle = [
                                                                                doctor.qualification || doctor.title,
                                                                                doctor.speciality,
                                                                            ].filter(Boolean).join(' - ');

                                                                            return (
                                                                                <CommandItem
                                                                                    key={doctor.id}
                                                                                    value={`${doctor.doctor_name} ${doctor.qualification || doctor.title || ''} ${doctor.speciality || ''} ${doctor.id}`}
                                                                                    className="py-2.5 px-4 cursor-pointer"
                                                                                    onSelect={() => {
                                                                                        field.onChange(Number(doctor.id));
                                                                                        setSurgeonOpen(false);
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-center gap-2 w-full">
                                                                                        <Check
                                                                                            className={cn(
                                                                                                "h-4 w-4 shrink-0",
                                                                                                String(doctor.id) === String(field.value)
                                                                                                    ? "opacity-100"
                                                                                                    : "opacity-0"
                                                                                            )}
                                                                                        />
                                                                                        <div className="flex flex-col">
                                                                                            <span className="font-medium">{displayName}</span>
                                                                                            {subtitle && (
                                                                                                <span className="text-xs text-muted-foreground">
                                                                                                    {subtitle}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </CommandItem>
                                                                            );
                                                                        })}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormItem>
                                            );
                                        }}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="operation_date"
                                        render={({ field }) => {
                                            const selectedDate = isoToDate(field.value)
                                            return (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel>
                                                        Operation Date * <span className="text-xs font-normal text-muted-foreground">({formatHint})</span>
                                                    </FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "w-full justify-start text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {selectedDate ? formatDate(selectedDate) : "Pick a date"}
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={selectedDate}
                                                                onSelect={(date) => {
                                                                    field.onChange(date ? toISODate(date) : "")
                                                                }}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormItem>
                                            )
                                        }}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="fees"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fees ({currencySymbol}) *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <SheetFooter>
                                        <Button type="submit">
                                            {editSurgeon ? 'Update Surgeon' : 'Add Surgeon'}
                                        </Button>
                                        <SheetClose asChild>
                                            <Button variant="secondary" type="button">Cancel</Button>
                                        </SheetClose>
                                    </SheetFooter>
                                </div>
                            </form>
                        </Form>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
