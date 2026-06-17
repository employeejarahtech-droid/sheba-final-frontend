import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Activity, CalendarIcon, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDateFormat } from "@/hooks/use-date-format";

interface AddOperationTypeFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    onAdd: (operation: any) => void;
    admissionId: string;
    editOperation?: {
        id: number;
        operation_type: string;
        operation_date: string;
        charges: number;
    } | null;
}

interface OperationTypeOption {
    id: number;
    name: string;
}

interface CreateOperationTypeResponse {
    data: {
        id: number;
        name: string;
    };
}

export function AddOperationTypeForm({ open, setOpen, onAdd, admissionId, editOperation }: AddOperationTypeFormProps) {

    const [isLoading, setIsLoading] = useState(false);
    const [operationTypes, setOperationTypes] = useState<OperationTypeOption[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);
    const [showNewTypeInput, setShowNewTypeInput] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [isCreatingType, setIsCreatingType] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter operation types based on search term
    const filteredOperationTypes = operationTypes.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const form = useForm({
        defaultValues: {
            opType: "",
            opDate: new Date().toISOString().split('T')[0],
        },
    });

    const { formatHint, formatDate, toISODate } = useDateFormat();

    // Convert a stored ISO date (YYYY-MM-DD) into a local Date for the calendar,
    // avoiding UTC/timezone off-by-one shifts.
    const isoToDate = (iso: string): Date | undefined => {
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined;
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    // Reset form when editOperation changes
    useEffect(() => {
        if (editOperation) {
            form.reset({
                opType: editOperation.operation_type,
                opDate: editOperation.operation_date,
            });
        } else {
            form.reset({
                opType: "",
                opDate: new Date().toISOString().split('T')[0],
            });
        }
    }, [editOperation, form]);

    // Fetch operation types when sheet opens
    useEffect(() => {
        if (open) {
            fetchOperationTypes();
            setSearchTerm(''); // Reset search when opening
        }
    }, [open]);

    const fetchOperationTypes = async () => {
        setIsLoadingTypes(true);
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('accessToken='))
                ?.split('=')[1];

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/operation-type?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch operation types');
            }

            const data = await res.json();
            const types = data.data?.items || data.data?.rows || [];
            console.log('Fetched operation types:', types);
            setOperationTypes(types);
        } catch (error) {
            console.error('Error fetching operation types:', error);
        } finally {
            setIsLoadingTypes(false);
        }
    };

    const handleCreateOperationType = async () => {
        if (!newTypeName.trim()) return;

        setIsCreatingType(true);
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('accessToken='))
                ?.split('=')[1];

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/operation-type`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newTypeName.trim() }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || 'Failed to create operation type');
            }

            const result: CreateOperationTypeResponse = await res.json();
            console.log('Created operation type:', result);

            // Refresh the list
            await fetchOperationTypes();

            // Set the new type as selected value
            form.setValue('opType', result.data.name);

            // Reset and hide the new type input
            setNewTypeName('');
            setShowNewTypeInput(false);
        } catch (error) {
            console.error('Error creating operation type:', error);
            alert(error instanceof Error ? error.message : 'Failed to create operation type');
        } finally {
            setIsCreatingType(false);
        }
    };

    const handleAddOperationType = async (data: any) => {
        setIsLoading(true);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('accessToken='))
                ?.split('=')[1];

            // Operations are informational only — no price is captured.
            const charges = 0;

            const isEdit = editOperation !== null && editOperation !== undefined;
            const url = isEdit && editOperation
                ? `${import.meta.env.VITE_API_URL}/api/billing/operation/${editOperation.id}`
                : `${import.meta.env.VITE_API_URL}/api/billing/operation`;
            const method = isEdit ? 'PUT' : 'POST';

            const payload = {
                admission_id: parseInt(admissionId),
                operation_type: data.opType,
                operation_date: data.opDate,
                charges: charges,
            };

            console.log("Saving to API:", payload);

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || `Failed to ${isEdit ? 'update' : 'add'} operation`);
            }

            const result = await res.json();
            console.log("API Response:", result);

            // Call the onAdd callback to add/update the operation to parent state
            onAdd({
                id: isEdit && editOperation ? editOperation.id : result.data.operation.id,
                operation_type: data.opType,
                operation_date: data.opDate,
                charges: charges,
            });

            // Reset form and close
            form.reset();
            setOpen(false);
        } catch (error) {
            console.error('Error adding operation:', error);
            alert(error instanceof Error ? error.message : 'Failed to add operation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Drawer */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="max-w-[450px] w-full">
                    <SheetHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4 gap-0">
                        <div className="flex items-center gap-2.5 pr-8">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                <Activity className="h-4 w-4" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold">{editOperation ? 'Edit Operation' : 'Add New Operation Type'}</SheetTitle>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Recorded operations and procedural charges</p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="px-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddOperationType)} className="space-y-4">
                                <div className="mt-6 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="opType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Operation Type</FormLabel>
                                                <FormControl>
                                                    <div className="space-y-2">
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            disabled={isLoadingTypes}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder={
                                                                    isLoadingTypes
                                                                        ? "Loading..."
                                                                        : operationTypes.length === 0
                                                                            ? "No operation types available"
                                                                            : "Select Type..."
                                                                } />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {/* Search Input inside dropdown */}
                                                                <div className="p-2 sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
                                                                    <div className="relative">
                                                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="Search..."
                                                                            value={searchTerm}
                                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                                            className="pl-8 h-8 text-sm"
                                                                            disabled={isLoadingTypes}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {filteredOperationTypes.length > 0 ? (
                                                                    filteredOperationTypes.map((type) => (
                                                                        <SelectItem key={type.id} value={type.name}>
                                                                            {type.name}
                                                                        </SelectItem>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-2 py-1.5 text-sm text-gray-500">
                                                                        {searchTerm ? 'No results found' : 'No operation types available'}
                                                                    </div>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        {!isLoadingTypes && operationTypes.length === 0 && !showNewTypeInput && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => setShowNewTypeInput(true)}
                                                            >
                                                                + Create New Operation Type
                                                            </Button>
                                                        )}
                                                        {showNewTypeInput && (
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    placeholder="Enter operation type name"
                                                                    value={newTypeName}
                                                                    onChange={(e) => setNewTypeName(e.target.value)}
                                                                    disabled={isCreatingType}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={handleCreateOperationType}
                                                                    disabled={isCreatingType || !newTypeName.trim()}
                                                                >
                                                                    {isCreatingType ? 'Creating...' : 'Add'}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setShowNewTypeInput(false);
                                                                        setNewTypeName('');
                                                                    }}
                                                                    disabled={isCreatingType}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="opDate"
                                        render={({ field }) => {
                                            const selectedDate = isoToDate(field.value);
                                            return (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel>
                                                        Operation Date <span className="text-xs font-normal text-muted-foreground">({formatHint})</span>
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
                                                                    field.onChange(date ? toISODate(date) : "");
                                                                }}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormItem>
                                            );
                                        }}
                                    />

                                    <SheetFooter>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                editOperation ? 'Update' : 'Add'
                                            )}
                                        </Button>
                                        <SheetClose asChild>
                                            <Button type="button" variant="secondary" disabled={isLoading}>Cancel</Button>
                                        </SheetClose>
                                    </SheetFooter>
                                </div>
                            </form>
                        </Form>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
