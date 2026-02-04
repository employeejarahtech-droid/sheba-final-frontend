"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function CreateCategoryForm() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [departmentId, setDepartmentId] = useState("");

    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    // Fetch departments for the dropdown
    const { data: departmentsData } = useQuery({
        queryKey: ["departments-list"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/department?limit=100`, // Fetch enough departments
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch departments");
            return res.json();
        },
        enabled: open && !!token,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (newCategory: { name: string; department_id: number }) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-category`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newCategory),
                }
            );
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || "Failed to create category");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Category created successfully");
            queryClient.invalidateQueries({ queryKey: ["category"] });
            setOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to create category");
        },
    });

    const resetForm = () => {
        setName("");
        setDepartmentId("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!departmentId) {
            toast.error("Please select a department");
            return;
        }
        if (!name.trim()) {
            toast.error("Category name is required");
            return;
        }

        createMutation.mutate({
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
            {/* Trigger Button */}
            <SheetTrigger asChild>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add New
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[400px] sm:w-[450px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Add New Category</SheetTitle>
                </SheetHeader>

                <div className="mt-6 p-4">
                    <form onSubmit={handleSubmit} className="space-y-6">

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
                                placeholder="Enter a category name"
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex justify-center gap-5">
                            <Button
                                type="button"
                                onClick={handleCancel}
                                variant="outline"
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
