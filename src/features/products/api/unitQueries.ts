import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Unit } from "@/types/types";

// Query hook to get all units with pagination and search
export function useUnits({ page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {}) {
    return useQuery({
        queryKey: ["units", page, limit, search],
        queryFn: async () => {
            const result = await window.electron.invoke("units:getAll", { page, limit, search });
            return result;
        },
    });
}

// Query hook to get all units (for stats)
export function useAllUnits() {
    return useQuery({
        queryKey: ["units", "all"],
        queryFn: async () => {
            const result = await window.electron.invoke("units:getAll", { limit: 1000 });
            return result;
        },
    });
}

// Query hook to get a single unit by ID
export function useUnit(id: number) {
    return useQuery({
        queryKey: ["units", id],
        queryFn: async () => {
            const result = await window.electron.invoke("units:getById", id);
            return result;
        },
        enabled: !!id,
    });
}

// Mutation hook to add a new unit
export function useAddUnit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Unit>) => {
            const result = await window.electron.invoke("units:create", data);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
        },
    });
}

// Mutation hook to update a unit
export function useUpdateUnit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Unit> }) => {
            const result = await window.electron.invoke("units:update", { id, data });
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
        },
    });
}

// Mutation hook to delete a unit
export function useDeleteUnit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const result = await window.electron.invoke("units:delete", id);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
        },
    });
}
