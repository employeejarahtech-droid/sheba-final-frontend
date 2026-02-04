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

export function CreateDepartmentForm() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (newDepartment: { name: string }) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/department`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newDepartment),
                }
            );
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || "Failed to create department");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Department created successfully");
            queryClient.invalidateQueries({ queryKey: ["deparmtent"] });
            setOpen(false);
            setName("");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to create department");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Department name is required");
            return;
        }

        createMutation.mutate({ name });
    };

    const handleCancel = () => {
        setOpen(false);
        setName("");
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
                <SheetHeader>
                    <SheetTitle>Add New Department</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6 p-4">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label>Department Name</Label>
                            <Input
                                placeholder="Enter department name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
