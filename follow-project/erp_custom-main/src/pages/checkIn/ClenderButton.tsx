
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ClenderButtonProps {
    selectedDate: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
    disableOpen?: boolean; //  NEW PROP
}

export default function ClenderButton({
    selectedDate,
    onDateChange,
    disableOpen = false,
}: ClenderButtonProps) {
    return (
        <Popover open={disableOpen ? false : undefined}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disableOpen} //prevent opening
                    className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                        disableOpen && "cursor-not-allowed opacity-60"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>

            {!disableOpen && (
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={onDateChange}
                        autoFocus
                    />
                </PopoverContent>
            )}
        </Popover>
    );
}
