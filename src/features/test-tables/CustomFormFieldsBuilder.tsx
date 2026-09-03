"use client";

import { useEffect, useState } from "react";
import { Control, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, GripVertical } from "lucide-react";

// Mirrors sheba-api's test-tables.validation.js fieldDefSchema.
export const customFormFieldSchema = z.object({
    key: z.string().min(1, "Required").regex(/^[a-z][a-z0-9_]*$/, "lowercase letters/numbers/underscore, must start with a letter"),
    label: z.string().min(1, "Required"),
    type: z.enum(["text", "number", "textarea", "select"]),
    unit: z.string().optional(),
    normal_range: z.string().optional(),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
    // UI-only convenience field; joined into `options` on submit (not sent to the API directly).
    optionsText: z.string().optional(),
}).refine(
    (f) => f.type !== "select" || (f.optionsText && f.optionsText.split(",").some((o) => o.trim())),
    { message: "Select fields need at least one option", path: ["optionsText"] }
);

export type CustomFormFieldValues = z.infer<typeof customFormFieldSchema>;

export function slugifyKey(label: string) {
    const slug = label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    return slug && /^[0-9]/.test(slug) ? `f_${slug}` : slug;
}

const FIELD_TYPES: { value: CustomFormFieldValues["type"]; label: string }[] = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "textarea", label: "Textarea" },
    { value: "select", label: "Select (options)" },
];

export function CustomFormFieldsBuilder({ control, name = "form_fields" }: { control: Control<any>; name?: string }) {
    const { fields, append, remove } = useFieldArray({ control, name });
    // Rows whose Key the admin has manually edited — label changes stop
    // auto-generating the key for that row once they've typed their own.
    const [manualKey, setManualKey] = useState<Set<string>>(new Set());

    return (
        <div className="space-y-3">
            {fields.length === 0 && (
                <p className="text-xs text-muted-foreground border border-dashed rounded-md px-3 py-4 text-center">
                    No fields yet — add at least one field for this custom form.
                </p>
            )}

            {fields.map((field, index) => (
                <FieldRow
                    key={field.id}
                    control={control}
                    name={name}
                    index={index}
                    onRemove={() => remove(index)}
                    isKeyManual={manualKey.has(field.id)}
                    markKeyManual={() => setManualKey((s) => new Set(s).add(field.id))}
                />
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                    append({ key: "", label: "", type: "text", unit: "", normal_range: "", required: false, optionsText: "" })
                }
            >
                <Plus className="h-4 w-4" /> Add Field
            </Button>
        </div>
    );
}

function FieldRow({
    control,
    name,
    index,
    onRemove,
    isKeyManual,
    markKeyManual,
}: {
    control: Control<any>;
    name: string;
    index: number;
    onRemove: () => void;
    isKeyManual: boolean;
    markKeyManual: () => void;
}) {
    const base = `${name}.${index}`;
    const { setValue } = useFormContext();
    const type = useWatch({ control, name: `${base}.type` });
    const labelValue = useWatch({ control, name: `${base}.label` });

    useEffect(() => {
        if (!isKeyManual && labelValue) {
            setValue(`${base}.key` as any, slugifyKey(labelValue), { shouldValidate: false, shouldDirty: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [labelValue, isKeyManual]);

    return (
        <div className="rounded-md border p-3 space-y-2 relative bg-muted/20">
            <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 mt-2.5 text-muted-foreground shrink-0" />
                <div className="flex-1 grid grid-cols-2 gap-2">
                    <FormField
                        control={control}
                        name={`${base}.label`}
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input placeholder="Field label (e.g. Hemoglobin)" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`${base}.key`}
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        placeholder="field_key"
                                        {...field}
                                        onChange={(e) => {
                                            markKeyManual();
                                            field.onChange(e);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={onRemove}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 pl-6">
                <FormField
                    control={control}
                    name={`${base}.type`}
                    render={({ field }) => (
                        <FormItem>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger className="h-9 text-sm w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {FIELD_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name={`${base}.unit`}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input placeholder="Unit (e.g. g/dL)" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name={`${base}.normal_range`}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input placeholder="Normal range" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>

            {type === "select" && (
                <FormField
                    control={control}
                    name={`${base}.optionsText`}
                    render={({ field }) => (
                        <FormItem className="pl-6">
                            <FormControl>
                                <Input placeholder="Options, comma-separated (e.g. A,B,AB,O)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            <FormField
                control={control}
                name={`${base}.required`}
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 pl-6 space-y-0">
                        <FormControl>
                            <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <span className="text-sm">Required</span>
                    </FormItem>
                )}
            />
        </div>
    );
}

// Converts the builder's row shape (with the UI-only optionsText convenience
// field) into the API's form_schema shape: {key,label,type,unit,normal_range,required,options,sort_order}.
export function toFormSchema(rows: CustomFormFieldValues[]) {
    return rows.map((r, i) => ({
        key: r.key,
        label: r.label,
        type: r.type,
        unit: r.unit || undefined,
        normal_range: r.normal_range || undefined,
        required: !!r.required,
        options: r.type === "select" ? (r.optionsText || "").split(",").map((o) => o.trim()).filter(Boolean) : undefined,
        sort_order: i,
    }));
}

// Converts an API form_schema back into the builder's row shape for editing.
export function fromFormSchema(schema: any[] | null | undefined): CustomFormFieldValues[] {
    if (!Array.isArray(schema)) return [];
    return schema.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        unit: f.unit || "",
        normal_range: f.normal_range || "",
        required: !!f.required,
        optionsText: Array.isArray(f.options) ? f.options.join(", ") : "",
    }));
}
