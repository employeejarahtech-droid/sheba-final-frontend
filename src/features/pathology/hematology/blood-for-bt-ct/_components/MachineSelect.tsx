import { useState } from "react";
import { Check, ChevronDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useDebounce } from "@/hooks/useDebounce";

interface MachineSelectProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
}

export function MachineSelect({
    value,
    onChange,
    placeholder = "Select machine",
    disabled = false,
}: MachineSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchVal, setSearchVal] = useState("");
    const debouncedSearchVal = useDebounce(searchVal, 400);
    const token = getCookie('accessToken');

    // Fetch machines based on the debounced search term
    const { data: machinesData, isLoading: machinesLoading } = useQuery({
        queryKey: ['machine-select-list', debouncedSearchVal],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/machine?limit=50&search=${encodeURIComponent(debouncedSearchVal)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch machines");
            return res.json();
        },
        enabled: !!token,
        staleTime: 60 * 1000, // Cache for 1 minute
    });

    const machines = machinesData?.data?.items || [];

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            setSearchVal("");
        }
    };

    const filteredMachines = machines.filter((machine: any) => {
        const term = searchVal.toLowerCase().trim();
        if (!term) return true;
        return (
            machine.name?.toLowerCase().includes(term) ||
            machine.description?.toLowerCase().includes(term)
        );
    });

    const displayedMachines = [...filteredMachines.slice(0, 50)];

    const selectedMachine = machines.find((m: any) => String(m.id) === value);

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                        "w-full justify-between h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm",
                        !value && "text-muted-foreground"
                    )}
                    disabled={disabled || machinesLoading}
                >
                    {selectedMachine ? (
                        <div className="flex flex-col items-start text-left min-w-0 flex-1">
                            <span className="font-medium truncate w-full">
                                {selectedMachine.name}
                            </span>
                            {selectedMachine.description && (
                                <span className="text-xs text-muted-foreground animate-none truncate w-full">
                                    {selectedMachine.description}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="truncate">{placeholder}</span>
                    )}
                    {machinesLoading ? (
                        <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                    ) : value ? (
                        <div
                            role="button"
                            tabIndex={0}
                            className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange("");
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange("");
                                }
                            }}
                        >
                            <X className="h-3.5 w-3.5" />
                        </div>
                    ) : (
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search machine by name or description..."
                        value={searchVal}
                        onValueChange={setSearchVal}
                    />
                    <CommandList>
                        {value && (
                            <CommandGroup heading="Actions">
                                <CommandItem
                                    value="clear-selection"
                                    onSelect={() => {
                                        onChange("");
                                        setOpen(false);
                                    }}
                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium cursor-pointer flex items-center"
                                >
                                    <X className="mr-2 h-4 w-4 text-red-500" />
                                    Clear Selection
                                </CommandItem>
                            </CommandGroup>
                        )}
                        {displayedMachines.length === 0 && (
                            <CommandEmpty>
                                {machinesLoading ? "Loading machines..." : "No machine found."}
                            </CommandEmpty>
                        )}
                        <CommandGroup heading={value ? "Machines" : undefined}>
                            {displayedMachines.map((machine: any) => {
                                const displayName = machine.name;
                                const subtitle = machine.description;

                                return (
                                    <CommandItem
                                        key={machine.id}
                                        value={`${machine.name} ${machine.description || ''} ${machine.id}`.toLowerCase()}
                                        onSelect={() => {
                                            // Store the machine name in testCarriedOutBy and ID in machineId
                                            onChange(String(machine.id));
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === String(machine.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium truncate">{displayName}</span>
                                            {subtitle && (
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {subtitle}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
