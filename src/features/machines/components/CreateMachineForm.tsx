"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function CreateMachineForm() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (newMachine: { name: string; description?: string }) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/machine`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newMachine),
                }
            );
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || "Failed to create machine");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Machine created successfully");
            queryClient.invalidateQueries({ queryKey: ["machine"] });
            setOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to create machine");
        },
    });

    const resetForm = () => {
        setName("");
        setDescription("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Machine name is required");
            return;
        }

        createMutation.mutate({ name, description });
    };

    const handleCancel = () => {
        setOpen(false);
        resetForm();
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {/* Trigger Button */}
            <SheetTrigger asChild>
                <Button onClick={() => setOpen(true)}>
                    <Plus size={18} />
                    Add New
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[400px] sm:w-[450px] overflow-y-auto">
                <SheetHeader className="pb-0">
                    <SheetTitle>Add New Machine</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 p-4 pt-2">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label>Machine Name</Label>
                            <Input
                                placeholder="Enter machine name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="Enter description (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-center gap-5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={createMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? "Adding..." : "Add"}
                            </Button>
                        </div>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
