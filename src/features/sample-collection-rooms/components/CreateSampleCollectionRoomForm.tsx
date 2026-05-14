"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function CreateSampleCollectionRoomForm() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState<"active" | "inactive">("active");
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (newRoom: { name: string; location: string; notes?: string; status: string }) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/sample-collection-rooms`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newRoom),
                }
            );
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || "Failed to create sample collection room");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Sample collection room created successfully");
            queryClient.invalidateQueries({ queryKey: ["sample-collection-rooms"] });
            setOpen(false);
            setName("");
            setLocation("");
            setNotes("");
            setStatus("active");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to create sample collection room");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Room name is required");
            return;
        }

        if (!location.trim()) {
            toast.error("Location is required");
            return;
        }

        createMutation.mutate({
            name,
            location,
            notes: notes || undefined,
            status
        });
    };

    const handleCancel = () => {
        setOpen(false);
        setName("");
        setLocation("");
        setNotes("");
        setStatus("active");
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
                    <SheetTitle>Add New Sample Collection Room</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 p-4 pt-2">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label>Room Name</Label>
                            <Input
                                placeholder="e.g., Room 1 - Main Collection"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                                placeholder="e.g., Ground Floor, 1st Floor"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                                placeholder="Additional notes or instructions..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(value) => setStatus(value as "active" | "inactive")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
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
