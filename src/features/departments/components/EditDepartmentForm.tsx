"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getCookie } from "@/lib/cookies";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type DepartmentItem = {
    id: string;
    name: string;
};

export function EditDepartmentForm({
    open,
    setOpen,
    departmentId
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    departmentId: string | null;
}) {
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    // Form state
    const [name, setName] = useState("");

    // Fetch department data when departmentId changes
    const { data: departmentData } = useQuery({
        queryKey: ["department", departmentId],
        queryFn: async () => {
            if (!departmentId) return null;
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/department/${departmentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch department");
            return res.json();
        },
        enabled: !!departmentId && !!token && open,
    });

    // Populate form when department data is loaded
    useEffect(() => {
        if (departmentData?.data) {
            const department = departmentData.data;
            setName(department.name || "");
        }
    }, [departmentData]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (updatedDepartment: Partial<DepartmentItem>) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/department/${departmentId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updatedDepartment),
                }
            );
            if (!res.ok) throw new Error("Failed to update department");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Department updated successfully");
            queryClient.invalidateQueries({ queryKey: ["deparmtent"] });
            setOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update department");
        },
    });

    const resetForm = () => {
        setName("");
    };

    const handleSubmit = () => {
        if (!departmentId) {
            toast.error("No department selected");
            return;
        }

        if (!name.trim()) {
            toast.error("Department name is required");
            return;
        }

        const updatedDepartment = {
            name,
        };

        updateMutation.mutate(updatedDepartment);
    };

    const handleCancel = () => {
        setOpen(false);
        resetForm();
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="w-[400px] sm:w-[450px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Update Department</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6 p-4">

                    {/* Department Name */}
                    <div className="space-y-2">
                        <Label>Department Name</Label>
                        <Input
                            placeholder="Enter department name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
