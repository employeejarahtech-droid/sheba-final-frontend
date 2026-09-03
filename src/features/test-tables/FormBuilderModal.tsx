"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { CustomFormFieldsBuilder, customFormFieldSchema, fromFormSchema, toFormSchema } from "./CustomFormFieldsBuilder";

const builderSchema = z.object({
    form_fields: z.array(customFormFieldSchema),
});

// Designs the field set for an existing custom-form-designer test table.
// Opened from the test-tables list's Actions column (Custom Form rows only).
// Basic info (table_name/display_name/description/is_custom_form_designer)
// is edited separately via EditTestTableForm — this modal only owns fields,
// and re-sends the row's current basic info as-is on save (PUT /:id requires
// it; form_schema is the only thing this modal actually changes).
export function FormBuilderModal({
    id,
    open,
    setOpen,
}: {
    id: number;
    open: boolean;
    setOpen: (open: boolean) => void;
}) {
    const token = getCookie("accessToken");
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof builderSchema>>({
        resolver: zodResolver(builderSchema),
        defaultValues: { form_fields: [] },
    });

    // Dedicated query key (not shared with EditTestTableForm's ["test-table", id])
    // — both sheets/dialogs are always-mounted siblings in the list page, and
    // sharing a key meant a stale cached value (e.g. from before fields were
    // saved) could be served instead of a fresh fetch. refetchOnMount:'always'
    // forces a real network fetch every time this dialog opens, regardless of
    // cache/staleness timing.
    const { data: testTable, isFetching } = useQuery({
        queryKey: ["test-table-form-builder", id],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-tables/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch test table");
            return res.json();
        },
        enabled: !!token && !!id && open,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
    });

    const row = testTable?.data;

    // Clear immediately on open so a previous session's fields never flash
    // before the fresh fetch resolves.
    useEffect(() => {
        if (open) form.reset({ form_fields: [] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, id]);

    useEffect(() => {
        if (!open || !row || isFetching) return;
        form.reset({ form_fields: fromFormSchema(row.form_schema) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, isFetching, row?.id, row?.form_schema]);

    const saveMutation = useMutation({
        mutationFn: async (values: z.infer<typeof builderSchema>) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-tables/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    table_name: row?.table_name,
                    display_name: row?.display_name,
                    description: row?.description,
                    is_custom_form_designer: true,
                    form_schema: toFormSchema(values.form_fields),
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || "Failed to save form fields");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Form fields saved");
            queryClient.invalidateQueries({ queryKey: ["test-tables"] });
            queryClient.invalidateQueries({ queryKey: ["test-table", id] });
            queryClient.invalidateQueries({ queryKey: ["test-table-form-builder", id] });
            setOpen(false);
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to save form fields");
        },
    });

    const handleSubmit = (values: z.infer<typeof builderSchema>) => {
        if (values.form_fields.length === 0) {
            toast.error("Add at least one field before saving");
            return;
        }
        saveMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Form Builder</DialogTitle>
                    <DialogDescription>
                        {row?.display_name ? `Fields for "${row.display_name}"` : "Design the custom result-entry form"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                        <CustomFormFieldsBuilder control={form.control} name="form_fields" />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={saveMutation.isPending}
                            >
                                Cancel
                            </Button>

                            <Button type="submit" disabled={saveMutation.isPending}>
                                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save Fields
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
