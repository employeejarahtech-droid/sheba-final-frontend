import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getCookie } from "@/lib/cookies";

/**
 * Global address master comboboxes (countries + division/district/thana hierarchy).
 *
 * Values are NAME strings — admissions store denormalized location names
 * (same convention as patient_type). onChange returns the full row so callers
 * can capture the id for cascading child selects.
 *
 * Standalone by design (no react-hook-form FormControl inside) so the same
 * component serves both form fields and list-page filter bars; extra props
 * are spread onto the trigger button.
 */

export interface LocationOption {
    id: number;
    name: string;
    bn_name?: string | null;
    level?: string;
    parent_id?: number | null;
    country_id?: number | null;
    iso2?: string | null;
}

const TRIGGER_BASE =
    "w-full justify-between h-10 rounded-md border border-input bg-transparent text-sm shadow-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring font-normal";

interface LocationComboboxProps {
    options: LocationOption[];
    loading: boolean;
    value: string;
    onChange: (row: LocationOption | null) => void;
    placeholder: string;
    searchPlaceholder: string;
    disabled?: boolean;
    emptyLabel?: string;
    className?: string;
    [key: string]: any;
}

function LocationCombobox({
    options,
    loading,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    disabled = false,
    emptyLabel = "No location found.",
    className,
    ...triggerProps
}: LocationComboboxProps) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.name === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn(TRIGGER_BASE, className, !value && "text-muted-foreground")}
                    disabled={disabled || loading}
                    {...triggerProps}
                >
                    <span className="truncate">{selected ? selected.name : placeholder}</span>
                    {loading ? (
                        <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                    ) : value ? (
                        <div
                            role="button"
                            tabIndex={0}
                            className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange(null);
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
            <PopoverContent className="w-[360px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        {value && (
                            <CommandGroup heading="Actions">
                                <CommandItem
                                    value="clear-selection"
                                    onSelect={() => {
                                        onChange(null);
                                        setOpen(false);
                                    }}
                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium cursor-pointer flex items-center"
                                >
                                    <X className="mr-2 h-4 w-4 text-red-500" />
                                    Clear Selection
                                </CommandItem>
                            </CommandGroup>
                        )}
                        {options.length === 0 && (
                            <CommandEmpty>{loading ? "Loading..." : emptyLabel}</CommandEmpty>
                        )}
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={`${option.name} ${option.bn_name || ""} ${option.id}`.toLowerCase()}
                                    onSelect={() => {
                                        onChange(option);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="font-medium">{option.name}</span>
                                    {option.bn_name && (
                                        <span className="ml-2 text-xs text-muted-foreground">{option.bn_name}</span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function useAddressOptions(queryKey: unknown[], url: string, enabled: boolean) {
    const token = getCookie('accessToken');
    const { data, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch address locations");
            return res.json();
        },
        enabled: !!token && enabled,
        staleTime: 24 * 60 * 60 * 1000, // static master data — cache for a day
    });
    const items: LocationOption[] = data?.data?.items || [];
    return { items, isLoading };
}

export interface LocationSelectProps {
    level: 'division' | 'district' | 'thana';
    /** division: countryId; district/thana: parentId of the selected parent row */
    parentId?: string | number | null;
    countryId?: string | number | null;
    value: string;
    onChange: (row: LocationOption | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    [key: string]: any;
}

const LEVEL_LABELS: Record<string, string> = {
    division: 'Division / State',
    district: 'District',
    thana: 'Thana / Upazila',
};

export function LocationSelect({
    level,
    parentId,
    countryId,
    value,
    onChange,
    placeholder,
    disabled = false,
    className,
    ...rest
}: LocationSelectProps) {
    const parentKey = level === 'division' ? (countryId ?? null) : (parentId ?? null);
    // Divisions can load without a country context (list-page filter bars have
    // no country select — the server then returns divisions across countries).
    const enabled = level === 'division' ? true : !!parentId;

    const parentParam = level === 'division'
        ? (countryId ? `&country_id=${countryId}` : '')
        : `&parent_id=${parentId}`;
    const url = `${import.meta.env.VITE_API_URL}/api/address-location?level=${level}${parentParam}&limit=1000`;

    const { items, isLoading } = useAddressOptions(
        ['address-locations', level, String(parentKey ?? '')],
        url,
        enabled
    );

    return (
        <LocationCombobox
            options={items}
            loading={enabled && isLoading}
            value={value}
            onChange={onChange}
            placeholder={placeholder || `Select ${LEVEL_LABELS[level].toLowerCase()}`}
            searchPlaceholder={`Search ${LEVEL_LABELS[level].toLowerCase()}...`}
            disabled={disabled || !enabled || (enabled && isLoading)}
            emptyLabel={
                enabled
                    ? "No location found."
                    : `Select a ${level === 'district' ? 'division' : 'district'} first.`
            }
            className={className}
            {...rest}
        />
    );
}

export interface CountrySelectProps {
    value: string;
    onChange: (row: LocationOption | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    [key: string]: any;
}

export function CountrySelect({
    value,
    onChange,
    placeholder = 'Select country',
    disabled = false,
    className,
    ...rest
}: CountrySelectProps) {
    const { items, isLoading } = useAddressOptions(
        ['address-countries'],
        `${import.meta.env.VITE_API_URL}/api/address-location/countries?limit=500`,
        true
    );

    return (
        <LocationCombobox
            options={items}
            loading={isLoading}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            searchPlaceholder="Search country..."
            disabled={disabled}
            emptyLabel="No country found."
            className={className}
            {...rest}
        />
    );
}
