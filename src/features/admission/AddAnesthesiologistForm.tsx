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
import { useEffect, useState } from 'react'
import { CalendarIcon, Check, ChevronDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'

const anesthesiologistSchema = z.object({
    anesthesiologist_id: z.number().positive('Anesthesiologist is required'),
    anesthesia_type: z.string().min(1, 'Anesthesia type is required'),
    operation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    fees: z.number().nonnegative('Fees must be non-negative'),
})

type AnesthesiologistFormData = z.infer<typeof anesthesiologistSchema>

interface AddAnesthesiologistFormProps {
    open: boolean
    setOpen: (open: boolean) => void
    onAdd: (anesthesiologist: {
        id?: number
        anesthesiologist_id: number
        anesthesia_type: string
        operation_date: string
        fees: number
        anesthesiologist_name?: string
    }) => void
    doctors: any[]
    anesthesiaTypes: string[]  // Now fetched from DB
    editAnesthesiologist?: {
        id: number
        anesthesiologist_id: number
        anesthesia_type: string
        operation_date: string
        fees: number
    } | null
}

export function AddAnesthesiologistForm({ open, setOpen, onAdd, doctors, anesthesiaTypes, editAnesthesiologist }: AddAnesthesiologistFormProps) {
    const { currencySymbol } = useCurrency()
    const { formatHint, formatDate, toISODate } = useDateFormat()

    // Convert a stored ISO date (YYYY-MM-DD) into a local Date for the calendar,
    // avoiding UTC/timezone off-by-one shifts.
    const isoToDate = (iso: string): Date | undefined => {
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined
        const [y, m, d] = iso.split('-').map(Number)
        return new Date(y, m - 1, d)
    }
    const [anesthesiologistOpen, setAnesthesiologistOpen] = useState(false)
    const [anesthesiaOpen, setAnesthesiaOpen] = useState(false)

    const form = useForm<AnesthesiologistFormData>({
        resolver: zodResolver(anesthesiologistSchema),
        defaultValues: {
            anesthesiologist_id: 0,
            anesthesia_type: '',
            operation_date: new Date().toISOString().split('T')[0],
            fees: 0,
        },
    })

    // Reset form when editAnesthesiologist changes
    useEffect(() => {
        if (editAnesthesiologist) {
            form.reset({
                anesthesiologist_id: editAnesthesiologist.anesthesiologist_id,
                anesthesia_type: editAnesthesiologist.anesthesia_type,
                operation_date: editAnesthesiologist.operation_date,
                fees: editAnesthesiologist.fees,
            })
        } else {
            form.reset({
                anesthesiologist_id: 0,
                anesthesia_type: '',
                operation_date: new Date().toISOString().split('T')[0],
                fees: 0,
            })
        }
        setAnesthesiologistOpen(false) // Close dropdown when opening or changing edit mode
        setAnesthesiaOpen(false)
    }, [editAnesthesiologist, form])

    const handleAddAnesthesiologist = (data: AnesthesiologistFormData) => {
        const doctor = doctors.find((d: any) => d.id === data.anesthesiologist_id)
        onAdd({
            id: editAnesthesiologist?.id,
            ...data,
            anesthesiologist_name: doctor?.doctor_name || 'Unknown',
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
                                <Zap className="h-4 w-4" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold">{editAnesthesiologist ? 'Edit Anesthesiologist' : 'Add Anesthesiologist'}</SheetTitle>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Anesthesia type, administration dates, and fees</p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="px-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddAnesthesiologist)} className="space-y-4">
                                <div className="mt-6 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="anesthesiologist_id"
                                        render={({ field }) => {
                                            const selectedDoctor = doctors.find(
                                                (doc: any) => String(doc.id) === String(field.value)
                                            )

                                            return (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel>Anesthesiologist *</FormLabel>
                                                    <Popover open={anesthesiologistOpen} onOpenChange={setAnesthesiologistOpen}>
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
                                                                        "Select anesthesiologist..."
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
                                                                                        setAnesthesiologistOpen(false);
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
                                        name="anesthesia_type"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col gap-2">
                                                <FormLabel>Anesthesia Type *</FormLabel>
                                                <Popover open={anesthesiaOpen} onOpenChange={setAnesthesiaOpen}>
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
                                                                {field.value ? field.value : "Select anesthesia type..."}
                                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search anesthesia type..." className="h-9" />
                                                            <CommandList className="max-h-[300px]">
                                                                <CommandEmpty>No anesthesia type found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {anesthesiaTypes.map((type) => (
                                                                        <CommandItem
                                                                            key={type}
                                                                            value={type}
                                                                            className="py-2.5 px-4 cursor-pointer"
                                                                            onSelect={() => {
                                                                                field.onChange(type);
                                                                                setAnesthesiaOpen(false);
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <Check
                                                                                    className={cn(
                                                                                        "h-4 w-4 shrink-0",
                                                                                        type === field.value ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                <span className="font-medium">{type}</span>
                                                                            </div>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </FormItem>
                                        )}
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
                                            {editAnesthesiologist ? 'Update Anesthesiologist' : 'Add Anesthesiologist'}
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
