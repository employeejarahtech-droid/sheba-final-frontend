
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { useGetAllSalesRouteQuery } from "@/store/features/salesRoute/salesRoute";
import type { SalesRoute } from "@/types/salesRoute.types";
import { Check } from "lucide-react";

export function SalesRouteSelectField({
    field,
    error,
}: {
    field: { value?: string; onChange: (v: string) => void };
    error?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const { data, isLoading } = useGetAllSalesRouteQuery({
        page: 1,
        limit: 50,
        search: query,
    });

    const list: SalesRoute[] = Array.isArray(data?.data) ? data.data : [];
    const selected = list.find((r) => String(r.id) === field.value);


    const selectRoute = (id: string) => {
        field.onChange(id); // set the selected route directly
        setOpen(false); // close the popover after selection
    };

    return (
        <div className="flex flex-col gap-1">
            <label className="font-medium">Assign Sales Route</label>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        {selected ? selected.route_name : "Select Sales Route..."}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[320px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search routes..."
                            onValueChange={(value) => setQuery(value)}
                        />
                        <CommandList>
                            <CommandEmpty>No routes found.</CommandEmpty>
                            <CommandGroup>
                                {isLoading && (
                                    <div className="py-2 px-3 text-sm text-gray-500">
                                        Loading...
                                    </div>
                                )}
                                {!isLoading &&
                                    list.map((route) => (
                                        <CommandItem
                                            key={route.id}
                                            onSelect={() => selectRoute(String(route.id))}
                                            className="flex justify-between items-center"
                                        >
                                            <span>{route.route_name}</span>
                                            {field.value === String(route.id) && <Check className="w-4 h-4 text-green-500" />}

                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );
}
