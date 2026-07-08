"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Cpu } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type MachineItem = {
    id: string;
    name: string;
    description?: string;
};

export function EditMachineForm({
    open,
    setOpen,
    machineId
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    machineId: string | null;
}) {
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    // Fetch machine data when machineId changes
    const { data: machineData } = useQuery({
        queryKey: ["machine", machineId],
        queryFn: async () => {
            if (!machineId) return null;
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/machine/${machineId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch machine");
            return res.json();
        },
        enabled: !!machineId && !!token && open,
    });

    // Populate form when machine data is loaded
    useEffect(() => {
        if (machineData?.data) {
            const machine = machineData.data;
            setName(machine.name || "");
            setDescription(machine.description || "");
        }
    }, [machineData]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (updatedMachine: Partial<MachineItem>) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/machine/${machineId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updatedMachine),
                }
            );
            if (!res.ok) throw new Error("Failed to update machine");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Machine updated successfully");
            queryClient.invalidateQueries({ queryKey: ["machine"] });
            setOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update machine");
        },
    });

    const resetForm = () => {
        setName("");
        setDescription("");
    };

    const handleSubmit = () => {
        if (!machineId) {
            toast.error("No machine selected");
            return;
        }

        if (!name.trim()) {
            toast.error("Machine name is required");
            return;
        }

        const updatedMachine = {
            name,
            description,
        };

        updateMutation.mutate(updatedMachine);
    };

    const handleCancel = () => {
        setOpen(false);
        resetForm();
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="w-[400px] sm:w-[450px] overflow-y-auto">
                <SheetHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4 gap-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                            <Cpu className="h-4 w-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold">
                                Update Machine
                            </SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Modify machine name and description
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-6 p-4 pt-2">

                    {/* Machine Name */}
                    <div className="space-y-2">
                        <Label>Machine Name</Label>
                        <Input
                            placeholder="Enter machine name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            placeholder="Enter description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-center gap-5">
                        <Button
                            onClick={handleCancel}
                            variant="outline"
                            disabled={updateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? "Updating..." : "Update"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
