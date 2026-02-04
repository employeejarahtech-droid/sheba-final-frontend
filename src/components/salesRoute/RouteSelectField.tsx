
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { ControllerRenderProps } from "react-hook-form";

interface SalesRouteSelectFieldProps {
    field: ControllerRenderProps<any, any>;
    error?: string;
}

export function SalesRouteSelectField({ field, error }: SalesRouteSelectFieldProps) {
    // Mock routes (you might fetch this from API later)
    const routes = [
        { id: "1", name: "North Route" },
        { id: "2", name: "South Route" },
        { id: "3", name: "East Route" },
        { id: "4", name: "West Route" },
    ];

    return (
        <Field>
            <FieldLabel>Sales Route</FieldLabel>
            <Select key={field.value} onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a route" />
                </SelectTrigger>
                <SelectContent>
                    {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                            {route.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <FieldError>{error}</FieldError>
        </Field>
    );
}
