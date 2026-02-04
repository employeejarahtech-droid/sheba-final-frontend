
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
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface AddressDetails {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
}

interface AddressAutocompleteProps {
    placeholder?: string;
    value?: string;
    onAddressSelect: (details: AddressDetails) => void;
    onChange?: (value: string) => void;
}

export function AddressAutocomplete({
    placeholder = "Search address...",
    value,
    onAddressSelect,
    onChange,
}: AddressAutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || "");

    // Mock addresses since we don't have a real geocoding API set up yet
    const mockAddresses = [
        {
            label: "123 Main St, Kuala Lumpur, 50000, Malaysia",
            value: "123 Main St, Kuala Lumpur, 50000, Malaysia",
            details: {
                address: "123 Main St",
                city: "Kuala Lumpur",
                state: "Kuala Lumpur",
                postalCode: "50000",
                country: "Malaysia",
                latitude: 3.139,
                longitude: 101.6869,
            },
        },
        {
            label: "456 Penang Rd, Georgetown, 10000, Malaysia",
            value: "456 Penang Rd, Georgetown, 10000, Malaysia",
            details: {
                address: "456 Penang Rd",
                city: "Georgetown",
                state: "Penang",
                postalCode: "10000",
                country: "Malaysia",
                latitude: 5.4164,
                longitude: 100.3327,
            },
        },
    ];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal text-left"
                >
                    {value || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput
                        placeholder={placeholder}
                        onValueChange={(val) => {
                            setInputValue(val);
                            if (onChange) onChange(val);
                        }}
                    />
                    <CommandList>
                        <CommandEmpty>No address found.</CommandEmpty>
                        <CommandGroup>
                            {mockAddresses.map((addr) => (
                                <CommandItem
                                    key={addr.value}
                                    value={addr.value}
                                    onSelect={(currentValue) => {
                                        if (onChange) onChange(currentValue);
                                        onAddressSelect(addr.details);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === addr.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {addr.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default AddressAutocomplete;
