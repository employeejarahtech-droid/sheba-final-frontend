"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function EditCategoryForm({
    open,
    setOpen,
    categoryId
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    categoryId: number | null;
}) {
    const [name, setName] = useState("");
    const [departmentId, setDepartmentId] = useState("");

    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    // Fetch departments for the dropdown
    const { data: departmentsData } = useQuery({
        queryKey: ["departments-list"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/department?limit=100`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch departments");
            return res.json();
        },
        enabled: open && !!token,
    });

    // Fetch category details
    const { data: categoryData } = useQuery({
        queryKey: ["category", categoryId],
        queryFn: async () => {
            if (!categoryId) return null;
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-category/${categoryId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch category");
            return res.json();
        },
        enabled: !!categoryId && open && !!token,
    });

    // Populate form when data is loaded
    useEffect(() => {
        if (categoryData?.data) {
            setName(categoryData.data.name || "");
            setDepartmentId(String(categoryData.data.department_id || ""));
        }
    }, [categoryData]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (updatedCategory: { name: string; department_id: number }) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-category/${categoryId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updatedCategory),
                }
            );
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || "Failed to update category");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Category updated successfully");
            queryClient.invalidateQueries({ queryKey: ["category"] });
            setOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update category");
        },
    });

    const resetForm = () => {
        setName("");
        setDepartmentId("");
    };

    const handleSubmit = () => {
        if (!categoryId) {
            toast.error("No category selected");
            return;
        }
        if (!departmentId) {
            toast.error("Please select a department");
            return;
        }
        if (!name.trim()) {
            toast.error("Category name is required");
            return;
        }

        updateMutation.mutate({
            name,
            department_id: Number(departmentId),
        });
    };

    const handleCancel = () => {
        setOpen(false);
        resetForm();
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="w-[400px] sm:w-[450px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Update Category</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6 p-4">

                    {/* Department Selection */}
                    <div className="space-y-2">
                        <Label>Department Name</Label>
                        <Select
                            value={departmentId}
                            onValueChange={setDepartmentId}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departmentsData?.data?.items?.map((dept: any) => (
                                    <SelectItem key={dept.id} value={String(dept.id)}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category Name */}
                    <div className="space-y-2">
                        <Label>Category Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter category name"
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
