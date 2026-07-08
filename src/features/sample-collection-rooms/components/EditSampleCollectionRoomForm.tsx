"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2 } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type SampleCollectionRoomItem = {
    id: string;
    name: string;
    location: string;
    notes?: string;
    status: "active" | "inactive";
};

export function EditSampleCollectionRoomForm({
    open,
    setOpen,
    roomId
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    roomId: string | null;
}) {
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    // Form state
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState<"active" | "inactive">("active");

    // Fetch room data when roomId changes
    const { data: roomData } = useQuery({
        queryKey: ["sample-collection-room", roomId],
        queryFn: async () => {
            if (!roomId) return null;
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/sample-collection-rooms/${roomId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch sample collection room");
            return res.json();
        },
        enabled: !!roomId && !!token && open,
    });

    // Populate form when room data is loaded
    useEffect(() => {
        if (roomData?.data) {
            const room = roomData.data;
            setName(room.name || "");
            setLocation(room.location || "");
            setNotes(room.notes || "");
            setStatus(room.status || "active");
        }
    }, [roomData]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (updatedRoom: Partial<SampleCollectionRoomItem>) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/sample-collection-rooms/${roomId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updatedRoom),
                }
            );
            if (!res.ok) throw new Error("Failed to update sample collection room");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Sample collection room updated successfully");
            queryClient.invalidateQueries({ queryKey: ["sample-collection-rooms"] });
            setOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update sample collection room");
        },
    });

    const resetForm = () => {
        setName("");
        setLocation("");
        setNotes("");
        setStatus("active");
    };

    const handleSubmit = () => {
        if (!roomId) {
            toast.error("No room selected");
            return;
        }

        if (!name.trim()) {
            toast.error("Room name is required");
            return;
        }

        if (!location.trim()) {
            toast.error("Location is required");
            return;
        }

        const updatedRoom = {
            name,
            location,
            notes: notes || undefined,
            status
        };

        updateMutation.mutate(updatedRoom);
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
                            <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold">
                                Update Sample Collection Room
                            </SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Modify room details, location, and availability status
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-6 p-4 pt-2">

                    {/* Room Name */}
                    <div className="space-y-2">
                        <Label>Room Name</Label>
                        <Input
                            placeholder="e.g., Room 1 - Main Collection"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                            placeholder="e.g., Ground Floor, 1st Floor"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    {/* Notes */}
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

                    {/* Status */}
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
